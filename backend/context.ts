import { buildSchema } from '@typegoose/typegoose'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { classify, tableize } from 'inflection'
import { Dictionary, map, mapValues, pickBy, zipObject } from 'lodash'
import mongoose, { Schema, SchemaType, SchemaTypeOpts } from 'mongoose'
import FolderClass from './models/folder_class'
import Site, { SiteClass } from './models/site'

const internalTypeToMongooseType = (field: any) => {
	switch (field.type) {
		case 'string':
		case 'image':
		case 'html':
			return {type: String}
		case 'select':
			return {
				type: String,
				enum: Object.keys(field.options)
			}
		case 'boolean':
			return {type: Boolean}
		case 'number':
		case 'money': // TODO: this needs to change
			return {type: Number}
		case 'date':
			return {type: Date}
	}
}
const fieldToMongooseField = (site: SiteClass) => (
	field: any
): SchemaTypeOpts<any> | Schema | SchemaType => {
	console.log('Converting', field)
	let mongooseType = {
		...internalTypeToMongooseType(field),
		required: !!field.required
	}

	if (field.localized) {
		return zipObject(
			site.supportedLanguages,
			map(site.supportedLanguages, () => mongooseType)
		)
	} else {
		return mongooseType
	}
}

export default class Context {
	static all: Dictionary<Context> = {}
	models: {[model: string]: mongoose.Model<mongoose.Document>}
	folders: {[model: string]: ModelType<FolderClass>}
	db: mongoose.Connection
	private site: SiteClass

	static async prepareAll() {
		const sites = await Site.find()
		for (let site of sites) {
			this.all[String(site._id)] = new Context(site)
		}
	}

	private constructor(site: SiteClass) {
		this.db = mongoose.connection.useDb(site.key)
		this.site = site

		this.models = mapValues(
			site.documentTypes,
			(documentDefinition, documentType) => {
				let model: ModelType<FolderClass>
				const schema = this.buildDocumentSchema(site, documentDefinition, documentType)
					.method('context', () => this)
					.method('model', () => model)
					.set('strict', true)

				model = this.db.model(this.modelName(documentType), schema, tableize(documentType))
				return model
			}
		)

		const catalogsWithFolders = pickBy(site.documentTypes, schema => schema.hasFolders)
		this.folders = mapValues(catalogsWithFolders, (_, documentType) => {
			let model: ModelType<FolderClass>
			const modelName = `${classify(site.key)}::${classify(documentType)}Folder`
			const schema = buildSchema(FolderClass)
				.path('parent', {type: Schema.Types.ObjectId, ref: modelName})
				.method('context', () => this)
				.method('model', () => model)
				.set('strict', true)

			model = this.db.model(
				modelName,
				schema,
				`${tableize(documentType)}_folders`
			)
			return model
		})
	}

	modelName(documentType: string) {
		return `${classify(this.site.key)}::${classify(documentType)}`
	}

	buildDocumentSchema(site: SiteClass, documentDefinition: any, documentType: string) {
		if (site.key !== 'arbat') return new Schema()
		const folderRef = `${classify(site.key)}::${classify(documentType)}Folder`
		if (site.key === 'arbat') {
			console.log('>...')
			console.log(mapValues(documentDefinition.fields, fieldToMongooseField(site)))
		}
		return new Schema(
			{
				deleted: Boolean,
				position: Number,
				folder: {type: Schema.Types.ObjectId, ref: folderRef},
				site: {type: Schema.Types.ObjectId, ref: 'Site'},
				...mapValues(documentDefinition.fields, fieldToMongooseField(site))
			},
			{timestamps: true}
		)
	}

	static get(site: SiteClass) {
		return this.all[String(site._id)]
	}
}

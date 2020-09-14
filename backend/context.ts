import { buildSchema } from '@typegoose/typegoose'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { classify, tableize } from 'inflection'
import { Dictionary, map, mapValues, pickBy, toPairs, zipObject } from 'lodash'
import mongoose, { Schema, SchemaType, SchemaTypeOpts } from 'mongoose'
import { Folder, Item, Site } from './models'

export default class Context {
	static all: Dictionary<Context> = {}
	models: {[model: string]: mongoose.Model<mongoose.Document>}
	folders: {[model: string]: ModelType<Folder>}
	db: mongoose.Connection
	site: Site

	static async prepareAll() {
		const sites = await Site.model().find()
		for (let site of sites) {
			this.all[String(site._id)] = new Context(site)
		}
	}

	private internalTypeToMongooseType(field: any) {
		switch (field.type) {
			case 'string':
			case 'image':
			case 'html':
				return {type: String}
			case 'select':
				if (field.options) {
					return {
						type: String,
						enum: Object.keys(field.options)
					}
				} else {
					return {type: Schema.Types.ObjectId, ref: this.modelName(field.documentType)}
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

	private fieldToMongooseField(field: any): SchemaTypeOpts<any> | Schema | SchemaType {
		let mongooseType = {
			...this.internalTypeToMongooseType(field),
			required: !!field.required
		}

		if (field.localized) {
			return zipObject(
				this.site.supportedLanguages,
				map(this.site.supportedLanguages, () => mongooseType)
			)
		} else {
			return mongooseType
		}
	}


	private constructor(site: Site) {
		this.db = mongoose.connection.useDb(site.key)
		this.site = site

		this.models = mapValues(
			site.documentTypes,
			(documentDefinition, documentType) => {
				let model: ModelType<Folder>
				const schema = this.buildDocumentSchema(
					site,
					documentDefinition,
					documentType
				)
					.method('context', () => this)
					.method('model', () => model)
					.method('managedSchema', () => documentDefinition)
					.method('managedSchemaRef', () => documentType)
					.set('strict', true)

				model = this.db.model(
					this.modelName(documentType),
					schema,
					tableize(documentType)
				)
				return model
			}
		)

		const catalogsWithFolders = pickBy(
			site.documentTypes,
			schema => schema.hasFolders
		)
		this.folders = mapValues(
			catalogsWithFolders,
			(documentDefinition, documentType) => {
				let model: ModelType<Folder>
				const modelName = `${classify(site.key)}::${classify(
					documentType
				)}Folder`
				const schema = buildSchema(Folder)
					.path('parent', {type: Schema.Types.ObjectId, ref: modelName})
					.method('context', () => this)
					.method('model', () => model)
					.method('managedSchema', () => documentDefinition)
					.method('managedSchemaRef', () => documentType)
					.set('strict', true)

				model = this.db.model(
					modelName,
					schema,
					`${tableize(documentType)}_folders`
				)
				return model
			}
		)
	}

	modelName(documentType: string) {
		return `${classify(this.site.key)}::${classify(documentType)}`
	}

	buildDocumentSchema(
		site: Site,
		documentDefinition: any,
		documentType: string
	) {
		const folderRef = `${classify(site.key)}::${classify(documentType)}Folder`
		return toPairs(documentDefinition.fields)
			.reduce(
				(schema, [field, fieldSchema]) =>
					schema.path(field, this.fieldToMongooseField(fieldSchema)),
				buildSchema(Item, {

				})
			)
			.path('folder', { type: Schema.Types.ObjectId, ref: folderRef })
	}

	static get(site: Site) {
		return this.all[String(site._id)]
	}
}

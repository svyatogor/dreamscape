import Site, {SiteClass} from './models/site'
import mongoose, {Schema, SchemaTypeOpts, SchemaType} from 'mongoose'
import {classify, tableize} from 'inflection'
import {map, Dictionary, mapValues, zipObject} from 'lodash'

const internalTypeToMongooseType = (field: any) => {
	switch (field.type) {
		case 'string':
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

	static async prepareAll() {
		const all = await Site.find()
		for (let site of all) {
			all[String(site._id)] = new Context(site)
		}
	}

	private constructor(site: SiteClass) {
		this.models = mapValues(
			site.documentTypes,
			(documentDefinition, documentType) => {
				const schema = new Schema(
					mapValues(documentDefinition, fieldToMongooseField(site))
				)
				return mongoose.connection
					.useDb(site.key)
					.model(classify(documentType), schema, tableize(documentType))
			}
		)
	}

	static get(site: SiteClass) {
		return this.all[String(site._id)]
	}
}

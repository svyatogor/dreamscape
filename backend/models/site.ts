import {
	buildSchema,
	DocumentType,
	getModelForClass,
	getName,
	modelOptions,
	post,
	prop,
	ReturnModelType
} from '@typegoose/typegoose'
import { Base } from '@typegoose/typegoose/lib/defaultClasses'
import { AnyParamConstructor } from '@typegoose/typegoose/lib/types'
import DataLoader from 'dataloader'
import fs from 'fs'
import { classify, humanize, tableize } from 'inflection'
import {
	Dictionary,
	forEach,
	map,
	mapValues,
	pickBy,
	toPairs,
	zipObject
} from 'lodash'
import mongoose, { Schema, SchemaType, SchemaTypeOpts } from 'mongoose'
import nunjucks from 'nunjucks'
import { FileList, Folder, Item, Page, StaticText } from '.'
import * as tags from '../renderers/tags'

@modelOptions({
	schemaOptions: {
		collection: 'sites'
	}
})
@post<Site>('init', site => site.postInit())
export default class Site extends Base {
	private env: nunjucks.Environment | undefined
	private siteDB!: mongoose.Connection
	private _folderModels: Dictionary<ReturnModelType<typeof Folder>>
	private _documentModels: Dictionary<ReturnModelType<typeof Item>>

	public StaticText!: ReturnModelType<typeof StaticText>
	public FileList!: ReturnModelType<typeof FileList>
	public Page!: ReturnModelType<typeof Page>
	public Folder(catalog: string) {
		return this._folderModels[catalog]
	}
	public Item(catalog: string) {
		return this._documentModels[catalog]
	}

	@prop({required: true})
	public key!: string

	@prop({items: String})
	public domains: string[]

	@prop({items: String})
	allowedModules: string[]

	@prop({items: String})
	supportedLanguages: string[]

	@prop({items: String})
	users: string[]

	@prop({items: String})
	features: string[]

	@prop()
	//TODO: [TS] Define document types
	documentTypes: Dictionary<any>

	@prop()
	eshop: {[x: string]: object}

	get layouts() {
		const layoutNames = fs
			.readdirSync(`../data/${this.key}/layouts`)
			.filter(name => name.indexOf('.') !== 0)
		const layoutValues = layoutNames.map(layout => {
			const layoutInfo = this.layoutInfo(layout)
			return {
				name: humanize(layout.replace('-', '_')),
				sections: layoutInfo.sections,
				properties: layoutInfo.properties
			}
		})
		return zipObject(layoutNames, layoutValues)
	}

	layoutInfo(this: Site, layout: string) {
		if (!this.env) {
			console.log('Creating new nunjucks env')
			this.env = nunjucks.configure(`../data/${this.key}/layouts`)
			this.env.addFilter('currency', () => null)
			this.env.addFilter('initials', () => null)
			this.env.addFilter('setQS', () => null)
			this.env.addFilter('date', () => null)
			forEach(tags, (tag, name) => {
				this.env.addExtension(name, new tag() as any) //TODO: [TS] Convert tags and remove any cast
			})
		}

		if (!fs.existsSync(`../data/${this.key}/layouts/${layout}/index.html`)) {
			return {}
		}
		try {
			const context = {inspect: true, sections: [], properties: {}}
			this.env.render(`${layout}/index.html`, context)
			return {
				sections: zipObject(
					context.sections,
					context.sections.map(s => ({name: humanize(s)}))
				),
				properties: context.properties
			}
		} catch (e) {
			console.log(e)
			return {}
		}
	}

	syncFile(file: string) {
		// TODO:
		// if (file.indexOf('layouts') !== 0) {
		// 	return Promise.resolve()
		// }
		// const client = s3.createClient({s3Options: {region: 'eu-west-1'}})
		// return new Promise((resolve, reject) => {
		// 	const downloader = client.downloadFile({
		// 		localFile: `./data/${this.key}/${file}`,
		// 		s3Params: {
		// 			Bucket: process.env.S3_BUCKET,
		// 			Key: `${this.key}/${file}`
		// 		}
		// 	})
		// 	downloader.on('error', err => {
		// 		// TODO: Report error
		// 		console.error(`Error syncing ${this.key}/${file}`, err)
		// 		reject(err)
		// 	})
		// 	downloader.on('end', () => {
		// 		console.error(`Done syncing ${this.key}/${file}`)
		// 		resolve()
		// 	})
		// })
	}

	private static loaderByID = new DataLoader<
		mongoose.Types.ObjectId | string,
		DocumentType<Site>
	>(
		async ids => {
			const sites = await SiteModel.find()
				.where('_id')
				.in([...ids])
			sites.forEach(site => {
				Site.loaderByKey.prime(site.key, site)
				site.domains.forEach(domain =>
					Site.loaderByHostname.prime(domain, site)
				)
			})
			return ids.map(id => sites.find(s => s._id.equals(id)))
		},
		{
			cacheKeyFn: String
		}
	)

	private static loaderByKey = new DataLoader<string, DocumentType<Site>>(
		async keys => {
			const sites = await SiteModel.find()
				.where('key')
				.in([...keys])
			sites.forEach(site => {
				Site.loaderByID.prime(site._id, site)
				site.domains.forEach(domain =>
					Site.loaderByHostname.prime(domain, site)
				)
			})
			return keys.map(key => sites.find(s => s.key === key))
		}
	)

	private static loaderByHostname = new DataLoader<string, DocumentType<Site>>(
		async ([hostname]) => {
			const site = await SiteModel.find().findOne({
				domains: {$elemMatch: {$regex: new RegExp(hostname, 'i')}}
			})
			Site.loaderByID.prime(site._id, site)
			Site.loaderByKey.prime(site.key, site)
			return [site]
		},
		{batch: false, cacheKeyFn: hostname => hostname.toLocaleLowerCase()}
	)

	static async load(idOrKey: mongoose.Types.ObjectId | string) {
		if (
			idOrKey instanceof mongoose.Types.ObjectId ||
			mongoose.Types.ObjectId.isValid(idOrKey)
		) {
			return this.loaderByID.load(idOrKey)
		} else {
			return this.loaderByKey.load(idOrKey as string)
		}
	}

	static async loadByHostname(hostname: string) {
		return this.loaderByHostname.load(hostname)
	}

	static get all() {
		return SiteModel.find()
	}

	reload(this: DocumentType<Site>) {
		Site.loaderByID.clear(this.id)
		Site.loaderByKey.clear(this.key)
	}

	private postInit(this: DocumentType<Site>) {
		this.siteDB = mongoose.connection.useDb(this.key)
		this.StaticText = this.buildManagedModel(StaticText)
		this.FileList = this.buildManagedModel(FileList)
		this.Page = this.buildManagedModel(Page)

		const catalogsWithFolders = pickBy(
			this.documentTypes,
			schema => schema.hasFolders
		)
		this._folderModels = mapValues(catalogsWithFolders, (_, documentType) =>
			this.buildManagedModel(Folder, `${classify(documentType)}Folder`)
		)

		this._documentModels = mapValues(
			this.documentTypes,
			(documemtDefinition, documentType) =>
				this.buildDocumentModel(documemtDefinition, documentType)
		)
	}

	private buildManagedSchema<U extends AnyParamConstructor<any>>(
		this: DocumentType<Site>,
		cl: U,
		modelName: string
	): mongoose.Schema<U> {
		const schema = buildSchema(cl)
		schema.virtual('modelName').get(() => modelName)
		schema.virtual('site').get(() => this)
		schema.virtual('model').get(() => this.siteDB.model(modelName))

		return schema
	}

	private buildManagedModel<U extends AnyParamConstructor<any>>(
		this: DocumentType<Site>,
		cl: U,
		klassName?: string
	): ReturnModelType<U> {
		const baseName = klassName || getName(cl)
		const modelName = `${classify(this.key)}::${baseName}`

		return this.siteDB.model(
			modelName,
			this.buildManagedSchema(cl, modelName),
			tableize(baseName)
		) as ReturnModelType<U>
	}

	private internalTypeToMongooseType(this: DocumentType<Site>, field: any) {
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
					return {
						type: Schema.Types.ObjectId,
						ref: `${classify(this.key)}::${classify(field.documentType)}`
					}
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

	private fieldToMongooseField(
		this: DocumentType<Site>,
		field: any
	): SchemaTypeOpts<any> | Schema | SchemaType {
		let mongooseType = {
			...this.internalTypeToMongooseType(field),
			required: !!field.required
		}

		if (field.localized) {
			return zipObject(
				this.supportedLanguages,
				map(this.supportedLanguages, () => mongooseType)
			)
		} else {
			return mongooseType
		}
	}

	private buildDocumentModel(
		this: DocumentType<Site>,
		documentDefinition: any,
		documentType: string
	) {
		const folderRef = this.getModelName(`${documentType}Folder`)
		const modelName = this.getModelName(documentType)
		let schema = toPairs(documentDefinition.fields)
			.reduce(
				(schema, [field, fieldSchema]) =>
					schema.path(field, this.fieldToMongooseField(fieldSchema)),
				this.buildManagedSchema(Item, modelName)
			)

		if (documentDefinition.hasFolders) {
			schema = schema.path('folder', { type: Schema.Types.ObjectId, ref: folderRef })
		}
		schema.virtual('managedSchema').get(() => documentDefinition)

		return this.siteDB.model(
			modelName,
			schema,
			tableize(documentType)
		) as ReturnModelType<typeof Item>
	}

	getModelName(modelName: string) {
		return `${classify(this.key)}::${classify(modelName)}`
	}
}

const SiteModel = getModelForClass(Site)

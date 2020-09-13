import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { Base } from '@typegoose/typegoose/lib/defaultClasses'
import fs from 'fs'
import { humanize } from 'inflection'
import { forEach, zipObject } from 'lodash'
import nunjucks from 'nunjucks'
import * as tags from '../renderers/tags'

@modelOptions({
	schemaOptions: {
		collection: 'sites'
	}
})
export class SiteClass extends Base {
	private env: nunjucks.Environment | undefined

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
	documentTypes: {[x: string]: any}

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

  layoutInfo(this: SiteClass, layout: string) {
		if (!this.env) {
			this.env = nunjucks.configure(`./data/${this.key}/layouts`)
			this.env.addFilter('currency', () => null)
			this.env.addFilter('initials', () => null)
			this.env.addFilter('setQS', () => null)
			this.env.addFilter('date', () => null)
			forEach(tags, (tag, name) => {
				this.env.addExtension(name, new tag() as any) //TODO: [TS] Convert tags and remove any cast
			})
    }

		if (!fs.existsSync(`./data/${this.key}/layouts/${layout}/index.html`)) {
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
}

export default getModelForClass(SiteClass)

import { DocumentType, isDocument, modelOptions, prop, Severity } from '@typegoose/typegoose'
import { Ref } from '@typegoose/typegoose/lib/types'
import { Dictionary, find, map, mapValues, omit, pickBy, reverse } from 'lodash'
import mongoose from 'mongoose'
import { t } from '../common/utils'
import ManagedObject from './managed_object'
import Site from './site'

@modelOptions({
	schemaOptions: {
		timestamps: true
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export default class Page extends ManagedObject<Page> {
	@prop({required: true})
	public slug!: string

	@prop({required: true, default: false})
	public published!: boolean

	@prop({required: true})
	public layout: string

	@prop({refPath: 'modelName'})
	public parent?: Ref<Page>

	@prop({type: mongoose.Schema.Types.Mixed})
	public title: Dictionary<string>

	@prop()
	public sections: any

	@prop()
	public properties: any

	@prop({required: true, default: 99999})
  public position!: number

  async getPath(this: DocumentType<Page>) {
    const allPages = await this.model.find().select(['_id', 'parent', 'slug'])
    const fullPath = [this.slug]
    let self = this
    while (self.parent) {
      const needle = isDocument(this.parent) ? this.parent._id : this.parent
      const parent = find(allPages, {_id: needle})
      fullPath.push(parent.slug)
      self = parent
    }
    return reverse(fullPath).join('/')
	}

	async url(this: DocumentType<Page>, {locale, site}: {locale: string, site: Site}) {
		if (this.slug.startsWith('http')) {
			return this.slug
		}

		let path = await this.getPath() //TODO: Optimize
		return locale === site.supportedLanguages[0] ? `/${path}` : `/${locale}/${path}`
	}

	async toContext(this: DocumentType<Page>, {locale, site}: {locale: string, site: Site}) {
		const layout = site.layouts[this.layout]
		const localizedProperies = map(
			pickBy(layout.properties, 'localized'),
			'key'
		)
		return {
			...omit(this.toObject({virtuals: true}), ['properties', 'title']),
			title: t(this.title, locale),
			path: await this.getPath(),
			url: await this.url({locale, site}),
			target: this.slug.startsWith('http') ? '_blank' : '_self',
			...mapValues(this.properties, (prop, key) => {
				if (localizedProperies.includes(key)) {
					return t(prop, locale)
				} else {
					return prop
				}
			})
		}
  }
}

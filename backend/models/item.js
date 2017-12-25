import mongoose from 'mongoose'
import {pickBy, pick, mapValues} from 'lodash'
import {itemSchema} from './schema'
import {Site} from '../models'
import {t} from '../common/utils'

class ItemClass {
  async toContext({locale}) {
    const site = await Site.findOne({_id: this.site})
    const object = this.toObject({virtuals: true})
    const fields = site.documentTypes[this.catalog].fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    return object
  }

  toSearchableDocument(schema, locale) {
    const fields = Object.keys(pickBy(schema.fields, field => ['string', 'html'].includes(field.type)))
    return mapValues(pick(this.toObject(), fields), f => t(f, locale))
  }
}

itemSchema.loadClass(ItemClass)
export default mongoose.model('Item', itemSchema)

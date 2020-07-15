import mongoose from 'mongoose'
import {pickBy, pick, mapValues, values, fromPairs, reject, isNil} from 'lodash'
import Promise from 'bluebird'
import {itemSchema} from './schema'
import {Site} from '../models'
import {t} from '../common/utils'

let Item
class ItemClass {
  async toContext({locale}) {
    const site = await Site.findOne({_id: this.site}).cache()
    const object = this.toObject({virtuals: true})
    const fields = site.documentTypes[this.catalog].fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    return object
  }

  async toSearchableDocument(schema, site, locale) {
    const fields = Object.keys(pickBy(schema.fields, field => ['string', 'html'].includes(field.type)))
    const relationFields = pickBy(schema.fields, field => field.documentType)
    const keyedFields = values(mapValues(relationFields, (v, field) => ({...v, field})))
    const relatedLabels = await Promise.map(keyedFields, async ({field, documentType}) => {
      if (!this.get(field)) return null
      const relatedDocument = await Item.findOne({catalog: documentType, site: site._id, _id: this.get(field)})
      if (!relatedDocument) return null
      const labelValue = relatedDocument.get(site.documentTypes[documentType].labelField)
      return [field, labelValue]
    })
    return {...mapValues(pick(this.toObject(), fields), f => t(f, locale)), ...fromPairs(reject(relatedLabels, isNil))}
  }
}

itemSchema.loadClass(ItemClass)
Item = mongoose.model('Item', itemSchema)
export default Item

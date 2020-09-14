import { DocumentType, modelOptions, prop } from '@typegoose/typegoose'
import Promise from 'bluebird'
import { fromPairs, isNil, mapValues, pick, pickBy, reject, values } from 'lodash'
import { t } from '../common/utils'
import ManagedObject from './managed_object'

@modelOptions({
  schemaOptions: {timestamps: true}
})
export default class ItemClass extends ManagedObject<any> {
  @prop({default: false})
  deleted: Boolean

  @prop({default: 0})
  position: Number

  async toContext(this: DocumentType<ItemClass>, {locale}) {
    const object = this.toObject({virtuals: true})
    const fields = this.managedSchema().fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    return object
  }

  async toSearchableDocument(this: DocumentType<ItemClass>, locale: string) {
    const { site } = this.context()
    const schema = this.managedSchema()
    const fields = Object.keys(pickBy(schema.fields, field => ['string', 'html'].includes(field.type)))
    const relationFields = pickBy(schema.fields, field => field.documentType)
    const keyedFields = values(mapValues(relationFields, (v, field) => ({...v, field})))
    const relatedLabels = await Promise.map(keyedFields, async ({field, documentType}) => {
      if (!this.get(field)) return null
      const Item = this.context().models[documentType]
      const relatedDocument = await Item.findById(this.get(field))
      if (!relatedDocument) return null
      const labelValue = relatedDocument.get(site.documentTypes[documentType].labelField)
      return [field, labelValue]
    })
    return {...mapValues(pick(this.toObject(), fields), f => t(f, locale)), ...fromPairs(reject(relatedLabels, isNil))}
  }
}
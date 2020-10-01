import { DocumentType, modelOptions, prop } from '@typegoose/typegoose'
import Promise from 'bluebird'
import { fromPairs, isNil, mapValues, pick, pickBy, reject, values } from 'lodash'
import { t } from '../common/utils'
import ManagedObject from './managed_object'

@modelOptions({
  schemaOptions: {timestamps: true}
})
export default class Item extends ManagedObject<any> {
  @prop({default: false})
  deleted: Boolean

  @prop({default: 0})
  position: Number

  public managedSchema!: any

  async toContext(this: DocumentType<Item>, {locale}) {
    const object = this.toObject({virtuals: true})
    const fields = this.managedSchema.fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    return object
  }

  async toSearchableDocument(this: DocumentType<Item>, locale: string) {
    const schema = this.managedSchema
    const fields = Object.keys(pickBy(schema.fields, field => ['string', 'html'].includes(field.type)))
    const relationFields = pickBy(schema.fields, field => field.documentType)
    const keyedFields = values(mapValues(relationFields, (v, field) => ({...v, field})))
    const relatedLabels = await Promise.map(keyedFields, async ({field, documentType}) => {
      if (!this.get(field)) return null
      //TODO: Consider converting this to populate
      const relatedDocument = await this.model.findById(this.get(field))
      if (!relatedDocument) return null
      const labelValue = relatedDocument.get(this.site.documentTypes[documentType].labelField)
      return [field, labelValue]
    })
    return {...mapValues(pick(this.toObject(), fields), f => t(f, locale)), ...fromPairs(reject(relatedLabels, isNil))}
  }
}
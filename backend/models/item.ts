import { DocumentType, modelOptions, prop } from '@typegoose/typegoose'
import { pickBy } from 'lodash'
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
}
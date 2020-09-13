import { DocumentType, modelOptions, prop } from '@typegoose/typegoose'
import { Ref } from '@typegoose/typegoose/lib/types'
import { Dictionary } from 'lodash'
import { t } from '../common/utils'
import ManagedObject from './managed_object'

@modelOptions({
  schemaOptions: {
    timestamps: true,
  }
})
export default class FolderClass extends ManagedObject<any> {
  @prop()
  public name: Dictionary<string>

  @prop()
  public slug?: string

  @prop({default: 9999, required: true})
  public position?: number

  @prop({default: false})
  public hidden?: boolean

  @prop({default: false})
  public deleted?: boolean

  @prop()
  public parent?: Ref<FolderClass>

  async toContext(this: DocumentType<FolderClass>, { locale }) {
    return {
      ...this.toObject({virtuals: true}),
      name: t(this.get('name'), locale),
      leaf: (await this.model().count({parent: this._id, deleted: false})) === 0
    }
  }
}


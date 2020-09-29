import { buildSchema, DocumentType, modelOptions, prop, Severity } from '@typegoose/typegoose'
import { Ref } from '@typegoose/typegoose/lib/types'
import { Dictionary } from 'lodash'
import { Schema } from 'mongoose'
import { t } from '../common/utils'
import ManagedObject from './managed_object'

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export default class Folder extends ManagedObject<Folder> {
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

  @prop({refPath: 'modelName'})
  public parent?: Ref<Folder>

  async toContext(this: DocumentType<Folder>, { locale }) {
    return {
      ...this.toObject({virtuals: true}),
      name: t(this.get('name'), locale),
      leaf: (await this.model.count({parent: this._id, deleted: false})) === 0
    }
  }

  static schema(modelName: string) {
    return buildSchema(this)
      .set('strict', true)
      .path('parent', {type: Schema.Types.ObjectId, ref: modelName})
  }
}


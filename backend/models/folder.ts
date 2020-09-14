import { DocumentType, modelOptions, prop } from '@typegoose/typegoose'
import { Ref } from '@typegoose/typegoose/lib/types'
import { Dictionary } from 'lodash'
import { t } from '../common/utils'
import Context from '../context'
import ManagedObject from './managed_object'
import Site from './site'

@modelOptions({
  schemaOptions: {
    timestamps: true,
  }
})
export default class Folder extends ManagedObject<any> {
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
  public parent?: Ref<Folder>

  async toContext(this: DocumentType<Folder>, { locale }) {
    return {
      ...this.toObject({virtuals: true}),
      name: t(this.get('name'), locale),
      leaf: (await this.model().count({parent: this._id, deleted: false})) === 0
    }
  }

  static model(site: Site, catalog: string) {
		return Context.get(site).folders[catalog]
	}
}


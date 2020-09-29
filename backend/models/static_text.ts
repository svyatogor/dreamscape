import { DocumentType, modelOptions, prop } from '@typegoose/typegoose'
import { Dictionary } from 'lodash'
import ManagedObject from './managed_object'

@modelOptions({
  schemaOptions: {timestamps: true}
})
export default class StaticText extends ManagedObject<StaticText> {
  @prop()
  public content: Dictionary<string>

  @prop()
  public images: string[]

  @prop()
  public key: String

  @prop({default: false})
  public global: boolean

  @prop()
  public type: String

  async attach(this: DocumentType<StaticText>, file: string) {
    if (!this.images) {
      this.images = []
    }
    this.images.push(file)
    return await this.save()
  }
}

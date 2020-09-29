import { buildSchema } from '@typegoose/typegoose'
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'
import { ModelType } from '@typegoose/typegoose/lib/types'
import Site from './site'

export default class ManagedObject<T> extends TimeStamps {
  public site: Site
  public model: ModelType<T>
  public modelName: String

  static schema(modelName: string) {
    return buildSchema(this)
  }
}

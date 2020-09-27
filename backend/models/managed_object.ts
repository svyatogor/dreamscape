import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'
import { ModelType } from '@typegoose/typegoose/lib/types'
import Context from '../context'

export default abstract class ManagedObject<T> extends TimeStamps {
  public static context(): Context {
    throw new Error('Class should be accessed from context')
  }

  public context(): Context {
    throw new Error('Class should be accessed from context')
  }

  public model(): ModelType<T> {
    throw new Error('Class should be accessed from context')
  }


  public managedSchemaRef(): string {
    throw new Error('Class should be accessed from context')
  }

  public managedSchema(): any {
    throw new Error('Class should be accessed from context')
  }
}

import {staticTextSchema} from './schema'
import mongoose from 'mongoose'
class StaticTextClass {
  attach(file) {
    if (!this.images) {
      this.images = []
    }
    this.images.push(file)
    return this.save()
  }
}

staticTextSchema.loadClass(StaticTextClass)
export default mongoose.connection.useDb(process.env.ROOT_DB).model('StaticText', staticTextSchema)

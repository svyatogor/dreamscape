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
export default mongoose.model('StaticText', staticTextSchema)

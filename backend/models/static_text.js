import {staticTextSchema} from './schema'
import mongoose from 'mongoose'
class StaticTextClass {
  attach(file) {
    if (!this.images) {
      this.images = []
      this.markModified('images')
    }
    console.log(file);
    console.log(this.images)
    this.images.push(file)
    console.log(this.images)
    this.markModified('images.' + (this.images.length - 1))
    return this.save()
  }
}

staticTextSchema.loadClass(StaticTextClass)
export default mongoose.model('StaticText', staticTextSchema)

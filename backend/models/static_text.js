import {staticTextSchema} from './schema'
import mongoose from 'mongoose'
class StaticTextClass {

}

staticTextSchema.loadClass(StaticTextClass)
export default mongoose.model('StaticText', staticTextSchema)

import {pageSchema} from './schema'
import mongoose from 'mongoose'

class PageClass {
}

pageSchema.loadClass(PageClass)
export default mongoose.model('Page', pageSchema)

import mongoose from 'mongoose'
import {itemSchema} from './schema'

class ItemClass {
}
itemSchema.loadClass(ItemClass)
export default mongoose.model('Item', itemSchema)

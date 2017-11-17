import mongoose from 'mongoose'
import {orderSchema} from '../schema'

class Order {

}
orderSchema.loadClass(Order)
export default mongoose.model('Order', orderSchema)

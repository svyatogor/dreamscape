import mongoose from 'mongoose'
import {sumBy} from 'lodash'
import Promise from 'bluebird'
import {orderSchema} from '../schema'

class OrderClass {
  static async buildFromCart(cart) {
    const items = await cart.items
    const lines = await Promise.map(items, async item => {
      return {
        product: item.product,
        name: await item.product.productName,
        count: item.count,
        price: item.product.finalPrice,
        discount: 0,
        discountType: 'none',
        total: item.product.finalPrice * item.count,
      }
    })
    const total = sumBy(lines, 'total')
    return new Order({site: cart.site._id, lines, subtotal: total, total, status: 'pending'})
  }

  async complete() {

  }
}
orderSchema.loadClass(OrderClass)
const Order = mongoose.model('Order', orderSchema)
export default Order

import {query, mutation} from './utils'
import Order from '../models/eshop/order'

export default class {
  @query
  static async eshopOrders({site}, {status, limit, offset}) {
    let orders = Order.find({site: site._id})
    if (status) {
      orders = orders.where({status})
    }

    if (limit) {
      orders = orders.skip(offset || 0).limit(limit)
    }

    return orders.sort('+createdAt')
  }

  @query
  static async eshopOrder({site}, {id}) {
    return Order.findOne({site: site._id, _id: id})
  }

  static queries = {}
  static mutations = {}
}
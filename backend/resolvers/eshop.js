import {get, isEmpty} from 'lodash'
import {query, mutation} from './utils'
import Order from '../models/eshop/order'

const annotate = order => {
  const object = order.toObject()
  console.log(get(order.toObject(), 'receipt.transactions.0.related_resources.0'))
  return {
    ...object,
    id: order._id,
    receipt: {
      id: get(object, 'receipt.transactions.0.related_resources.0.sale.id')
    }
  }
}


export default class {
  @query
  static async eshopOrders({site}, {search, limit, offset}) {
    console.log(search)
    let orders = Order.find({site: site._id})
    // if (status) {
    //   orders = orders.where({status})
    // }

    if (isEmpty(search)) {
      orders = orders.where({status: {$not: {$in: ['draft', 'completed']}}})
    } else {
      orders = orders.where({$text: {$search: search}})
    }

    if (limit) {
      orders = orders.skip(offset || 0).limit(limit)
    }

    return (await orders.sort('+createdAt')).map(annotate)
  }

  // @query
  // static async eshopOrder({site}, {id}) {
  //   return annotate(await Order.findOne({site: site._id, _id: id}))
  // }

  static queries = {}
  static mutations = {}
}
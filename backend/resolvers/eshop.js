import {get, isEmpty} from 'lodash'
import {query, mutation} from './utils'
import Order from '../models/eshop/order'
import {t} from '../common/utils'

const annotate = site => order => {
  const object = order.toObject()
  let receipt
  if (order.paymentMethod === 'paypal') {
    const id = get(object, 'receipt.transactions.0.related_resources.0.sale.id')
    receipt = {
      id,
      url: `https://www.paypal.com/activity/payment/${id}`
    }
  }
  if (order.paymentMethod === 'braintree') {
    const id = get(object, 'receipt.transaction.id')
    const merchantId = site.eshop.paymentMethods.braintree.merchantId
    const environment = site.eshop.paymentMethods.braintree.environment === 'Sandbox' ?
      'sandbox.' : ''
    receipt = {
      id,
      url: `https://${environment}braintreegateway.com/merchants/${merchantId}/transactions/${id}`
    }
  }
  return {
    ...object,
    id: order._id,
    lines: order.lines.map(line => {
      return {...line.toObject(), product: {
        id: line.product.id,
        folder: line.product.folder,
        data: line.product.toContext({})
      }}
    }),
    receipt,
    delivery: {
      label: t(get(site.eshop.deliveryMethods, [order.deliveryMethod, 'label'], order.deliveryMethod)),
      cost: order.deliveryCost,
    }
  }
}

export default class {
  @query
  static async eshopOrders({site}, {search, limit, offset}) {
    let orders = Order.find({site: site._id}).populate({path: 'lines.product', model: 'Item'})
    // if (status) {
    //   orders = orders.where({status})
    // }

    if (isEmpty(search)) {
      orders = orders.where({status: {$not: {$in: ['draft', 'completed', 'canceled']}}})
    } else {
      orders = orders.where({$text: {$search: search}})
    }

    if (limit) {
      orders = orders.skip(offset || 0).limit(limit)
    }

    return (await orders.sort('+createdAt')).map(annotate(site))
  }

  // @query
  // static async eshopOrder({site}, {id}) {
  //   return annotate(await Order.findOne({site: site._id, _id: id}))
  // }

  @mutation
  static async updateOrderStatus({site}, {order: _id, status}) {
    const order = await Order.findOne({site: site._id, _id})
    if (['draft', 'completed', 'canceled'].includes(order.status)) {
      return order
    }

    order.set({status})
    if (status === 'canceled') {
      await order.returnStock()
    }

    await order.save()
    return order
  }

  static queries = {}
  static mutations = {}
}
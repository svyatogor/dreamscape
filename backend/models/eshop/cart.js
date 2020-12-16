import Promise from 'bluebird'
import Product from './product'
import {pickBy, isEmpty, findIndex, map, find, sumBy, reject, get, isArray, isObject, mapValues} from 'lodash'
import {t} from '../../common/utils'
import * as deliveryConstFunctions from '../../services/delivery'

class DefaultPricingPolicy {
  bind() { return new Promise(resolve => resolve())}
  price(product) {
    const discountedPrice = product.calculatedDiscountedPrice
    return discountedPrice > 0 ? discountedPrice : product.get('price')
  }
}

export default class {
  constructor(req) {
    this.req = req
    this.site = req.site
    this._items = []
    this.availableDeliveryMethods = this.site.eshop.deliveryMethods
    const defaultDeliveryMethod = Object.keys(pickBy(this.availableDeliveryMethods, 'default'))[0]

    if (!isEmpty(req.cookies.cart)) {
      try {
        const json = JSON.parse(req.cookies.cart)
        if (isArray(json)) {
          this._items = json
        } else if (isObject(json)) {
          const {items, deliveryMethod, shippingAddress} = json
          this._items = items
          this.deliveryMethod = deliveryMethod
          this.shippingAddress = shippingAddress
        }
      } catch (e) {
      }
    }

    if (!(this.deliveryMethod in this.availableDeliveryMethods)) {
      this.deliveryMethod = defaultDeliveryMethod
    }
  }

  setDelivery(method, shippingAddress) {
    if (method in this.availableDeliveryMethods) {
      this.deliveryMethod = method
      this.shippingAddress = shippingAddress
    } else {
      throw new Error('Invalid deivery method')
    }
  }

  add(product) {
    const idx = findIndex(this._items, {product})
    if (idx > -1) {
      this._items[idx].count++
    } else {
      this._items.push({product, count: 1})
    }
  }

  remove(product) {
    this._items = reject(this._items, {product})
  }

  inc(product, count) {
    const idx = findIndex(this._items, {product})
    if (idx >= 0) {
      this._items[idx].count += count
    }
  }

  async set(product, count) {
    const idx = findIndex(this._items, {product})
    if (idx >= 0) {
      this._items[idx].count = Math.min((await this.items)[idx].product.stock, count)
    }
  }

  async checkStock() {
    const items = await this.items
    const lowStock = items.filter(({count, product}) => count > product.stock)
    if (isEmpty(lowStock)) return true
    else if (lowStock.length === 1) throw new Error(lowStock[0].name + ' is sold out.')
    else throw new Error(lowStock.map(i => i.name).join(', ') + ' are sold out.')
  }

  get count() {
    return this._items.length;
  }

  get items() {
    if (!this.__items)  {
      const pricingPolicy = this.pricingPolicy
      return pricingPolicy.bind().then(async () => {
        const objects = await Product.find({_id: {$in: map(this._items, 'product')}})
        objects.forEach(o => o.pricingPolicy = pricingPolicy)
        this.__items = await Promise.map(this._items, async i => {
          const product = find(objects, o => String(o._id) === i.product)
          const productFields = await product.toContext(this.req)
          return {
            ...productFields,
            ...i,
            product,
          }
        })
        return this.__items
      })
    }
    return this.__items
  }

  get subtotal() {
    return sumBy(this.items, item => item.product.priceWithoutTaxes * item.count)
  }

  get taxTotal() {
    return sumBy(this.items, item => item.product.taxAmount * item.count)
  }

  get total() {
    return sumBy(this.items, item => item.product.finalPrice * item.count) + this.deliveryCost
  }

  get deliveryCost() {
    if (isEmpty(this.items)) return 0;
    const method = this.availableDeliveryMethods[this.deliveryMethod]
    if (method.policy in deliveryConstFunctions) {
      return deliveryConstFunctions[method.policy](method, this)
    }

    const siteKey = get(this.req, 'site.key')
    const delveryMethodFile = `../../../data/${siteKey}/modules/${method.policy}`
    try {
      const deliveryCostFunction = require(delveryMethodFile).default
      if (deliveryCostFunction) {
        return deliveryCostFunction(method, this)
      } else {
        throw new Error('Invalid delivery method configuration')
      }
    } catch (e) {
      console.log(e)
    }
  }

  serialize() {
    return JSON.stringify(this.toObject())
  }

  toObject() {
    return {
      items: this._items,
      deliveryMethod: this.deliveryMethod,
      shippingAddress: this.shippingAddress,
    }
  }

  get pricingPolicy() {
    const pricingPolicyName = get(this.req, 'site.eshop.discountPolicy')
    const siteKey = get(this.req, 'site.key')
    if (!pricingPolicyName) {
      return new DefaultPricingPolicy(this.req)
    }
    const pricingPolicyFile = `../../../data/${siteKey}/modules/${pricingPolicyName}`
    try {
      const PricingPolicy = require(pricingPolicyFile).default
      if (PricingPolicy) {
        return new PricingPolicy(this.req)
      }
    } catch (e) {
      console.log(e)
    }
  }

  get deliveryMethodLabel() {
    const {locale} = this.req
    return t(get(this.availableDeliveryMethods, [this.deliveryMethod, 'label'], this.deliveryMethod), locale)
  }

  async toContext() {
    const {locale} = this.req
    //TODO: Check and optimize
    await this.items
    const items = await Promise.map(this.items, async item => {
      return {
        ...item,
        product: await item.product.toContext(this.req)
      }
    })
    return {
      items,
      total: this.total,
      deliveryCost: this.deliveryCost,
      shippingAddress: this.shippingAddress,
      taxTotal: this.taxTotal,
      subtotal: this.subtotal,
      deliveryMethod: this.deliveryMethod,
      deliveryMethodLabel: this.deliveryMethodLabel,
      availableDeliveryMethods: mapValues(this.availableDeliveryMethods, method => ({...method, label: t(method.label, locale)}))
    }
  }
}

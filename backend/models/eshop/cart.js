import Product from './product'
import {isNil, isEmpty, findIndex, map, find, sumBy, reject, get} from 'lodash'

class DefaultPricingPolicy {
  bind() { return new Promise(resolve => resolve())}
  price(product) {
    return product.get('price')
  }
}

export default class {
  constructor(req) {
    this.req = req
    this.site = req.site
    if (isNil(req.cookies.cart) || isEmpty(req.cookies.cart)) {
      this._items = []
    } else {
      this._items = JSON.parse(req.cookies.cart)
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

  get count() {
    return this._items.length;
  }

  get items() {
    if (!this.__items)  {
      const pricingPolicy = this.pricingPolicy
      return pricingPolicy.bind().then(async () => {
        const objects = await Product.find({_id: {$in: map(this._items, 'product')}})
        objects.forEach(o => o.pricingPolicy = pricingPolicy)
        this.__items = map(this._items, i => ({
          ...i,
          product: find(objects, o => String(o._id) === i.product)
        }))
        return this.__items
      })
    }
    return this.__items
  }

  get total() {
    return sumBy(this.items, item => item.product.finalPrice * item.count)
  }

  serialize() {
    return JSON.stringify(this._items)
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
}
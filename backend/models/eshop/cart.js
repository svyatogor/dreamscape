import Product from './product'
import Order from './order'
import {isNil, isEmpty, findIndex, map, find, sumBy} from 'lodash'

export default class {
  constructor(req) {
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

  get count() {
    return this._items.length;
  }

  get items() {
    if (!this.__items)  {
      return Product.find({_id: {$in: map(this._items, 'product')}}).then(objects => {
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
    return sumBy(this.items, item => item.product.finalPrice)
  }

  serialize() {
    return JSON.stringify(this._items)
  }
}
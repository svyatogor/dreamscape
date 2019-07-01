import {get, pickBy} from 'lodash'
import jsonic from 'jsonic'
import {Site} from '../index'
import Item from '../item'
import {t} from '../../common/utils'

const TAX_CATEGORIES = jsonic(process.env.TAX_CATEGORIES)

export default class Product extends Item {
  async toContext({locale}) {
    const site = await Site.findOne({_id: this.site}).cache(10)
    const object = this.toObject({virtuals: true})
    const fields = site.documentTypes[this.catalog].fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    object.finalPrice = this.finalPrice
    return object
  }

  bind(req) {
    this.req = req
  }

  get finalPrice() {
    try {
      if (this.pricingPolicy) {
        return this.pricingPolicy.price(this)
      }
    } catch (e) {
      console.log(e)
    }
    const discountedPrice = this.get('discountedPrice') || 0
    return discountedPrice > 0 ? this.get('discountedPrice') : this.get('price')
  }

  get priceWithoutTaxes() {
    const tax = this.tax / 100.0
    console.log(this.tax, tax, Math.round(this.finalPrice / (1 + tax) * 100) / 100)
    return Math.round(this.finalPrice / (1 + tax) * 100) / 100
  }

  get taxAmount() {
    return this.finalPrice - this.priceWithoutTaxes
  }

  get productName() {
    return Site.findOne({_id: this.get('site')}).then(site => {
      const {labelField, defaultLocale = 'en'} = site.documentTypes[this.catalog]
      return this.get(labelField)[defaultLocale]
    })
  }

  get productImage() {
    return Site.findOne({_id: this.get('site')}).then(site => {
      const {imageField} = site.documentTypes[this.catalog]
      if (imageField) {
        return this.get(imageField)
      }
    })
  }

  get tax() {
    return get(TAX_CATEGORIES, this.get('taxCategory'), TAX_CATEGORIES.default)
  }

  get stock() {
    return this.get('stock')
  }

  async reduceSock(count) {
    if (this.stock >= count) {
      const newProd = Product.findOneAndUpdate({_id: this.get('id'), count: this.stock}, {$inc: {stock: -1}})
      if (!newProd) {

      }
    }
  }
}

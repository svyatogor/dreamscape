import { DocumentType, prop } from '@typegoose/typegoose'
import jsonic from 'jsonic'
import { get, pickBy } from 'lodash'
import { t } from '../../common/utils'
import Item from '../item'
import { IPricingPolicy } from './cart'

const TAX_CATEGORIES = jsonic(process.env.TAX_CATEGORIES)

export default class Product extends Item {
  @prop()
  public taxCategory: string

  @prop()
  public stock: number

  @prop()
  public discountedPrice: number

  @prop()
  public price: number

  public pricingPolicy: IPricingPolicy //TODO: This is terrible idea and breaks incapsulation

  async toContext(this: DocumentType<Product>, {locale}) {
    const object = this.toObject({virtuals: true})
    const fields = this.managedSchema.fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    object.finalPrice = this.finalPrice
    object.priceWithoutTaxes = this.priceWithoutTaxes
    object.taxAmount = this.taxAmount
    return object
  }

  get finalPrice() {
    try {
      if (this.pricingPolicy) {
        return this.pricingPolicy.price(this)
      }
    } catch (e) {
      console.log(e)
    }
    const discountedPrice = this.discountedPrice || 0
    return discountedPrice > 0 ? this.discountedPrice : this.price
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
    const {labelField, defaultLocale = 'en'} = this.managedSchema
    return this[labelField][defaultLocale]
  }

  get productImage() {
    const {imageField} = this.managedSchema
    if (imageField) {
      return this[imageField]
    }
  }

  get tax() {
    return get(TAX_CATEGORIES, this.taxCategory, TAX_CATEGORIES.default)
  }
}

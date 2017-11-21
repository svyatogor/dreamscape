import mongoose from 'mongoose'
import {get, pickBy, isEmpty} from 'lodash'
import {itemSchema} from '../schema'
import {Site} from '../index'
import Item from '../item'
import {t} from '../../common/utils'

export default class Product extends Item {
  async toContext({locale}) {
    const site = await Site.findOne({_id: this.site})
    const object = this.toObject({virtuals: true})
    const fields = site.documentTypes[this.catalog].fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    object.finalPrice = this.finalPrice
    return object
  }

  get finalPrice() {
    return !isEmpty(this.get('specialPrice')) ? this.get('specialPrice') : this.get('price')
  }

  get productName() {
    console.trace()
    return Site.findOne({_id: this.get('site')}).then(site => {
      const {labelField, defaultLocale = 'en'} = site.documentTypes[this.catalog]
      return this.get(labelField)[defaultLocale]
    })
  }
}

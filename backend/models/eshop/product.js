import mongoose from 'mongoose'
import {pickBy, isEmpty} from 'lodash'
import {itemSchema} from '../schema'
import {Site} from '../index'
import {t} from '../../common/utils'

class Product {
  async toContext({locale}) {
    const site = await Site.findOne({_id: this.site})
    const object = this.toObject({virtuals: true})
    const fields = site.documentTypes[this.catalog].fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    return object
  }

  get finalPrice() {
    return !isEmpty(this.specialPrice) ? this.specialPrice : this.price
  }
}
itemSchema.loadClass(Product)
export default mongoose.model('Item', itemSchema)

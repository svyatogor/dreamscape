import mongoose from 'mongoose'
import {pickBy, omit} from 'lodash'
import {itemSchema} from './schema'
import {Site} from '../models'
import {t} from '../common/utils'
import SearchService from '../services/search'

class ItemClass {
  async toContext({locale}) {
    const site = await Site.findOne({_id: this.site})
    const object = this.toObject({virtuals: true})
    const fields = site.documentTypes[this.catalog].fields
    Object.keys(pickBy(fields, {localized: true})).forEach(field => {
      object[field] = t(object[field], locale)
    })
    return object
  }
}

itemSchema.loadClass(ItemClass)
export default mongoose.model('Item', itemSchema)

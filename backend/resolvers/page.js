import {omit} from 'lodash'
import {query, mutation} from './utils'
import {Page} from '../models'

export default class {
  @query
  static pages() {
    return Page.find().populate('parent')
  }

  @query
  static page(context, {id}) {
    return Page.findById(id).populate('parent')
  }

  @mutation
  static upsertPage(context, {page}) {
    const condtions = page.id ? {_id: page.id} : {}
    condtions.title = {$elemMatch: {locale: {$eq: page.title.locale}}}
    page["title.$.value"] = page.title.value
    page = omit(page, ['title', 'id'])
    return Page
      .findOneAndUpdate(condtions, {$set: page}, {new: true, upsert: true, runValidators: true})
      .populate('parent')
  }

  static queries = {}
  static mutations = {}
}

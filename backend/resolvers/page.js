import {omit, forEach, mapKeys, findIndex} from 'lodash'
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
  static async upsertPage(context, {page}) {
    let _page
    if (page.id) {
      _page = await Page.findById(page.id).populate('parent')
      forEach(['title'], i18nField => {
        page = mapKeys(page, (value, key) => {
          if (key === i18nField) {
            const idx = findIndex(_page[i18nField], {locale: value.locale})
            return `${key}.${idx}`
          } else {
            return key
          }
        })
      })
      console.log(page);
      _page.set(page)
    } else {
      _page = new Page(page)
    }
    await _page.save()
    return _page
  }

  static queries = {}
  static mutations = {}
}

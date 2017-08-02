import {omitBy, isNil, forEach, mapKeys, findIndex, find, last, map, reject, get} from 'lodash'
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
  static async upsertPage(context, {page, locale = 'en'}) {
    let _page
    if (page.id) {
      _page = await Page.findById(page.id).populate('parent')
      forEach(['title'], i18nField => {
        page = mapKeys(page, (value, key) => {
          if (key === i18nField) {
            const idx = findIndex(_page[i18nField], {locale})
            if (idx >= 0) {
              return `${key}.${idx}.value`
            } else {
              _page[i18nField].push({locale, value})
              return null
            }
          } else {
            return key
          }
        })
      })
      page = omitBy(page, isNil)
      _page.set(page)
    } else {
      _page = new Page(page)
    }
    await _page.save()
    return _page
  }

  @mutation
  static async addBlock(context, {block}) {
    let page = await Page.findById(block.page)
    let section = await page.findOrCreateSection(block.section)
    const klass = require('../models')[block._type]
    const blockObj = new klass()
    await blockObj.save()
    section.blocks.push({_type: block._type, ref: blockObj})
    await page.save()
    return last(section.blocks)
  }

  @mutation
  static async removeBlock(context, {block: {page: pageId, ref}}) {
    let page = await Page.findById(pageId)
    let sectionIndex = findIndex(page.sections, s => map(s.blocks, b => String(b.ref)).includes(ref))
    const section = page.sections[sectionIndex]
    const blockIndex = findIndex(section.blocks, b => String(b.ref) === ref)
    const kp =`sections.${sectionIndex}.blocks.${blockIndex}`

    page = await page.populate(kp)
    await get(page, kp).remove()
    section.blocks = reject(section.blocks, b => String(b.ref) === ref)
    await page.save()
  }

  static queries = {}
  static mutations = {}
}

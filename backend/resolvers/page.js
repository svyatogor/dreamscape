import mongoose from 'mongoose'
import {omit, isNil, forEach, mapKeys, mapValues, has, findIndex, find, last, map, reject, get} from 'lodash'
import {query, mutation} from './utils'
import {Page} from '../models'

export default class {
  @query
  static pages({site}) {
    return Page.where({site: site.id}).populate('parent')
  }

  @query
  static page({site}, {id}) {
    return Page.findOne({_id: id, site: site.id}).populate('parent')
  }

  @mutation
  static async upsertPage({site}, {page, locale = 'en'}) {
    let _page
    const i18nfields = ['title', 'linkText']
    if (page.id) {
      _page = await Page.findOne({_id: page.id, site: site.id}).populate('parent')
      _page.set(omit(page, [...i18nfields, 'site']))
    } else {
      locale = 'en'
      _page = new Page(omit(page, i18nfields))
      _page.site = site.id
    }

    i18nfields.filter(f => has(page, f)).forEach(field => {
      _page.set(`${field}.${locale}`, page[field])
    })
    await _page.save()
    return _page
  }

  @mutation
  static async addBlock({site}, {block}) {
    const {page: id, section, _type} = block
    let page = await Page.findById(id)
    page.sections = page.sections || {}
    page.sections[section] = page.sections[section] || []
    const klass = require('../models')[_type]
    const blockObj = new klass({site})
    await blockObj.save()
    page.sections[section].push({ref: mongoose.Types.ObjectId(blockObj.id), _type})
    page.markModified('sections')
    await page.save()
    return blockObj.id
  }

  @mutation
  static async removeBlock(context, {block: {page: pageId, ref}}) {
    let page = await Page.findById(pageId)
    forEach(page.sections, (section, key) => {
      if (map(section, block => String(block.ref)).includes(ref)) {
        page.sections[key] = reject(section, block => String(block.ref) === ref)
      }
    })
    page.markModified('sections')
    await page.save()
  }

  @mutation
  static async attachImage(context, {type, id, url}) {
    const klass = require('../models')[type]
    const object = await klass.findById(id)
    return object.attach(url)
  }

  static queries = {}
  static mutations = {}
}

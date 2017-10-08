import {isNil, get, forEach, omit} from 'lodash'
import {query, mutation} from './utils'
import {Folder, Item} from '../models'

export default class {
  @query
  static folders({site}, {catalog}) {
    return Folder.where({site: site.id, catalog})
  }

  @query
  static folder({site}, {id}) {
    return Folder.findOne({site: site.id, _id: id})
  }

  @query
  static async item({site}, {id}) {
    const item = await Item.findOne({site: site.id, _id: id})
    return {
      id: item.id,
      data: item.toObject(),
    }
  }

  @query
  static async items({site}, {folder}) {
    return (await Item.where({site: site.id, folder})).map(item => ({
      id: item.id,
      data: item.toObject()
    }))
  }

  @mutation
  static async upsertItem({site}, {id, folder, locale, data}) {
    const {catalog: catalogKey} = await Folder.findOne({_id: folder})
    const catalog = site.documentTypes[catalogKey]

    let item
    if (id) {
      item = await Item.findOne({_id: id}).populate('folder')
      if (String(get(item, 'folder.site')) !== String(site.id)) {
        throw new Error("Item doesn't exist or you don't have access to it")
      }
    } else {
      const folderObject = await Folder.findOne({_id: folder, site: site.id})
      if (!folderObject) {
        throw new Error("Folder doesn't exist or you don't have access to it")
      }
      locale = 'en'
      item = new Item()
      let position = 0
      const lastItem = await Item.findOne({folder}).sort('-position').select('position')
      if (lastItem) {
        position = lastItem.position
      }
      item.site = site.id
      item.folder = folder
      item.position = position + 1
    }

    forEach(omit(catalog.fields, (_, f) => isNil(data[f])), ({localized}, field) => {
      if (localized) {
        item.set(field, {
          ...get(item, field, {}),
          [locale]: data[field],
        })
      } else {
        item.set(field, data[field])
      }
    })
    await item.save()
    return {
      id: item.id,
      data: item.toObject(),
    }
  }

  static queries = {}
  static mutations = {}
}

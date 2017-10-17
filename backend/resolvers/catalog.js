import {isNil, get, forEach, omit} from 'lodash'
import {query, mutation} from './utils'
import {Folder, Item} from '../models'

export default class {
  @query
  static folders({site}, {catalog}) {
    return Folder.where({site: site.id, catalog, deleted: false})
  }

  @query
  static folder({site}, {id}) {
    return Folder.findOne({site: site.id, _id: id, deleted: false})
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
    return (await Item.where({site: site.id, folder, deleted: false})).map(item => ({
      id: item.id,
      data: item.toObject()
    }))
  }

  @mutation
  static async upsertFolder({site}, {folder}) {
    let {id, name, parent, locale, catalog} = folder
    if (id) {
      const folder = await Folder.findOne({_id: id, site: site.id})
      if (!folder) {
        throw new Error("Folder doesn't exist or you don't have access to it")
      }
      if (parent) {
        const parentFolder = await Folder.findOne({_id: parent, site: site.id})
        if (!parentFolder) {
          throw new Error("Folder doesn't exist or you don't have access to it")
        }
        folder.parent = parent
      }
      folder.name[locale] = name
      await folder.save()
      return folder
    } else {
      if (parent) {
        const parentFolder = await Folder.findOne({_id: parent, site: site.id})
        if (!parentFolder) {
          throw new Error("Folder doesn't exist or you don't have access to it")
        }
        console.log(parentFolder);
        catalog = parentFolder.catalog
      }
      if (!parent && !catalog) {
        throw new Error("Either parent folder or catalog have to be defined")
      }

      let position = 0
      const lastFolder = await Folder.findOne({parent}).sort('-position').select('position')
      if (lastFolder) {
        position = lastFolder.position
      }
      position++

      const folder = new Folder({name: {[locale]: name}, parent, position, catalog, site: site.id, deleted: false})
      await folder.save()
      return folder
    }
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
      let position = 0
      const lastItem = await Item.findOne({folder}).sort('-position').select('position')
      if (lastItem) {
        position = lastItem.position || 0
      }
      position++
      item = new Item({site: site.id, folder, position, deleted: false})
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

  @mutation
  static deleteItem({site}, {id}) {
    return Item.update({ _id: id, site: site.id }, { $set: { deleted: true }})
  }

  @mutation
  static async deleteFolder({site}, {id}) {
    return Folder.update({ _id: id, site: site.id }, { $set: { deleted: true }})
  }

  static queries = {}
  static mutations = {}
}

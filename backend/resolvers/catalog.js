import {isEmpty, isNil, get, forEach, omit, map, isString, isBoolean} from 'lodash'
import crypto from 'crypto'
import {query, mutation} from './utils'
import {Folder, Item} from '../models'
import SearchService from '../services/search'
import Promise from 'bluebird'

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
  static async items({site}, {folder, search, catalog}) {
    const q = {site: site.id, deleted: false}
    if (folder) {
      q.folder = folder
    } else if (catalog) {
      q.catalog = catalog
    }

    if (search) {
      const ids = await SearchService.simple_search(search, `${catalog}-${site.id}`, '*')
      q['_id'] = {$in: ids}
    }
    return (await Item.where(q).sort('position')).map(item => ({
      id: item.id,
      folder: item.folder,
      position: item.position,
      label: item.get(get(site.documentTypes, [item.catalog, 'labelField'])),
      data: item.toObject()
    }))
  }

  @mutation
  static async upsertFolder({site}, {folder}) {
    let {id, name, parent, locale, catalog, hidden} = folder
    console.log(folder)
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
      if (name) {
        console.log(">>>", folder.name)
        folder.set('name', {
          ...folder.name,
          [locale]: name
        })
      }
      if (isBoolean(hidden)) {
        folder.hidden = hidden
      }
      await folder.save()
      return folder
    } else {
      if (parent) {
        const parentFolder = await Folder.findOne({_id: parent, site: site.id})
        if (!parentFolder) {
          throw new Error("Folder doesn't exist or you don't have access to it")
        }
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
  static async upsertItem({site}, params) {
    const {id, folder, locale, data = {}} = params
    const folderObject = folder && await Folder.findOne({_id: folder, site: site.id})

    let catalogKey = folderObject ? folderObject.catalog : params.catalog
    let catalog = site.documentTypes[catalogKey]

    let item
    if (id) {
      item = await Item.findOne({_id: id}).populate('folder')
      catalogKey = item.catalog
      catalog = site.documentTypes[catalogKey]
      if (String(get(item, 'site')) !== String(site.id)) {
        throw new Error("Item doesn't exist or you don't have access to it")
      }
    } else {
      let position = 0
      if (folder && !folderObject) {
        throw new Error("Folder doesn't exist or you don't have access to it")
      }

      const lastItemQuery = {catalog: catalogKey}
      if (folder) { lastItemQuery.folder = folder }
      const lastItem = await Item.findOne(lastItemQuery).sort('-position').select('position')
      if (lastItem) {
        position = lastItem.position || 0
      }
      position++
      item = new Item({site: site.id, folder, position, deleted: false, catalog: catalogKey})
    }

    forEach(omit(catalog.fields, (_, f) => isNil(data[f])), ({localized, type}, field) => {
      if (localized) {
        item.set(field, {
          ...get(item, field, {}),
          [locale]: data[field],
        })
      } else {
        if (type === "number" || type === "money") {
          if (isString(data[field]) && type === 'money') {
            data[field] = data[field].replace(',', '.')
          }
          const val = type === 'money' ? parseFloat(data[field]) : parseInt(data[field], 10)
          item.set(field, isNaN(val) ? null : val)
        } else if (type === 'boolean') {
          item.set(field, data[field])
        } else if (type === 'date') {
          item.set(field, new Date(data[field]))
        } else if (type === 'password' && !isEmpty(data[field])) {
          const hash = crypto
            .createHash('sha256')
            .update(data[field], 'utf8')
            .digest().toString('hex')
          item.set(field, hash)
        } else if (isEmpty(data[field])) {
          item.set(field, null)
        } else {
          item.set(field, data[field])
        }
      }
    })

    await item.save()
    try {
      await Promise.map(site.supportedLanguages, locale =>
        SearchService.index({
          index: locale,
          type: `${catalogKey}-${site.id}`,
          id: item.id,
          body: item.toSearchableDocument(catalog, locale),
        })
      )
    } catch (e) {
      console.error(e)
    }

    return {
      id: item.id,
      position: item.position,
      data: item.toObject(),
    }
  }

  @mutation
  static async moveItem({site}, {id, newPosition}) {
    const item = await Item.findOne({site, _id: id})
    if (newPosition === item.position) {
      return
    } else if (newPosition < item.position) {
      await Item.update({folder: item.folder, position: {$gte: newPosition, $lt: item.position}},
        {$inc: {position: 1}},
        {multi: true}
      )
    } else if (newPosition > item.position) {
      await Item.update({folder: item.folder, position: {$gt: item.position, $lte: newPosition}},
        {$inc: {position: -1}},
        {multi: true}
      )
    }

    item.set('position', newPosition)
    await item.save()
  }

  @mutation
  static async deleteItem({site}, {id}) {
    const q = { _id: id, site: site.id }
    const item = await Item.findOne(q)
    await Promise.all(
      site.supportedLanguages.map(locale =>
        SearchService.delete({
          index: locale,
          type: item.catalog + '-' + site.id,
          id,
        }).catch(() => null)
      )
    )
    return Item.update(q, { $set: { deleted: true }})
  }

  @mutation
  static deleteFolder({site}, {id}) {
    // TODO: Remove all nested items from search
    return Folder.update({ _id: id, site: site.id }, { $set: { deleted: true }})
  }

  @mutation
  static async orderFolders({site}, {folders, parent}) {
    return Promise.all(map(folders, (folder, position) =>
      Folder.findOneAndUpdate({_id: folder, site: site._id}, {$set: {position, parent}}, {new: true})
    ))
  }

  static queries = {}
  static mutations = {}
}

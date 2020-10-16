import mongoose from 'mongoose'
import {isEmpty, isNil, get, forEach, omit, isString, isBoolean, mapValues, trimEnd} from 'lodash'
import crypto from 'crypto'
import {query, mutation} from './utils'
import Promise from 'bluebird'

export default class {
  @query
  static async folders({site}, {catalog}) {
    if (!site.Folder(catalog)) return []
    return site.Folder(catalog).where({deleted: false})
  }

  @query
  static folder({site}, {id, catalog}) {
    if (!site.Folder(catalog)) return undefined
    return site.Folder(catalog).findOne({_id: id, deleted: false})
  }

  @query
  static async item({site}, {id, catalog}) {
    const Item = site.Item(catalog)
    const item = await Item.findById(id)
    const schema = site.documentTypes[catalog]
    const hiddenFields = Object.keys(schema.fields).filter(f => schema.fields[f].type === 'password')
    const label = schema.labelField ? item.get(schema.labelField) : ''
    return {
      id,
      label,
      data: omit(item.toObject(), hiddenFields)
    }
  }

  @query
  static async items({site}, {folder, search, catalog}) {
    const Folder = site.Folder(catalog)
    const Item = site.Item(catalog)
    const q = {deleted: false}
    if (folder) {
      const folderObject = await Folder.findById(folder)
      if (!folderObject) return []
    }
    if (folder) q.folder = folder

    const schema = site.documentTypes[catalog]
    const projection = search ? {score: {$meta: "textScore"}} : undefined
    const sort = search ? {score: {$meta: "textScore"}} : (schema.sortBy || 'position')

    if (search) {
      q['$text'] = {$search: search}
    }
    const referenceFields = Object.keys(schema.fields).filter(f =>
      schema.fields[f].type === 'select' && schema.fields[f].documentType
    )
    const hiddenFields = Object.keys(schema.fields).filter(f => schema.fields[f].type === 'password')
    const result = await referenceFields.reduce((acc, field) => acc.populate(field), Item.find(q, projection).sort(sort))
    return result.map(item => {
      const label = schema.labelField ? item.get(schema.labelField) : ''
      return {
        id: item.id,
        folder: item.folder,
        position: item.position,
        label,
        data: mapValues(item.toObject(), (value, key) => {
          if (hiddenFields.includes(key)) {
            return null
          }
          if (referenceFields.includes(key)) {
            const labelField = site.documentTypes[schema.fields[key].documentType].labelField
            return get(value, labelField)
          }
          return value
        }),
      }
    })
  }

  @mutation
  static async upsertFolder({site}, {folder, catalog}) {
    const Folder = site.Folder(catalog)
    let {id, name, parent, locale, hidden} = folder
    if (id) {
      const folder = await Folder.findById(id)
      if (!folder) {
        throw new Error("Folder doesn't exist")
      }
      if (parent) {
        const parentFolder = await Folder.findById(parent)
        if (!parentFolder) {
          throw new Error("Folder doesn't exist")
        }
        folder.parent = parent
      }
      if (name) {
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
        const parentFolder = await Folder.findById(parent)
        if (!parentFolder) {
          throw new Error("Folder doesn't exist")
        }
      }
      if (!parent) {
        throw new Error("Either parent folder or catalog have to be defined")
      }

      let position = 0
      const lastFolder = await Folder.findOne({parent}).sort('-position').select('position')
      if (lastFolder) {
        position = lastFolder.position
      }
      position++

      const folder = new Folder({name: {[locale]: name}, parent, position})
      await folder.save()
      return folder
    }
  }

  @mutation
  static async upsertItem({site}, params) {
    const {id, catalog, folder, locale, data = {}} = params
    const Folder = site.Folder(catalog)
    const Item = site.Item(catalog)

    const folderObject = folder && await Folder.findById(folder)

    let documentSchema = site.documentTypes[catalog]

    let item
    if (id) {
      item = await Item.findById(id).populate('folder')
    } else {
      let position = 0
      if (folder && !folderObject) {
        throw new Error("Folder doesn't exist or you don't have access to it")
      }

      const lastItemQuery = folder ? {folder} : {}
      const lastItem = await Item.findOne(lastItemQuery).sort('-position').select('position')
      if (lastItem) {
        position = lastItem.position || 0
      }
      position++
      item = new Item({folder, position, deleted: false})
    }

    forEach(omit(documentSchema.fields, (_, f) => isNil(data[f])), ({localized, type, ...fieldSchema}, field) => {
      if (localized) {
        console.log(field)
        console.log({
          ...(item.get(field) || {}),
          [locale]: data[field],
        })
        item.set(field, {
          ...(item.get(field) || {}),
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
        } else if (type === 'password') {
          if (!isEmpty(data[field])) {
            const hash = crypto
              .createHash('sha256')
              .update(data[field], 'utf8')
              .digest().toString('hex')
            item.set(field, hash)
          }
        } else if (type === 'select' && fieldSchema.documentType && !isEmpty(data[field])) {
          item.set(field, mongoose.Types.ObjectId(data[field]))
        } else if (isEmpty(data[field])) {
          item.set(field, null)
        } else {
          item.set(field, data[field])
        }
      }
    })

    await item.save()

    return {
      id: item.id,
      position: item.position,
      data: item.toObject(),
    }
  }

  @mutation
  static async moveItem({site}, {id, newPosition, catalog}) {
    const Item = site.Item(catalog)
    const item = await Item.findByIdAndUpdate(id, {position: newPosition})
    if (newPosition === item.position) return
    if (newPosition < item.position) {
      await Item.update({
        folder: item.folder,
        position: {$gte: newPosition, $lt: item.position},
        _id: { $ne: item._id },
      },
        {$inc: {position: 1}},
        {multi: true}
      )
    } else if (newPosition > item.position) {
      await Item.update({
        folder: item.folder,
        position: {$gt: item.position, $lte: newPosition},
        _id: { $ne: item._id },
      },
        {$inc: {position: -1}},
        {multi: true}
      )
    }
  }

  @mutation
  static async deleteItem({site}, {id, catalog}) {
    const Item = site.Item(catalog)
    await Item.findByIdAndUpdate(id, {$set: {deleted: true}}, {new: true})
    return true
  }

  @mutation
  static async deleteFolder({site}, {id, catalog}) {
    // TODO: Remove all nested items from search
    await site.Folder(catalog).findByIdAndUpdate(id, {$set: {deleted: true}}, {new: true})
    return true
  }

  @mutation
  static async orderFolders({site}, {catalog, folders, parent}) {
    const Folder = site.Folder(catalog)
    return Promise.map(folders, (folder, position) =>
      Folder.findByIdAndUpdate(folder, {$set: {position, parent}}, {new: true})
    )
  }

  static queries = {}
  static mutations = {}
}

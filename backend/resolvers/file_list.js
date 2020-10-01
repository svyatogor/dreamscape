import {get, find} from 'lodash'
import {query, mutation} from './utils'
import {FileList} from '../models'

export default class {
  @query
  static async fileList({site}, {id}) {
    return await site.FileList.findById(id)
  }

  @mutation
  static async upsertFileList({site}, {input: {id, template, files}, locale}) {
    const {FileList} = site
    let fileList
    if (id) {
      fileList = await FileList.findById(id)
    } else {
      fileList = new FileList()
    }
    fileList.template = template
    fileList.files = files.map(file => {
      const oldDisplayName = get(find(fileList.files, {originalName: file.originalName}), 'displayName', {})
      return {
        ...file,
        displayName: {...oldDisplayName, [locale]: file.displayName}
      }
    })
    await fileList.save()
    return fileList
  }

  static queries = {}
  static mutations = {}
}
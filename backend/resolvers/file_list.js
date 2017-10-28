import {get, find} from 'lodash'
import {query, mutation} from './utils'
import {FileList} from '../models'

export default class {
  @query
  static async fileList({site}, {id}) {
    return await FileList.findOne({_id: id, site: site.id})
  }

  @mutation
  static async upsertFileList({site}, {input: {id, template, files}, locale}) {
    let fileList
    console.log('id', id);
    if (id) {
      fileList = await FileList.findOne({_id: id, site: site.id})
    } else {
      fileList = new FileList({site: site.id})
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
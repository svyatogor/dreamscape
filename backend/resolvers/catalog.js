import {query, mutation} from './utils'
import {Folder} from '../models'

export default class {
  @query
  static folders({site}, {catalog}) {
    console.log(site.id, catalog);
    return Folder.where({site: site.id, catalog})
  }

  static queries = {}
  static mutations = {}
}

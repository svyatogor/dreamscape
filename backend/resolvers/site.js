import {query} from './utils'

export default class {
  @query
  static site(rootValue) {
    return rootValue.site
  }

  static queries = {}
}

import {defaults, map, isString, includes} from 'lodash'
import qs from 'querystring'
import {resolvePath} from '../../frontend'
import {Page} from '../../models'

export class paginate {
  constructor(renderContext) {
    this.tags = ['paginate']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const root = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    // let body = parser.parseUntilBlocks('endmenu');
    // parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', root);
  }

  async run({ctx}, collection, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    if (collection === 'self') {
      collection = ctx
    }

    try {
      let url = `/${ctx.req.locale}/${ctx.page.path}`
      if (ctx.page.params) {
        url += "/" + ctx.page.params
      }
      const q = ctx.req.query
      const links = []
      links.push(`<a href="${url}?${qs.stringify({...q, page: 1})}">&lt;&lt;</a>`)
      for (let page = 1; page <= collection.pagesCount; page++) {
        const klass = page === Number(collection.pageNumber) ? 'active' : 'inactive'
        links.push(`<a class="${klass}" href="${url}?${qs.stringify({...q, page})}">${page}</a>`)
      }
      links.push(`<a href="${url}?${qs.stringify({...q, page: collection.pagesCount})}">&gt;&gt;</a>`)
      callback(null, links.join(''))
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
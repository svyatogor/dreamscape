import {defaults, get} from 'lodash'
import {Item, Folder} from '../../models'
import Promise from 'bluebird'
import {t} from '../../common/utils'
const s = require('sugar')

export class catalogfolder {
  constructor(renderContext) {
    this.tags = ['catalogfolder']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const root = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endcatalogfolder');
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', root, [body]);
  }

  async run({ctx}, catalog, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    try {
      const opts = defaults(options, {as: 'item', filter: '{}', sort: 'position'})
      const key = opts.as
      const originalValue = ctx[key]
      let folder
      let q
      const scope = get(ctx.site.documentTypes, [catalog, 'scopes', ctx.page.params])
      if (scope) {
        folder = {name: t(scope.label, ctx.req.locale)}
        q = eval(`(${scope.filter})`)
        if (scope.sort) {
          opts.sort = scope.sort
        }
      } else {
        folder = await Folder.findOne({catalog, site: ctx.site._id, _id: ctx.page.params})
        if (!folder) {
          callback(null, '')
          return
        }
        folder = await folder.toContext({locale: ctx.req.locale})
        q = {catalog, site: ctx.site._id, folder: ctx.page.params, deleted: false}
      }

      let items = Item.find(q).sort(opts.sort)
      folder.count = await Item.count(q)
      if (opts.pageSize) {
        let page = ctx.req.query.page
        if (!page || isNaN(page)) {
          page = 1
        }
        folder.pageNumber = page
        folder.pagesCount = Math.ceil(folder.count / opts.pageSize)
        items = items.skip((page - 1) * opts.pageSize).limit(opts.pageSize)
      }
      folder.items = await Promise.map(await items, item => item.toContext({locale: ctx.req.locale}))
      ctx[key] = folder
      const result = await new Promise((resolve, reject) => {
        body((error, html) => {
          if (error) { reject(error) }
          else { resolve(html) }
        })
      })
      ctx[key] = originalValue

      callback(null, result)

    } catch (e) {
      console.error(e);
      callback(e)
    }
  }
}
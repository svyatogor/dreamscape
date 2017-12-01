import {defaults, map} from 'lodash'
import {Item, Folder} from '../../models'
import Promise from 'bluebird'

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
      const opts = defaults(options, {as: 'item', filter: '{}'})
      const key = opts.as
      const originalValue = ctx[key]

      let folder = await Folder.findOne({catalog, site: ctx.site._id, _id: ctx.page.params})
      if (!folder) {
        callback(null, '')
        return
      }

      folder = await folder.toContext({locale: ctx.req.locale})
      const q = {catalog, site: ctx.site._id, folder: ctx.page.params, deleted: false}
      let items = Item.find(q)
      folder.count = await Item.count(q)
      if (opts.pageSize) {
        let page = ctx.req.query.page
        if (!page || isNaN(page)) {
          page = 1
        }
        folder.pageNumber = page
        folder.pagesCount = Math.ceil(folder.count / opts.pageSize)
        items = items.sort('createdAt').skip((page - 1) * opts.pageSize).limit(opts.pageSize)
      }
      folder.items = await Promise.map(await items, item => item.toContext({locale: ctx.req.locale}))
      ctx[key] = folder
      const result = body()
      ctx[key] = originalValue

      callback(null, result)
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
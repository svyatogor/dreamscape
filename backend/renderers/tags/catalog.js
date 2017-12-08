import {defaults, map} from 'lodash'
import {Item} from '../../models'
import jsonic from 'jsonic'
const s = require('sugar')

export class catalog {
  constructor(renderContext) {
    this.tags = ['catalog']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const catalog = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('else', 'endcatalog');
    var elseBody = null;

    if(parser.skipSymbol('else')) {
      parser.skip(lexer.TOKEN_BLOCK_END);
      elseBody = parser.parseUntilBlocks('endcatalog');
    }

    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', catalog, [body, elseBody]);
  }

  async run({ctx}, catalog, options, body, elseBody, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    try {
      const opts = defaults(options, {as: 'item', filter: '{}', sort: 'position'})
      if (opts.sort === 'random') {
        delete opts.sort
        opts.random = true
      }
      const key = opts.as
      const originalValue = ctx[key]

      const filter = jsonic(opts.filter)
      const rawFilter = opts.rawFilter ? eval(`(${opts.rawFilter})`) : {}

      let criteria = {
        site: ctx.site._id,
        deleted: false,
        catalog,
        ...filter,
        ...rawFilter,
      }

      if (opts.random) {
        const ids = (await Item.aggregate({
          $match: criteria
        }).project({_id: 1}).sample(opts.limit)).map(e => e._id)
        criteria = {_id: {$in: ids}}
      }
      let itemsQuery = Item.find(criteria)

      if (!opts.random) {
        if (opts.limit) {
          itemsQuery = itemsQuery.limit(opts.limit)
        }

        if (opts.sort) {
          itemsQuery = itemsQuery.sort(opts.sort)
        }
      }

      ctx.itemsCount = await Item.count(criteria)
      if (opts.pageSize) {
        let page = ctx.req.query.page
        if (!page || isNaN(page)) {
          page = 1
        }
        ctx.pageNumber = page
        ctx.pagesCount = Math.ceil(ctx.itemsCount / opts.pageSize)
        itemsQuery = itemsQuery.skip((page - 1) * opts.pageSize).limit(opts.pageSize)
      }

      const items = await itemsQuery
      if (items.length === 0) {
        callback(null, elseBody ? elseBody() : '')
        return
      }
      const data = await Promise.all(map(items, async item => {
        const currentItem = await item.toContext({locale: ctx.req.locale})
        ctx[key] = currentItem
        return body()
      }))

      ctx[key] = originalValue
      callback(null, data.join(''))
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
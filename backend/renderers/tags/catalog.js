import {defaults, map, isEmpty, sortBy} from 'lodash'
import Promise from 'bluebird'
import {Item} from '../../models'
import jsonic from 'jsonic'
import SearchService from '../../services/search'
const s = require('sugar')
const _ = require('lodash')

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

    const ItemModel = ctx.req.site.Item(catalog)
    const asyncBody = Promise.promisify(body)

    try {
      const opts = defaults(options, {as: 'item', filter: '{}', sort: 'position', fullText: true})
      if (opts.sort === 'random') {
        delete opts.sort
        opts.random = true
      }
      const key = opts.as
      const originalValue = ctx[key]
      const filter = jsonic(opts.filter)
      const rawFilter = opts.rawFilter ? eval(`(${opts.rawFilter})`) : {}

      let criteria = {
        deleted: false,
        ...filter,
        ...rawFilter,
      }

      if (!isEmpty(opts.search) && opts.search.toString().length > 2) {
        if (opts.fullText) {
          const ids = await SearchService.simple_search(
            opts.search.toString(),
            `${catalog}-${ctx.site._id}`,
            ctx.req.locale,
            opts.search_fields ? opts.search_fields.split(',') : null,
          )
          criteria['_id'] = {$in: ids}
        } else if (opts.search_fields) {
          const searchFields = opts.search_fields.split(',')
          const safeRegex = opts.search.match(/[^\s]+|"[^"]+"/g).map(t => t.trim().replace(/"/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          const searchExpressions = map(searchFields, field => (
            {$or: safeRegex.map(t => ({[field]: {$regex: new RegExp(t), $options: 'i'}}))}
          ))
          criteria = {
            $and: [
              criteria,
              {$or: searchExpressions}
            ]
          }
        }
      }

      if (opts.random) {
        const sampleRecords = await ItemModel.aggregate().match(criteria).project({_id: 1}).sample(opts.limit)
        const ids = sampleRecords.map(e => e._id)
        criteria = {_id: {$in: ids}}
      }
      console.log(JSON.stringify(criteria))
      let itemsQuery = ItemModel.find(criteria)

      if (!opts.random) {
        if (opts.limit) {
          itemsQuery = itemsQuery.limit(opts.limit)
        }

        if (opts.sort) {
          itemsQuery = itemsQuery.sort(opts.sort)
        }
      }

      ctx.itemsCount = await ItemModel.count(criteria)
      if (opts.pageSize) {
        let page = ctx.req.query.page
        if (!page || isNaN(page)) {
          page = 1
        }
        ctx.pageNumber = Number(page)
        ctx.pagesCount = Math.ceil(ctx.itemsCount / opts.pageSize)
        itemsQuery = itemsQuery.skip((page - 1) * opts.pageSize).limit(opts.pageSize)
      }

      const items = await itemsQuery


      if (items.length === 0) {
        callback(null, elseBody ? elseBody() : '')
        return
      }

      const data = await Promise.mapSeries(items, async (item, idx) => {
        const currentItem = await item.toContext(ctx.req)
        ctx[key] = currentItem
        return asyncBody()
      })

      ctx[key] = originalValue
      callback(null, data.join(''))
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
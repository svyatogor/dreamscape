import {defaults, map, isEmpty, flatMap, forEach} from 'lodash'
import Promise from 'bluebird'
import {Item} from '../../models'
import jsonic from 'jsonic'
import SearchService from '../../services/search'
const s = require('sugar')
const _ = require('lodash')
const {ObjectID} = require('mongodb')

const mapValuesDeep = (obj, iteree) =>
  _.isArray(obj) ? _.map(obj, v => mapValuesDeep(v, iteree)) : (
    _.isObject(obj) ? _.mapValues(obj, v => mapValuesDeep(v, iteree)) : iteree(obj)
  )

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

    const asyncBody = Promise.promisify(body)

    try {
      const opts = defaults(options, {as: 'item', filter: '{}', sort: 'position', fullText: true})
      if (opts.sort === 'random') {
        delete opts.sort
        opts.random = true
      }
      const key = opts.as
      const originalValue = ctx[key]
      let items
      if (opts.aggregate) {
        let aggregate = jsonic(opts.aggregate).map(step => mapValuesDeep(step, value => {
          if (value && value.toString().startsWith('ID/')) return ObjectID(value.replace('ID/', ''))
          else return value
        }))
        const countResult = await Item.collection.aggregate([...aggregate, {$count: 'count'}]).toArray()
        ctx.itemsCount = countResult[0].count
        if (opts.pageSize) {
          let page = ctx.req.query.page
          if (!page || isNaN(page)) {
            page = 1
          }
          ctx.pageNumber = page
          ctx.pagesCount = Math.ceil(ctx.itemsCount / opts.pageSize)
          aggregate = [...aggregate, {$skip: (page - 1) * opts.pageSize}, {$limit: opts.pageSize}]
        }

        items = await Item.collection.aggregate(aggregate).toArray()

        if (items.length === 0) {
          callback(null, elseBody ? elseBody() : '')
          return
        }

        const data = await Promise.all(map(items, async item => {
          const currentItem = await item
          ctx[key] = currentItem
          return asyncBody()
        }, {concurrency: 1})) // concurrency is crucial here as body() call reads current context

        ctx[key] = originalValue
        callback(null, data.join(''))
      } else {
        const filter = jsonic(opts.filter)
        const rawFilter = opts.rawFilter ? eval(`(${opts.rawFilter})`) : {}

        let criteria = {
          site: ctx.site._id,
          deleted: false,
          catalog,
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
            const safeRegex = opts.search.match(/\w+|"[^"]+"/g).map(t => t.trim().replace(/"/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
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
          const sampleRecords = await Item.aggregate().match(criteria).project({_id: 1}).sample(opts.limit)
          const ids = sampleRecords.map(e => e._id)
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

        items = await itemsQuery


        if (items.length === 0) {
          callback(null, elseBody ? elseBody() : '')
          return
        }

        const data = await Promise.all(map(items, async item => {
          const currentItem = await item.toContext(ctx.req)
          ctx[key] = currentItem
          return asyncBody()
        }, {concurrency: 1})) // concurrency is crucial here as body() call reads current context

        ctx[key] = originalValue
        callback(null, data.join(''))
      }


    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
import {defaults} from 'lodash'
import Promise from 'bluebird'
import {Item} from '../../models'
import jsonic from 'jsonic'
import _ from 'lodash'
const {ObjectID} = require('mongodb')

const mapValuesDeep = (obj, iteree) =>
  _.isArray(obj) ? _.map(obj, v => mapValuesDeep(v, iteree)) : (
    _.isObject(obj) ? _.mapValues(obj, v => mapValuesDeep(v, iteree)) : iteree(obj)
  )

export class query {
  constructor(renderContext) {
    this.tags = ['query']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const catalog = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('else', 'endquery');
    var elseBody = null;

    if(parser.skipSymbol('else')) {
      parser.skip(lexer.TOKEN_BLOCK_END);
      elseBody = parser.parseUntilBlocks('endquery');
    }

    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', catalog, [body, elseBody]);
  }

  async run({ctx}, collection, options, body, elseBody, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    const opts = defaults(options, {as: 'item'})
    const key = opts.as
    const originalValue = ctx[key]
    const asyncBody = Promise.promisify(body)

    try {
      let aggregate = jsonic(options.query).map(step => mapValuesDeep(step, value => {
        if (value && value.toString().startsWith('ID/')) return ObjectID(value.replace('ID/', ''))
        else return value
      }))
      aggregate = [
        {
          $match: {
            site: ObjectID(ctx.req.site._id)
          }
        },
        ...aggregate
      ]

      if (opts.pageSize) {
        const countResult = await Item.collection.aggregate([...aggregate, {$count: 'count'}]).toArray()
        ctx.itemsCount = _.get(countResult, [0, 'count'], 0)
        let page = ctx.req.query.page
        if (!page || isNaN(page)) {
          page = 1
        }
        ctx.pageNumber = Number(page)
        ctx.pagesCount = Math.ceil(ctx.itemsCount / opts.pageSize)
        aggregate = [...aggregate, {$skip: (page - 1) * opts.pageSize}, {$limit: opts.pageSize}]
      }

      const items = await Item.collection.aggregate(aggregate).toArray()

      if (items.length === 0) {
        callback(null, elseBody ? elseBody() : '')
        return
      }

      const data = await Promise.all(_.map(items, async item => {
        const currentItem = await item
        ctx[key] = currentItem
        return asyncBody()
      }, {concurrency: 1})) // concurrency is crucial here as body() call reads current context

      ctx[key] = originalValue
      callback(null, data.join(''))
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
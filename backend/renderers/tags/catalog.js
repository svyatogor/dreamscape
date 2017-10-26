import {defaults, map} from 'lodash'
import {Item} from '../../models'
import jsonic from 'jsonic'

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
    console.log(options);
    if (ctx.inspect) {
      return callback(null, '')
    }

    try {
      const opts = defaults(options, {as: 'item', filter: '{}'})
      const key = opts.as
      const originalValue = ctx[key]

      const filter = jsonic(opts.filter)
      console.log({
        site: ctx.site._id,
        deleted: false,
        catalog,
        ...filter,
      });
      let itemsQuery = Item.where({
        site: ctx.site._id,
        deleted: false,
        catalog,
        ...filter,
      })

      if (opts.limit) {
        itemsQuery = itemsQuery.limit(opts.limit)
      }

      const items = await itemsQuery
      if (items.length === 0) {
        callback(null, elseBody())
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
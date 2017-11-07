import {defaults, map} from 'lodash'
import {Item} from '../../models'

export class catalogitem {
  constructor(renderContext) {
    this.tags = ['catalogitem']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const root = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endcatalogitem');
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', root, [body]);
  }

  async run({ctx}, catalog, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    try {
      const opts = defaults(options, {as: 'item'})
      const key = opts.as
      const originalValue = ctx[key]

      const item = await Item.findOne({catalog, site: ctx.site._id, _id: ctx.page.params})
      ctx[key] = await item.toContext({locale: ctx.req.locale})
      body((error, data) => {
        ctx[key] = originalValue
        callback(error, data)
      })
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
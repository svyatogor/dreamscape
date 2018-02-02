import {defaults, map} from 'lodash'
import {Item} from '../../models'
import mongoose from 'mongoose'

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

      if (!mongoose.Types.ObjectId.isValid(ctx.page.params)) {
        ctx.res.sendStatus(404)
        return
      }
      const item = await Item.findOne({catalog, site: ctx.site._id, _id: ctx.page.params})
      if (!item) {
        ctx.res.sendStatus(404)
        return
      }
      ctx[key] = await item.toContext({locale: ctx.req.locale})
      body((error, data) => {
        ctx[key] = originalValue
        callback(error, data)
      })
    } catch (e) {
      callback(e)
    }
  }
}
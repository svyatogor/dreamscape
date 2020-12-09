import {defaults, get} from 'lodash'
import * as models from '../../models'
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
      const klass = get(models, opts.klass)

      if (!mongoose.Types.ObjectId.isValid(ctx.page.params)) {
        ctx.res.redirect('/')
        return
      }
      const item = await klass.findOne({catalog, site: ctx.site._id, _id: ctx.page.params})
      if (!item) {
        ctx.res.redirect('/')
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
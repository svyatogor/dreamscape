import {defaults} from 'lodash'
import Promise from 'bluebird'
import {Item} from '../../models'

export class load {
  constructor(renderContext) {
    this.tags = ['load']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const root = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endload');
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', root, [body]);
  }

  async run({ctx}, id, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    const opts = defaults(options, {as: 'folder'})
    const asyncBody = Promise.promisify(body)

    try {
      const object = await Item.findOne({site: ctx.req.site._id, _id: id})
      ctx[opts.as] = object.toObject()
      const data = await asyncBody()
      callback(null, data)
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
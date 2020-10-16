import {defaults, map, isString} from 'lodash'
import Promise from 'bluebird'

export class catalogmenu {
  constructor(renderContext) {
    this.tags = ['catalogmenu']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const root = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endcatalogmenu');
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', root, [body]);
  }

  async run({ctx, env: {site}}, catalog, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    try {
      const Folder = site.Folder(catalog)
      const opts = defaults(options, {as: 'folder'})
      const key = opts.as
      const originalValue = ctx[key]

      let parent
      if (isString(opts.root)) {
        parent = opts.root
      } else if (opts.root && opts.root._id) {
        parent = opts.root._id
      }
      const asyncBody = Promise.promisify(body)
      const folders = await Folder
        .find({parent, deleted: false, hidden: {$ne: true}})
        .sort('position')
        .cache()
      const folderObjects = Promise.map(folders, folder =>
        folder.toContext({locale: ctx.req.locale}))
      const data = await Promise.map(folderObjects, folderObject => {
        ctx[key] = folderObject
        return asyncBody()
      }, {concurrency: 1})
      ctx[key] = originalValue
      return callback(null, data.join(''))
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
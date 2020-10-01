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

  async run({ctx}, catalog, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    try {
      const Folder = ctx.req.site.Folder(catalog)
      const opts = defaults(options, {as: 'folder'})
      const key = opts.as
      const originalValue = ctx[key]
      let foldersQuery

      let parent
      if (isString(opts.root)) {
        parent = opts.root
      } else if (opts.root && opts.root._id) {
        parent = opts.root._id
      }
      foldersQuery = Folder.find({parent, deleted: false, hidden: {$ne: true}})
      const asyncBody = Promise.promisify(body)
      return foldersQuery.sort('position').cache().then(async folders => {
        const data = await Promise.map(folders, async folder => {
          const contentFolder = await folder.toContext({locale: ctx.req.locale})
          ctx[key] = {
            ...contentFolder,
            // active: TODO: implement
          }
          return await asyncBody()
        })
        ctx[key] = originalValue
        return callback(null, data.join(''))
      }).catch(err => callback(err))
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
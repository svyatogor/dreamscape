import {defaults, map} from 'lodash'
import {Folder} from '../../models'

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

  async run({ctx}, root, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    try {
      const opts = defaults(options, {as: 'folder'})
      const catalog = options.catalog
      if (!catalog) {
        return callback('Catalog not defined', null)
      }
      const key = opts.as
      const originalValue = ctx[key]
      let foldersQuery

      // if (root === 'self') {
      //   pagesQuery = Page.find({site: ctx.site._id, parent: ctx.page._id})
      // } else if (root === 'parent') {
      //   pagesQuery = Page.find({site: ctx.site._id, parent: ctx.page.parent})
      // } else if (root === 'root') {
        foldersQuery = Folder.find({site: ctx.site._id, catalog, parent: null})
      // } else if (isString(root)) {
      //   const {id: parent} = await resolvePath(root, ctx.req)
      //   pagesQuery = Page.find({site: ctx.site._id, parent})
      // } else if (root._id) {
      //   pagesQuery = Page.find({site: ctx.site._id, parent: root._id})
      // } else {
      //   callback(new Error(`Invalid menu root object ${root}`), null)
      //   return
      // }

      return foldersQuery.sort('position').then(async pages => {
        return Promise.all(map(pages, async folder => {
          const contentFolder = await folder.toContext({locale: ctx.req.locale})
          ctx[key] = {
            ...contentFolder,
            // active: TODO: implement
          }
          return body()
        })).then(data => {
          ctx[key] = originalValue
          callback(null, data.join(''))
        })
      }).catch(err => callback(err))
    } catch (e) {
      console.log(e);
      callback(e)
    }
  }
}
import {defaults, map, isString, includes} from 'lodash'
import {resolvePath} from '../../frontend'
import {Page} from '../../models'

export class menu {
  constructor(renderContext) {
    this.tags = ['menu']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const root = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endmenu');
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', root, [body]);
  }

  async run({ctx}, root, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    const {Page} = ctx.req.site
    try {
      const opts = defaults(options, {as: 'page'})
      const key = opts.as
      const originalValue = ctx[key]
      let pagesQuery

      if (root === 'self') {
        pagesQuery = Page.find({published: true, site: ctx.site._id, parent: ctx.page._id})
      } else if (root === 'parent') {
        pagesQuery = Page.find({published: true, site: ctx.site._id, parent: ctx.page.parent})
      } else if (root === 'root') {
        pagesQuery = Page.find({published: true, site: ctx.site._id, parent: null})
      } else if (isString(root)) {
        const {id: parent} = await resolvePath(root, {...ctx.req})
        pagesQuery = Page.find({published: true, site: ctx.site._id, parent})
      } else if (root._id) {
        pagesQuery = Page.find({published: true, site: ctx.site._id, parent: root._id})
      } else {
        callback(new Error(`Invalid menu root object ${root}`), null)
        return
      }

      return pagesQuery.sort('position').cache().then(async pages => {
        return Promise.all(map(pages, async page => {
          const active = String(page._id) === String(ctx.page._id) ||
            includes(map(ctx.page.parents, p => String(p._id)), String(page._id))
          const contextPage = await page.toContext({site: ctx.site, locale: ctx.req.locale})
          ctx[key] = {
            ...contextPage,
            active,
          }
          return new Promise((resolve, reject) => {
            body((error, data) => {
              if (error) { reject(error) }
              else { resolve(data) }
            })
          })
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
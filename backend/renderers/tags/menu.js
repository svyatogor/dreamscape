import {defaults, map} from 'lodash'
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

  run({ctx}, root, options, body, callback) {
    if (ctx.inspect) {
      return callback(null, '')
    }

    const opts = defaults(options, {as: 'page'})
    const key = opts.as
    const originalValue = ctx[key]
    let pagesQuery

    if (root === 'self') {
      pagesQuery = Page.find({site: ctx.site._id, parent: ctx.page._id})
    } else if (root === 'parent') {
      pagesQuery = Page.find({site: ctx.site._id, parent: ctx.page.parent})
    } else if (root._id) {
      pagesQuery = Page.find({site: ctx.site._id, parent: root._id})
    } else {
      callback(new Error(`Invalid menu root object ${root}`), null)
      return
    }

    pagesQuery.then(pages => {
      const content = map(pages, page => {
        ctx[key] = page.toContext({site: ctx.site, locale: ctx.req.locale})
        return body()
      }).join('')

      ctx[key] = originalValue
      callback(null, content)
    }).catch(err => callback(err))
  }
}
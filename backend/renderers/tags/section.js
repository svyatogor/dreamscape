import {underscore} from 'inflection'
import fs from 'fs'
import {Item} from '../../models'

export class section {
  constructor(renderContext) {
    this.tags = ['section']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    let body
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    // const body = parser.parseUntilBlocks('endsection');
    // parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  run({ctx}, sectionName, body, callback) {
    if (ctx.inspect) {
      ctx.sections.push(sectionName)
      return callback(null, null)
    }
    section.render(sectionName, ctx)
      .then((data) => callback(null, data))
      .catch(err => callback(err))
  }


  static render(sectionName, context) {
    const {req, page, env, site} = context
    if (!page.sections || !page.sections[sectionName]) {
      return Promise.resolve()
    }

    return Promise.all(page.sections[sectionName].map(block => {
      try {
        if (fs.existsSync(`./data/${site.key}/layouts/${page.layout}/${block._type}.html`)) {
          return new Promise(async (resolve, reject) => {
            const item = await ctx.req.site.Item(block._type).findById(block.ref)
            const itemAsContext = await item.toContext(req)
            const nestedContext = {...context, ...itemAsContext}
            env.render(`${page.layout}/${block._type}.html`, nestedContext, (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
            })
          })
        } else {
          const module = require('./index')[underscore(block._type)]
          return module ? module.render(block, context) : ""
        }
      } catch (e) {
        return Promise.reject(`Cannot render block: ${JSON.stringify(block)}, ${e}`)
      }
    })).then(results => results.join(''))
  }
}
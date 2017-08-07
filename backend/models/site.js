import {siteSchema} from './schema'
import mongoose from 'mongoose'
import fs from 'fs'
import {humanize} from 'inflection'
import {zipObject} from 'lodash'
import nunjucks from 'nunjucks'
import {redis} from '../services'


export class _section {
  constructor(renderContext) {
    this.tags = ['section']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();
    let body
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  run(context, sectionName, body, callback) {
    context.ctx.sections.push(sectionName)
  }
}

class SiteClass {
  layouts() {
    const key = `site::${this._id}::layouts`
    return redis.getAsync(key).then((layoutsJson) => {
      if (layoutsJson) {
        return JSON.parse(layoutsJson)
      } else {
        const layoutNames = fs.readdirSync(`./data/${this.key}/layouts`).filter(name => name.indexOf('.') !== 0)
        const layoutValues = layoutNames.map(layout => {
          return {
            name: humanize(layout.replace('-', '_')),
            sections: this.layoutSections(layout)
          }
        })
        const layouts = zipObject(layoutNames, layoutValues)
        redis.setAsync(key, JSON.stringify(layouts))
        return layouts
      }
    })
  }

  layoutSections(layout) {
    if (!this.env) {
      this.env = nunjucks.configure(`./data/${this.key}`)
      this.env.addExtension('section', new _section())
    }
    try {
      const context = {sections: []}
      this.env.render(`layouts/${layout}/index.html`, context)
      return zipObject(context.sections, context.sections.map(s => ({name: humanize(s)})))
    } catch(_) {
      return {}
    }
  }
}

siteSchema.loadClass(SiteClass)
export default mongoose.model('Site', siteSchema)

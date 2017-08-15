import {siteSchema} from './schema'
import mongoose from 'mongoose'
import fs from 'fs'
import {humanize} from 'inflection'
import {zipObject, forEach} from 'lodash'
import nunjucks from 'nunjucks'
import * as tags from '../renderers/tags'
import {redis} from '../services'

class SiteClass {
  get layouts() {
    const key = `site::${this._id}::layouts`
    // return redis.getAsync(key).then((layoutsJson) => {
    //   if (layoutsJson) {
    //     return JSON.parse(layoutsJson)
    //   } else {
    //     try {
          const layoutNames = fs.readdirSync(`./data/${this.key}/layouts`).filter(name => name.indexOf('.') !== 0)
          const layoutValues = layoutNames.map(layout => {
            const layoutInfo = this.layoutInfo(layout)
            return {
              name: humanize(layout.replace('-', '_')),
              sections: layoutInfo.sections,
              properties: layoutInfo.properties
            }
          })
          const layouts = zipObject(layoutNames, layoutValues)
          // redis.setAsync(key, JSON.stringify(layouts))
          return layouts
    //     } catch(e) {
    //       return {}
    //     }
    //   }
    // })
  }

  layoutInfo(layout) {
    if (!this.env) {
      this.env = nunjucks.configure(`./data/${this.key}/layouts`)
      forEach(tags, (tag, name) => {
        this.env.addExtension(name, new tag())
      })
    }
    if (!fs.existsSync(`./data/${this.key}/layouts/${layout}/index.html`)) {
      return {}
    }
    try {
      const context = {inspect: true, sections: [], properties: {}}
      this.env.render(`${layout}/index.html`, context)
      return {
        sections: zipObject(context.sections, context.sections.map(s => ({name: humanize(s)}))),
        properties: context.properties,
      }
    } catch(e) {
      console.log(e);
      return {}
    }
  }
}

siteSchema.loadClass(SiteClass)
export default mongoose.model('Site', siteSchema)

import {siteSchema} from './schema'
import mongoose from 'mongoose'
import fs from 'fs'
import s3 from 's3'
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
      this.env.addFilter('currency', (str, currency, defaultValue = '-') => null)
      this.env.addFilter('date', (str, currency, defaultValue = '-') => null)
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

  syncFile(file) {
    if (file.indexOf('layouts') !== 0) {
      return Promise.resolve()
    }
    const client = s3.createClient({s3Options: {region: 'eu-west-1'}})
    return new Promise((resolve, reject) => {
      const downloader = client.downloadFile({
        localFile: `./data/${this.key}/${file}`,
        s3Params: {
          Bucket: process.env.S3_BUCKET,
          Key: `${this.key}/${file}`
        }
      })
      downloader.on('error', err => {
        // TODO: Report error
        console.error(`Error syncing ${this.key}/${file}`, err)
        reject(err)
      })
      downloader.on('end', () => {
        console.error(`Done syncing ${this.key}/${file}`)
        resolve()
      })
    })
  }
}

siteSchema.loadClass(SiteClass)
export default mongoose.model('Site', siteSchema)

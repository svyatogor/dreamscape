import {map, pickBy, mapValues, omit} from 'lodash'
import mongoose from 'mongoose'
import {t} from '../common/utils'
import {pageSchema} from './schema'

class PageClass {
  toContext({locale, site}) {
    const layout = site.layouts[this.layout]
    const localizedProperies = map(pickBy(layout.properties, 'localized'), 'key')
    return {
      ...omit(this.toObject(), ['properties', 'title']),
      title: t(this.title, locale),
      ...mapValues(this.properties, (prop, key) => {
        if (localizedProperies.includes(key)) {
          return t(prop, locale)
        } else {
          return prop
        }
      })
    }
  }
}

pageSchema.loadClass(PageClass)
export default mongoose.model('Page', pageSchema)

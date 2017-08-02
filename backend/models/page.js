import {pageSchema} from './schema'
import mongoose from 'mongoose'
import {find, flatten} from 'lodash'

class PageClass {
  async findOrCreateSection(key) {
    let section = find(this.sections, {key})
    if (!section) {
      this.sections.push({key, blocks: []})
      await this.save()
      section = find(this.sections, {key})
    }
    return section
  }

  block(id) {
    return flatten(this.sections.map(s => s.blocks)).find(b => b.ref === id)
  }
}

pageSchema.loadClass(PageClass)
export default mongoose.model('Page', pageSchema)

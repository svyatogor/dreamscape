import mongoose from 'mongoose'
import {folderSchema} from './schema'
import {t} from '../common/utils'

class FolderClass {
  async toContext({locale}) {
    return {
      ...this.toObject({virtuals: true}),
      name: t(this.name, locale),
    }
  }
}
folderSchema.loadClass(FolderClass)
export default mongoose.model('Folder', folderSchema)

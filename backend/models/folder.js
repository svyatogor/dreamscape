import mongoose from 'mongoose'
import {folderSchema} from './schema'
import {t} from '../common/utils'

class FolderClass {
  async toContext({locale}) {
    return {
      ...this.toObject({virtuals: true}),
      name: t(this.name, locale),
      leaf: (await Folder.count({parent: this._id, deleted: false})) === 0
    }
  }
}
folderSchema.loadClass(FolderClass)
const Folder = mongoose.model('Folder', folderSchema)
export default Folder

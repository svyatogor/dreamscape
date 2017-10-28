import {fileListSchema} from './schema'
import {t} from '../common/utils'
import mongoose from 'mongoose'
import filesize from 'filesize'

class FileListClass {
  toContext({locale}) {
    const object = this.toObject()
    const files = object.files.map(file => ({
      ...file,
      displayName: t(file.displayName, locale),
      url: `${process.env.ASSETS_DOMAIN}/${file.url}`,
      humanSize: filesize(file.size, {round: 0})
    }))
    return {...object, files}
  }
}

fileListSchema.loadClass(FileListClass)
export default mongoose.model('FileList', fileListSchema)

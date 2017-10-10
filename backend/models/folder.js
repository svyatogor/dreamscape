import mongoose from 'mongoose'
import {folderSchema} from './schema'

class FolderClass {
}
folderSchema.loadClass(FolderClass)
export default mongoose.model('Folder', folderSchema)

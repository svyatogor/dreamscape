import {siteSchema} from './schema'
import mongoose from 'mongoose'

class SiteClass {
}

siteSchema.loadClass(SiteClass)
export default mongoose.model('Site', siteSchema)

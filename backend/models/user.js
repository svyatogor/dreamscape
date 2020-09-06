import {userSchema} from './schema'
import mongoose from 'mongoose'
class UserClass {
}

userSchema.loadClass(UserClass)
export default mongoose.connection.useDb(process.env.ROOT_DB).model('User', userSchema)

import {userSchema} from './schema'
import mongoose from 'mongoose'
class UserClass {
}

userSchema.loadClass(UserClass)
export default mongoose.model('User', userSchema)

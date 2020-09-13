import mongoose from 'mongoose'
import {Base} from '@typegoose/typegoose/lib/defaultClasses'
import {prop, getModelForClass} from '@typegoose/typegoose'

class UserClass extends Base {
	@prop({
		trequired: true,
		lowercase: true,
		trim: true,
		index: true,
		unique: true
	})
	public email!: string
	public name?: string
	public avatar?: string
}

export default getModelForClass(UserClass)

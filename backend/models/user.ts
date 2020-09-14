import { getModelForClass, prop } from '@typegoose/typegoose'
import { Base } from '@typegoose/typegoose/lib/defaultClasses'

export default class User extends Base {
	@prop({
		required: true,
		lowercase: true,
		trim: true,
		index: true,
		unique: true
	})
	public email!: string

	@prop()
	public name?: string

	@prop()
	public avatar?: string

	private static _model = getModelForClass(User)

	static model() {
		return this._model
	}
}

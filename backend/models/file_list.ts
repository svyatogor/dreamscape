import { DocumentType, prop } from '@typegoose/typegoose'
import filesize from 'filesize'
import mongoose from 'mongoose'
import { t } from '../common/utils'

class File {
	@prop()
	public originalName: string

	@prop()
	public displayName: mongoose.Types.Map<string>

	@prop()
	public size: number

	@prop()
	public type: string

	@prop()
	public url: string
}

export default class FileList {
	@prop({_id: false})
	public files: File[]

	@prop()
	public template: string

	toContext(this: DocumentType<FileList>, {locale}: {locale: string}) {
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

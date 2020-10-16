import { DocumentType, modelOptions, prop } from '@typegoose/typegoose'
import filesize from 'filesize'
import { t } from '../common/utils'

@modelOptions({
	schemaOptions: {
		timestamps: true
  },
})
class File {
	@prop()
	public originalName: string

	@prop({type: String})
	public displayName: Map<string, string>

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

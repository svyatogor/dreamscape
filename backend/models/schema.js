import {Schema} from 'mongoose'

const i18nString = new Schema({
  locale: String,
  value: String,
})

const pageSchema = new Schema({
  slug: {type: String, required: "{PATH} is required"},
  published: Boolean,
  layout: String,
  parent: { type: Schema.Types.ObjectId, ref: 'Page' },
  title: [i18nString],
  linkName: [i18nString],
  sections: [{
    key: String,
    blocks: Object
  }],
})

export {
  pageSchema,
}

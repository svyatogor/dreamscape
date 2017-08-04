import {Schema} from 'mongoose'

const siteSchema = new Schema({
  key: {type: String, required: true},
  domains: [String],
})

const pageSchema = new Schema({
  slug: {type: String, required: "{PATH} is required"},
  published: Boolean,
  layout: String,
  parent: {type: Schema.Types.ObjectId, ref: 'Page'},
  site: {type: Schema.Types.ObjectId, ref: 'Site'},
  title: Object,
  linkText: Object,
  sections: Object,
})

const staticTextSchema = new Schema({
  content: Object,
  images: [String]
})

export {
  pageSchema,
  siteSchema,
  staticTextSchema,
}

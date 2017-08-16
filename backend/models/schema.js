import {Schema} from 'mongoose'

const userSchema = new Schema({
  email: {type: String, required: true, lowercase: true, trim: true, index: true, unique: true},
  name: {type: String},
  avatar: {type: String},
})

const siteSchema = new Schema({
  key: {type: String, required: true},
  domains: [String],
  allowedModules: [String],
  supportedLanguages: [String],
  users: [String]
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
  properties: Object,
  position: {type: Number, default: 9999}
})

const staticTextSchema = new Schema({
  content: Object,
  images: [String],
  site: {type: Schema.Types.ObjectId, ref: 'Site'},
  key: String,
  global: {type: Boolean, default: false}
})

export {
  userSchema,
  pageSchema,
  siteSchema,
  staticTextSchema,
}

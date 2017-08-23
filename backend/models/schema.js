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
  users: [String],
  features: [String],
  documentTypes: JSON,
})

const memberSchema = new Schema({
  email: String,
  firstName: String,
  lastName: String,
  passwordHash: String,
}, {strict: false, timestamps: true})

const ordersSchema = new Schema({
  member: {type: Schema.Types.ObjectId, ref: 'Member'},
  items: [{
    product: {type: Schema.Types.ObjectId, required: true},
    quantity: {type: Number, default: 1},
    price: Number,
    discount: Number,
    subtotal: Number,
  }],
  total: Number,
  status: {type: String},
}, {strict: false, timestamps: true})

const itemSchema = new Schema({
  catalog: String,
  folder: {type: Schema.Types.ObjectId, ref: 'Folder'},
  site: {type: Schema.Types.ObjectId, ref: 'Site'},
}, {strict: false, timestamps: true})

const folderSchema = new Schema({
  name: Object,
  slug: String,
  position: {type: Number, default: 9999},
  parent: {type: Schema.Types.ObjectId, ref: 'Folder'},
  site: {type: Schema.Types.ObjectId, ref: 'Site'},
  catalog: String,
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
  itemSchema,
  folderSchema,
  memberSchema,
  ordersSchema,
}

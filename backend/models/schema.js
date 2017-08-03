import {Schema} from 'mongoose'

const pageSchema = new Schema({
  slug: {type: String, required: "{PATH} is required"},
  published: Boolean,
  layout: String,
  parent: {type: Schema.Types.ObjectId, ref: 'Page'},
  title: Object,
  linkText: Object,
  sections: Object,
})

const staticTextSchema = new Schema({
  content: Object
})

export {
  pageSchema,
  staticTextSchema,
}

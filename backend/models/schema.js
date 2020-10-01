import {Schema} from 'mongoose'

const addressSchema = new Schema({
  country: String,
  city: String,
  postalCode: String,
  streetAddress: String,
  name: String,
  email: String,
  phone: String,
})

const orderLineSchema = new Schema({
  product: {type: Schema.Types.ObjectId, ref: 'Item'},
  productData: Object,
  name: String,
  image: String,
  count: Number,
  price: Number,
  discount: Number,
  discountType: String,
  tax: Number,
  taxAmount: Number,
  subtotal: Number,
  total: Number,
})

const orderSchema = new Schema({
  number: Number,
  lines: [orderLineSchema],
  site: {type: Schema.Types.ObjectId, ref: 'Site'},
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  status: String,
  paymentMethod: String,
  paymentStatus: String,
  subtotal: Number,
  tax: Number,
  deliveryMethod: String,
  deliveryCost: Number,
  deliveryDiscount: Number,
  total: Number,
  taxTotal: Number,
  comments: String,
  user: {type: Schema.Types.ObjectId, ref: 'Item'},
  // createdAt: Date,
  // updatedAt: Date,
}, {strict: false, timestamps: true})

// orderSchema.pre('save', function(next) {
//   const now = new Date()
//   this.updatedAt = now
//   if (!this.createdAt) {
//     this.created_at = now
//   }
//   next()
// })

export {
  fileListSchema,
  orderSchema,
}

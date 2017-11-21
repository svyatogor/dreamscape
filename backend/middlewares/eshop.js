import express from 'express'
import BaseJoi from 'joi'
import JoiPhoneNumberExtensions from 'joi-phone-number-extensions'
import {form as  joiToForms} from 'joi-errors-for-forms'
import bodyParser from 'body-parser'
import {get} from 'lodash'
import fetch from 'node-fetch'
import Cart from '../models/eshop/cart'
import Order from '../models/eshop/order'
import PaymentServices from './payment_services'

const Joi = BaseJoi.extend(JoiPhoneNumberExtensions)

const addressSchema = Joi.object().keys({
  name: Joi.string().max(250).required(),
  email: Joi.string().email().required(),
  phone: Joi.phoneNumber().defaultRegion('CY').format('NATIONAL'),
  country: Joi.string().max(2).optional().default('CY'),
  city: Joi.string().required(),
  postalCode: Joi.string().required(),
  streetAddress: Joi.string().required(),
})

const orderSchema = Joi.object().keys({
  billingAddress: addressSchema.required(),
  shippingAddress: addressSchema.optional(),
  paymentMethod: Joi.string().required(),
  deliveryMethod: Joi.string().optional(),
})

export const eshop = express()
eshop.use(bodyParser.urlencoded({extended: true}))

eshop.get('/eshop/add_to_cart/:id', async (req, res, next) => {
  const cart = new Cart(req)
  cart.add(req.params.id)
  res.cookie('cart', cart.serialize())
  req.flash('info', 'eshop.info.product_added')
  res.redirect(req.get('Referrer'))
})

eshop.post('/eshop/checkout', async (req, res, next) => {
  const cart = new Cart(req)

  if (cart.count < 1) {
    res.redirect(req.site.eshop.rootPage || '/')
    return
  }

  const {value, error} = Joi.validate(req.body, orderSchema, {abortEarly: false, stripUnknown: true})
  if (error) {
    req.flash('validation', joiToForms()(error))
    res.redirect(get(req.site, 'eshop.cartPage') || req.get('Referrer'))
    return
  }

  const order = await Order.buildFromCart(cart)
  order.billingAddress = value.billingAddress
  order.shippingAddress = value.shippingAddress
  order.deliveryMethod = value.deliveryMethod
  order.paymentMethod = value.paymentMethod
  order.status = 'new'

  const paymentService = PaymentServices[order.paymentMethod]
  if (!paymentService) {
    req.flash('error', 'eshop.errors.unsuported_payment_option')
    res.redirect(req.get('Referrer'))
    return
  }

  try {
    console.log(order);
    await order.save()
    // res.cookie('cart', [])
  } catch (e) {
    console.log(e)
    req.flash('error', 'eshop.errors.generic_checkout_error')
    res.redirect(req.get('Referrer'))
    return
  }
  await paymentService(order, req, res)

  // TODO:
  // const enoughStock = await order.enoughStock()
  // if (!enoughStock) {
  //   req.flash('error', 'eshop.errors.cart_not_enough_stock')
  //   res.redirect(res.redirect(req.site.eshop.cartPage || req.get('Referrer')))
  //   return
  // }
})

eshop.post('/eshop/paypal/start', async (req, res, next) => {
  const payload = {
    "intent": "sale",
    // "experience_profile_id":"experience_profile_id",
    "redirect_urls":
    {
      "return_url": "https://example.com",
      "cancel_url": "https://example.com"
    },
    "payer":
    {
      "payment_method": "paypal"
    },
    "transactions": [
    {
      "amount":
      {
        "total": "4.00",
        "currency": "USD",
        "details":
        {
          "subtotal": "2.00",
          "shipping": "1.00",
          "tax": "2.00",
          "shipping_discount": "-1.00"
        }
      },
      "item_list":
      {
        "items": [
        {
          "quantity": "1",
          "name": "item 1",
          "price": "1",
          "currency": "USD",
          "description": "item 1 description",
          "tax": "1"
        },
        {
          "quantity": "1",
          "name": "item 2",
          "price": "1",
          "currency": "USD",
          "description": "item 2 description",
          "tax": "1"
        }]
      },
      "description": "The payment transaction description.",
      "invoice_number": "merchant invoice",
      "custom": "merchant custom data"
    }]
  }

  // curl -v https://api.sandbox.paypal.com/v1/oauth2/token \
  // -H "Accept: application/json" \
  // -H "Accept-Language: en_US" \
  // -u "client_id:secret" \
  // -d "grant_type=client_credentials"

  const auth ='Basic ' + new Buffer('AQGhxWTR0wcE-A5lGxdiihHp8F_xO9-RTwf0TQWVhF7jEN25ocVtVDCw18JvUqzK8sdwK1KbKWuY_I4Q:EP_ONj3ds1jbAo6FGMma4d4kp0s5AjhXVWk0JhswvNNE-1EAhRujkqGvkQbtdv_RXDpGvZuD6eJi9CjV').toString('base64');
  const credentials = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: auth
    },
    body: "grant_type=client_credentials"
  })
  const accessToken = (await credentials.json()).access_token

  const paymentRes = await fetch('https://api.sandbox.paypal.com/v1/payments/payment', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  })
  const payment = await paymentRes.json()
  res.json(payment)
})
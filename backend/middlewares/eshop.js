import express from 'express'
import BaseJoi from 'joi'
import JoiPhoneNumberExtensions from 'joi-phone-number-extensions'
import {form as  joiToForms} from 'joi-errors-for-forms'
import bodyParser from 'body-parser'
import {get, isEmpty, isNumber, pick} from 'lodash'
import fetch from 'node-fetch'
import numeral from 'numeral'
import Stripe from 'stripe'
import Cart from '../models/eshop/cart'
import Order from '../models/eshop/order'
import braintree from 'braintree'
import {mailTransporter} from '../../common/mailer'
import {renderEmail} from '../renderers'
import {t} from '../common/utils'
import {auth} from './auth'

const Joi = BaseJoi.extend(JoiPhoneNumberExtensions)

const addressSchema = site => Joi.object().keys({
  name: Joi.string().max(250).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(), //phoneNumber().defaultRegion('CY').format('NATIONAL'),
  country: Joi.string().max(2).optional().default('CY'),
  city: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  streetAddress: Joi.string().optional(),
  comments: Joi.string().optional().allow(''),
})

const orderSchema = site => Joi.object().keys({
  billingAddress: addressSchema(site),
  shippingAddress: addressSchema(site),
  // deliveryMethod: Joi.string().required().only(Object.keys(site.eshop.deliveryMethods)),
}).or('billingAddress', 'shippingAddress')

export const eshop = express()
eshop.use(bodyParser.urlencoded({extended: true}))
eshop.use(auth)
eshop.use((req, res, next) => {
  req.flash('referrer', req.get('Referrer'))
  req.flash('info', req.get('Referrer'))
  next()
})

eshop.get('/eshop/add_to_cart/:id', async (req, res, next) => {
  const cart = new Cart(req)
  cart.add(req.params.id)
  res.cookie('cart', cart.serialize())
  req.flash('info', 'eshop.info.product_added')
  res.redirect(get(req.site, 'eshop.cartPage'))
})

eshop.get('/eshop/remove_from_cart/:id', async (req, res, next) => {
  const cart = new Cart(req)
  cart.remove(req.params.id)
  res.cookie('cart', cart.serialize())
  req.flash('info', 'eshop.info.product_added')
  res.redirect(get(req.site, 'eshop.cartPage'))
})

eshop.get('/eshop/:action_cart_count/:id', async (req, res, next) => {
  const cart = new Cart(req)
  if (req.params.action_cart_count === 'inc_cart_count') {
    await cart.inc(req.params.id, 1)
  } else if (req.params.action_cart_count === 'dec_cart_count') {
    await cart.inc(req.params.id, -1)
  }
  res.cookie('cart', cart.serialize())
  req.flash('info', 'eshop.info.product_added')
  res.redirect(get(req.site, 'eshop.cartPage'))
})

eshop.post('/eshop/set_cart_count/:id', async (req, res, next) => {
  const cart = new Cart(req)
  const count = Number(get(req.body, 'count'))
  if (!isNumber(count)) {
    res.sendStatus(400).end()
    return
  }
  await cart.set(req.params.id, count)
  res.cookie('cart', cart.serialize())
  req.flash('info', 'eshop.info.product_added')
  res.redirect(get(req.site, 'eshop.cartPage'))
})

eshop.post('/eshop/setDeliveryMethod', async (req, res, next) => {
  const {deliveryMethod, shippingAddress} = req.body
  console.log(req.body)
  const cart = new Cart(req)
  cart.setDelivery(deliveryMethod, shippingAddress)
  res.cookie('cart', cart.serialize())
  res.redirect(get(req.site, 'eshop.cartPage'))
})

eshop.post('/eshop/checkout', async (req, res, next) => {
  const cart = new Cart(req)
  if (cart.count < 1) {
    res.redirect(req.site.eshop.rootPage || '/')
    return
  }

  if (req.site.eshop.requireValidUser && !req.viewer) {
    res.redirect(get(req.site, 'auth.loginUrl', '/'))
    return
  }

  const order = new Order({site: req.site._id, status: 'draft'})
  if (req.viewer) {
    order.user = req.viewer._id
  }

  if (req.site.eshop.requireValidUser && req.viewer && get(req.site.eshop, 'copyDetailsFromUser', true) === true) {
    order.comments = req.body.comments
    order.billingAddress = {
      email: req.viewer.email,
    }
    order.shippingAddress = {
      email: req.viewer.email,
    }
  } else {
    const {value, error} = Joi.validate(req.body, orderSchema(req.site), {abortEarly: false, stripUnknown: true})
    if (error) {
      console.log(error)
      req.flash('validation', joiToForms()(error))
      res.redirect(get(req.site, 'eshop.cartPage') || req.get('Referrer'))
      return
    }

    order.comments = value.comments
    order.billingAddress = value.billingAddress
    order.shippingAddress = value.shippingAddress || value.billingAddress
  }
  await order.addItemsFromCart(cart)
  await order.setDeliveryMethod(cart.deliveryMethod)
  await order.setDefaultPaymentMethod()

  try {
    await order.save()
    if (isEmpty(req.site.eshop.paymentMethods)) {
      try {
        await order.finalize(() => true)
        await order.save()
        await sendOrderNotificatin(req, order)
        res.cookie('cart', [])
        res.redirect(get(req.site, 'eshop.cartPage') + `/thankyou/${order.id}`)
      } catch (e) {
        console.log(e)
        req.flash('error', 'eshop.errors.generic_checkout_error')
        res.redirect(req.get('Referrer'))
      }
    } else {
      res.redirect(get(req.site, 'eshop.cartPage') + '/complete/' + order._id)
    }
  } catch (e) {
    console.log(e)
    req.flash('error', 'eshop.errors.generic_checkout_error')
    res.redirect(req.get('Referrer'))
    return
  }
})

eshop.post('/eshop/checkoutWithStripe', async (req, res, next) => {
  if (req.body.orderId) {
    const {stripe: {secretKey}} = req.site.eshop.paymentMethods
    const stripe = await Stripe(secretKey)
    const order = await Order.findById(req.body.orderId)
    const {stripePaymentIntent, _id: id, number} = order.toObject()
    if (stripePaymentIntent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntent)
      if (paymentIntent.status === 'requires_payment_method') {
        return res.json({secret: paymentIntent.client_secret, order: {id, number}})
      } else {
        res.status(409).json({error: 'Payment is being processed or oder is already paid'})
      }
    } else {
      res.status(400).json({error: 'Invalid order. Please contact support.'})
    }
  }

  const cart = new Cart(req)
  try {
    await cart.checkStock()
  } catch (e) {
    res.status(422).json({error: e.message})
  }
  if (cart.count < 1) {
    res.status(422).json({error: 'Cart is empty'})
    return
  }

  if (req.site.eshop.requireValidUser && !req.viewer) {
    res.status(401)
    return
  }

  const order = new Order({site: req.site._id, status: 'draft'})
  if (req.viewer) {
    order.user = req.viewer._id
  }

  if (req.site.eshop.requireValidUser && req.viewer && get(req.site.eshop, 'copyDetailsFromUser', true) === true) {
    order.comments = req.body.comments
    order.billingAddress = {
      email: req.viewer.email,
    }
    order.shippingAddress = {
      email: req.viewer.email,
    }
  } else {
    const {value, error} = Joi.validate(req.body, orderSchema(req.site), {abortEarly: false, stripUnknown: true})
    if (error) {
      res.status(400).json({error: joiToForms()(error)})
      return
    }

    order.comments = value.comments
    order.billingAddress = value.billingAddress || value.shippingAddress
    order.shippingAddress = value.shippingAddress || value.billingAddress
  }
  await order.addItemsFromCart(cart)
  await order.setDeliveryMethod(cart.deliveryMethod)
  await order.setPaymentMethod('stripe')

  try {
    const {stripe: {secretKey}} = req.site.eshop.paymentMethods
    const stripe = await Stripe(secretKey)
    await order.save()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total * 100,
      currency: 'eur',
      receipt_email: order.billingAddress.email,
      shipping: {
        address: {
          line1: order.shippingAddress.streetAddress,
          country: order.shippingAddress.country,
          postal_code: order.shippingAddress.postalCode,
          city: order.shippingAddress.city,
        },
        name: order.shippingAddress.name,
        phone: order.shippingAddress.phone,
      },
      metadata: {orderId: order.id},
      description: `#${order.number}`,
    })
    order.set({
      stripePaymentIntent: paymentIntent.id,
    })
    await order.save()
    res.json({secret: paymentIntent.client_secret, order: pick(order, ['id', 'number'])})
  } catch (e) {
    console.log(e)
    res.status(500).json({error: 'Cannot create payment request'})
    return
  }
})

eshop.post('/eshop/stripeWebhook', bodyParser.raw({type: 'application/json'}), async (req, res, next) => {
  const {stripe: {secretKey, webhookSecret}} = req.site.eshop.paymentMethods
  const stripe = await Stripe(secretKey)

  const payload = req.body;
  const sig = req.headers['stripe-signature'];

  let event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error(err)
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    try {
      const {metadata: {orderId}, id} = event.data.object
      const order = await Order.findById(orderId)
      console.log(order.stripePaymentIntent, id)
      if (order.stripePaymentIntent !== id) {
        res.status(400).send('Invalid order id. Payment intent doesnt match')
        return
      }

      if (order.status !== 'draft') {
        res.status(400).send('Order already processed')
        return
      }

      await order.finalize(() => true)
      order.set({paymentStatus: 'paid'})
      await order.save()
      await sendOrderNotificatin(req, order)
      res.status(200)
    } catch (e) {
      console.error(e)
      res.status(500)
    }
  } else {
    res.status(400).send('Unsupported event')
  }
})

eshop.post('/eshop/order/:order/setDeliveryMethod', async (req, res) => {
  const order = await Order.findOne({_id: req.params.order, site: req.site._id, status: 'draft'})
  if (!order) {
    res.sendStatus(404)
    return
  }
  const allowedMethods = await order.availableDeliveryMethods
  const {delivery_method} = req.body
  if (!Object.keys(allowedMethods).includes(delivery_method)) {
    res.sendStatus(404)
    return
  }

  await order.setDeliveryMethod(delivery_method)
  await order.save()
  res.redirect(req.get('Referrer'))
})

const setPaymentMethod = async (req, res, payment_method) => {
  const order = await Order.findOne({_id: req.params.order, site: req.site._id, status: 'draft'})
  if (!order) {
    res.sendStatus(404)
    return
  }
  const allowedMethods = await req.site.eshop.paymentMethods
  if (!(payment_method in allowedMethods)) {
    res.sendStatus(404)
    return
  }

  await order.setPaymentMethod(payment_method)
  await order.save()
  res.redirect(req.get('Referrer'))
}

eshop.post('/eshop/order/:order/setPaymentMethod', async (req, res, next) => {
  const {payment_method} = req.body
  await setPaymentMethod(req, res, payment_method)
})

eshop.get('/eshop/order/:order/setPaymentMethod/:payment_method', async (req, res, next) => {
  const {payment_method} = req.params
  await setPaymentMethod(req, res, payment_method)
})

eshop.get('/eshop/order/:order/completeWithCashOnDelivery', async (req, res, next) => {
  if (!('cash_on_delivery' in req.site.eshop.paymentMethods)) {
    res.sendStatus(404)
    return
  }
  const order = await Order.findOne({_id: req.params.order, site: req.site._id, status: 'draft'})
  if (!order) {
    res.sendStatus(404)
    return
  }

  order.set({paymentMethod: 'cash_on_delivery', paymentStatus: 'pending'})
  order.finalize(() => Promise.resolve())
    .then(async () => {
      await order.save()
      await sendOrderNotificatin(req, order)
      res.cookie('cart', [])
      res.redirect(get(req.site, 'eshop.cartPage') + `/thankyou/${order.id}`)
    })
    .catch(e => {
      console.log(e)
      req.flash('error', 'eshop.errors.generic_checkout_error')
      res.redirect(req.get('Referrer'))
    })
})

eshop.post('/eshop/order/:order/completeWithBraintree', async (req, res, next) => {
  if (!('braintree' in req.site.eshop.paymentMethods)) {
    res.sendStatus(404)
    return
  }
  const order = await Order.findOne({_id: req.params.order, site: req.site._id})
  if (!order) {
    res.sendStatus(404)
    return
  }

  const {braintree: {merchantId, publicKey, privateKey, environment}} = req.site.eshop.paymentMethods
  const gateway = braintree.connect({
    environment: braintree.Environment[environment],
    merchantId,
    publicKey,
    privateKey
  })
  const billingFirstName = order.billingAddress.name.split(' ')[0]
  const billingLastName = order.billingAddress.name.split(' ').slice(1).join(' ')
  const shippingFirstName = order.shippingAddress.name.split(' ')[0]
  const shippingLastName = order.shippingAddress.name.split(' ').slice(1).join(' ')

  const payload = {
    amount: numeral(order.total).format('0.00'),
    shippingAmount: numeral(order.deliveryCost).format('0.00'),
    taxAmount: numeral(order.taxTotal).format('0.00'),
    orderId: order.number,
    paymentMethodNonce: req.body.nonce,
    customer: {
      email: order.billingAddress.email,
      firstName: billingFirstName,
      lastName: billingLastName,
    },
    billing: {
      firstName: billingFirstName,
      lastName: billingLastName,
    },
    shipping: {
      firstName: shippingFirstName,
      lastName: shippingLastName,
    },
    options: {
      submitForSettlement: true
    }
  }

  try {
    await order.finalize(async () => {
      const receipt = await gateway.transaction.sale(payload)
      if (!receipt.success) {
        throw new Error("Transaction declined")
      }

      order.set({
        receipt,
        paymentStatus: 'paid',
      })
      await order.save()
    })
    await sendOrderNotificatin(req, order)
    res.cookie('cart', [])
    res.redirect(get(req.site, 'eshop.cartPage') + `/thankyou/${order.id}`)
  } catch (e) {
    console.log(e)
    req.flash('error', e.message || 'eshop.errors.generic_checkout_error')
    res.redirect(req.get('Referrer'))
  }
})

eshop.get('/eshop/order/:order/completeWithQuickPay', async (req, res, next) => {
  if (!('quickpay' in req.site.eshop.paymentMethods)) {
    res.sendStatus(404)
    return
  }
  const order = await Order.findOne({_id: req.params.order, site: req.site._id, status: 'draft'})
  if (!order) {
    res.sendStatus(404)
    return
  }

  order.set({paymentMethod: 'quickpay', paymentStatus: 'pending'})
  order.finalize(() => Promise.resolve())
    .then(async () => {
      await order.save()
      await sendOrderNotificatin(req, order)
      res.cookie('cart', [])
      res.redirect(get(req.site, 'eshop.cartPage') + `/thankyou/${order.id}`)
    })
    .catch(e => {
      console.log(e)
      req.flash('error', 'eshop.errors.generic_checkout_error')
      res.redirect(req.get('Referrer'))
    })
})

eshop.post('/eshop/order/:order/completeWithPayPal', async (req, res, next) => {
  if (!('paypal' in req.site.eshop.paymentMethods)) {
    res.sendStatus(404)
    return
  }
  const order = await Order.findOne({_id: req.params.order, site: req.site._id, status: 'draft'})
  if (!order) {
    res.sendStatus(404)
    return
  }

  const auth = 'Basic ' + new Buffer(req.site.eshop.paypalClientId + ':' + req.site.eshop.paypalSecret).toString('base64');
  const credentials = await fetch(`${process.env.PAYPAL_API_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: auth
    },
    body: "grant_type=client_credentials"
  })
  const accessToken = (await credentials.json()).access_token

  try {
    await order.finalize(() => {
      return fetch(`${process.env.PAYPAL_API_URL}/payments/payment/${order.get('paypalPaymentRequest').id}/execute`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `bearer ${accessToken}`
        },
        body: JSON.stringify({payer_id: req.body.payerID})
      })
        .then(result => result.json())
        .then(async receipt => {
          if (receipt.state === 'approved') {
            order.set({
              receipt,
              paymentStatus: 'paid',
            })
            await sendOrderNotificatin(req, order)
            await order.save()
            res.cookie('cart', [])
            res.json(receipt)

          } else {
            return Promise.reject()
          }
        })
    })
  } catch (e) {
    console.log(e)
    req.flash('error', 'eshop.errors.generic_checkout_error')
    res.redirect(req.get('Referrer'))
  }
})

eshop.post('/eshop/order/:order/createPayPalPayment', async (req, res, next) => {
  const order = await Order.findOne({_id: req.params.order, site: req.site._id, status: 'draft'})
  if (!order) {
    res.sendStatus(404)
    return
  }
  const cartPage = get(req.site, 'eshop.cartPage')
  const payload = {
    intent: "sale",
    redirect_urls: {
      return_url: `${req.protocol}://${req.hostname}${cartPage}/thankyou/${order._id}`,
      cancel_url: `${req.protocol}://${req.hostname}${cartPage}/complete/${order._id}`,
    },
    payer: {
      payment_method: "paypal"
    },
    transactions: [
      {
        amount: {
          total: numeral(order.total).format('0.00'),
          currency: "EUR",
          "details": {
            "shipping": numeral(order.deliveryCost).format('0.00'),
            "subtotal": numeral(order.subtotal).format('0.00'),
            "tax": numeral(order.taxTotal).format('0.00'),
            // "shipping_discount": "-1.00"
          }
        },
        item_list: {
          items: order.lines.map(line => ({
            name: line.name,
            quantity: line.count,
            price: numeral(0.01).format('0.00'),
            currency: 'EUR',
          })),
          shipping_address: {
            recipient_name: get(order.shippingAddress, 'name', order.billingAddress.name),
            line1: get(order.shippingAddress, 'streetAddress', order.billingAddress.streetAddress),
            city: get(order.shippingAddress, 'city', order.billingAddress.city),
            country_code: get(order.shippingAddress, 'country', order.billingAddress.country || 'CY'),
            postal_code: get(order.shippingAddress, 'postalCode', order.billingAddress.postalCode),
            phone: get(order.shippingAddress, 'phone', order.billingAddress.phone),
          }
        },
        description: `Payment for order #${order.number} at ${req.site.eshop.legalName}`,
        invoice_number: order.number,
        payment_options: {
          allowed_payment_method: "INSTANT_FUNDING_SOURCE"
        },
      }
    ]
  }

  const auth = 'Basic ' + new Buffer(req.site.eshop.paypalClientId + ':' + req.site.eshop.paypalSecret).toString('base64');
  const credentials = await fetch(`${process.env.PAYPAL_API_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: auth
    },
    body: "grant_type=client_credentials"
  })
  const accessToken = (await credentials.json()).access_token

  const paymentRes = await fetch(`${process.env.PAYPAL_API_URL}/payments/payment`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  })
  const paypalPaymentRequest = await paymentRes.json()
  order.set({paymentMethod: 'paypal', paypalPaymentRequest})
  await order.save()
  res.json(paypalPaymentRequest)
})

const sendOrderNotificatin = async (req, order) => {
  const {site, locale, viewer} = req
  const orderData = {
    ...order.toObject(),
    id: order._id,
    deliveryMethodLabel: t(get(site.eshop.deliveryMethods, [order.deliveryMethod, 'label'], order.deliveryMethod), locale),
    user: viewer,
  }
  await renderEmail({site}, 'email_order_confirmation', {order: orderData}).then(({body, subject}) => {
    mailTransporter.sendMail({
      from: get(site, 'fromEmail', process.env.FROM_EMAIL),
      to: order.billingAddress.email,
      subject,
      html: body,
    })
  })

  await renderEmail({site}, 'email_order_confirmation', {order: orderData}).then(({body, subject}) => {
    mailTransporter.sendMail({
      from: get(site, 'fromEmail', process.env.FROM_EMAIL),
      to: site.notificationEmail,
      subject,
      html: body,
    })
  })
}

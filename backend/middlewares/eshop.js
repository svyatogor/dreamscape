import express from 'express'
import BaseJoi from 'joi'
import JoiPhoneNumberExtensions from 'joi-phone-number-extensions'
import {form as  joiToForms} from 'joi-errors-for-forms'
import bodyParser from 'body-parser'
import {get, includes, isEmpty} from 'lodash'
import fetch from 'node-fetch'
import numeral from 'numeral'
import Cart from '../models/eshop/cart'
import Order from '../models/eshop/order'
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
  billingAddress: addressSchema(site).required(),
  shippingAddress: addressSchema(site).optional(),
  // deliveryMethod: Joi.string().required().only(Object.keys(site.eshop.deliveryMethods)),
})

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
  console.log('inc_cart_count', req.originalUrl)
  const cart = new Cart(req)
  if (req.params.action_cart_count === 'inc_cart_count') {
    cart.inc(req.params.id, 1)
  } else if (req.params.action_cart_count === 'dec_cart_count') {
    cart.inc(req.params.id, -1)
  }
  res.cookie('cart', cart.serialize())
  req.flash('info', 'eshop.info.product_added')
  res.redirect(get(req.site, 'eshop.cartPage'))
})

eshop.post('/eshop/checkout', async (req, res, next) => {
  const cart = new Cart(req)
  console.log(cart.count)
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
      email: req.viewer.email
    }
    order.shippingAddress = {
      email: req.viewer.email
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
  await order.setDefaultDeliveryMethod()

  try {
    await order.save()
    // TODO:
    if (isEmpty(req.site.eshop.allowedMethods)) {
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

eshop.post('/eshop/order/:order/setDeliveryMethod', async (req, res, next) => {
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

  await order.setDeliveryMethod(delivery_method, allowedMethods[delivery_method])
  await order.save()
  res.redirect(req.get('Referrer'))
})

eshop.get('/eshop/order/:order/completeWithCashOnDelivery', async (req, res, next) => {
  if (!includes(req.site.eshop.allowedPaymentMethods, 'cash_on_delivery')) {
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

eshop.post('/eshop/order/:order/completeWithPayPal', async (req, res, next) => {
  if (!includes(req.site.eshop.allowedPaymentMethods, 'paypal')) {
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

  let receipt
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
          } else {
            return Promise.reject()
          }
        })
    })
    await order.save()
    res.cookie('cart', [])
    res.json(receipt)
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
            price: numeral(line.subtotal).format('0.00'),
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
  const {site, locale} = req
  const orderData = {
    ...order.toObject(),
    id: order._id,
    deliveryMethodLabel: t(get(site.eshop.deliveryMethods, [order.deliveryMethod, 'label'], order.deliveryMethod), locale),
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
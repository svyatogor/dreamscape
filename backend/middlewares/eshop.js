import express from 'express'
import cookieParser from 'cookie-parser'
import {Cart} from '../models'

export const eshop = express()
eshop.use(cookieParser())

eshop.post('/eshop/add_to_cart/:id', (req, res, next) => {
  const cart = new Cart(req)
  cart.add(req.params.id)
  req.cookie('cart', cart.serialize())
  res.redirect(req.site.eshop.cartPage)
})
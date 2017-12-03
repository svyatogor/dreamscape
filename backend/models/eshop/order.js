import mongoose from 'mongoose'
import {sumBy, some, isNil, get} from 'lodash'
import Promise from 'bluebird'
import {orderSchema} from '../schema'
import Product from './product'
import Site from '../site'
import AsyncLock from 'async-lock'
import {mailTransporter} from '../../common/mailer'
import {renderEmail} from '../../renderers'
import * as deliveryMethods from '../../services/delivery'

const lock = new AsyncLock({Promise})

class OrderClass {
  async addItemsFromCart(cart) {
    const items = await cart.items
    const lines = await Promise.map(items, async item => {
      const {
        count,
        product: {priceWithoutTaxes, taxAmount, finalPrice, tax, productName, productImage}
      } = item
      return {
        product: item.product,
        name: await productName,
        image: await productImage,
        count: count,
        discount: 0,
        discountType: 'none',

        price: priceWithoutTaxes,
        tax: tax,
        taxAmount: taxAmount,

        subtotal: priceWithoutTaxes * count,
        taxTotal: taxAmount * count,
        total: finalPrice * count,
      }
    })
    this.set({
      lines,
      subtotal: sumBy(lines, 'subtotal'),
      taxTotal: sumBy(lines, 'taxTotal'),
      total: sumBy(lines, 'total'),
    })
  }

  async setDeliveryMethod(key, method) {
    const deliveryCost = deliveryMethods[method.policy](method, this)
    this.set({
      deliveryMethod: key,
      deliveryCost,
      total: this.subtotal + deliveryCost
    })
  }

  finilize(completePayment) {
    return lock.acquire('eshop-stock-reduce', async () => {
      const products = await Promise.map(this.lines, async line => {
        return Product.findOne({_id: line.product, site: this.site, $where: `this.stock >= ${line.count}`})
      })
      if (some(products, isNil)) {
        throw new Error("Not enough stock")
      }
      await completePayment()
      await Promise.map(this.lines, line =>
        Product.findByIdAndUpdate(line.product, {$inc: {stock: -1 * line.count}})
      )
    }).then(async () => {
      this.set({status: 'new'})
      await this.save()

      const site = await Site.findOne({_id: this.site}).cache(10)
      await renderEmail({site}, 'email_order_confirmation', {order: this}).then(({body, subject}) => {
        console.log('subject', subject)
        mailTransporter.sendMail({
          from: get(site, 'fromEmail', process.env.FROM_EMAIL),
          to: this.billingAddress.email,
          subject,
          html: body,
        })
      })

      // await renderEmail({site}, 'email_admin_new_order', this).then((html, subject) => {
      //   mailTransporter.sendMail({
      //     from: get(site, 'fromEmail', process.env.FROM_EMAIL),
      //     to: site.notificationEmail,
      //     subject,
      //     html,
      //   })
      // })
    })

  }

  async cancel() {
    await Promise.all(this.lines, line =>
      Product.findOneAndUpdate({_id: line.product}, {$inc: {stock: 1}})
    )
    this.set({status: 'canceled'})
    await this.save()
  }
}
orderSchema.loadClass(OrderClass)
const Order = mongoose.model('Order', orderSchema)
export default Order

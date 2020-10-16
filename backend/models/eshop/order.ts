import { DocumentType, pre, prop, Ref } from '@typegoose/typegoose'
import AsyncLock from 'async-lock'
import Promise from 'bluebird'
import { get, includes, isNil, mapValues, pickBy, some, sumBy } from 'lodash'
import { t } from '../../common/utils'
import * as deliveryMethods from '../../services/delivery'
import ManagedObject from '../managed_object'
import Site from '../site'
import Product from './product'

const lock = new AsyncLock({Promise})

class OrderLine {
  @prop({ref: Product})
	public product: Ref<Product>

	@prop()
	public name: string

	@prop()
	public image: string

	@prop()
	public count: number

	@prop()
	public price: number

	@prop()
	public discount: number

	@prop()
	public discounttype: string

	@prop()
	public tax: number

	@prop()
	public taxamount: number

	@prop()
	public subtotal: number

	@prop()
	public total: number
}

class Adddress {
  @prop()
  public country: string
  @prop()
  public city: string
  @prop()
  public postalCode: string
  @prop()
  public streetAddres: string
  @prop()
  public name: string
  @prop()
  public email: string
  @prop()
  public phone: string
}

@pre<Order>('save', async function() {
  if (this.number) {
    return
  }
  // const lastOrder = await this.site.Order.findOne().sort('-number').select('number')
  // this.number = get(lastOrder, 'number', 10000)
  // this.number++
})
export default class Order extends ManagedObject<Order> {
  @prop()
  public number: number

  @prop({_id: false, items: OrderLine})
  public lines: OrderLine[]

  @prop({_id: false})
  public billingAddress: Adddress

  @prop({_id: false})
  public shippingAddress: Adddress

  @prop()
  public status: string

  @prop()
  public paymentMethod: string

  @prop()
  public paymentStatus: string

  @prop()
  public subtotal: number

  @prop()
  public tax: number

  @prop()
  public deliveryMethod: string

  @prop()
  public deliveryCost: number

  @prop()
  public deliveryDiscount: number

  @prop()
  public total: number

  @prop()
  public taxTotal: number

  @prop()
  public processingFee: number

  @prop()
  public comments: string

  // TODO: convert
  // @prop({ref: Member})
  // public user: Ref<Member>

  async toContext(this: DocumentType<Order>, {site, locale}) {
    const object = this.toObject()
    return {
      ...object,
      id: object._id,
      deliveryMethodLabel: t(get(site.eshop.deliveryMethods, [object.deliveryMethod, 'label'], object.deliveryMethod), locale),
      availableDeliveryMethods: await this.availableDeliveryMethods.then(methods =>
        mapValues(methods, method => ({...method, label: t(method.label, locale)}))
      )
    }
  }

  async addItemsFromCart(this: DocumentType<Order>, cart) {
    const items: any[] = await cart.items
    const lines = await Promise.map(items, async item => {
      const {
        count,
        product: {priceWithoutTaxes, taxAmount, finalPrice, tax, productName, productImage}
      } = item
      const fieldsToCopy = get(cart.req.site.eshop, 'copyToOrder', [])
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

  async setDeliveryMethod(this: DocumentType<Order>, key, method) {
    const deliveryCost = deliveryMethods[method.policy](method, this)
    this.set({
      deliveryMethod: key,
      deliveryCost,
      total: this.subtotal + this.taxTotal + (this.processingFee || 0) + deliveryCost
    })
  }

  async setPaymentMethod(this: DocumentType<Order>, method) {
    const paymentMethod = this.site.eshop.paymentMethods[method]
    if (!paymentMethod) {
      throw new Error('Unsupported payment method')
    }
    const {processingFee = 0} = paymentMethod
    this.set({
      paymentMethod: method,
      processingFee,
      total: this.subtotal + this.taxTotal + (this.deliveryCost || 0) + processingFee
    })
  }

  finalize(this: DocumentType<Order>, completePayment) {
    const Product = this.site.Item('product')
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
      const site = (await Site.load(this.get('site'))).toObject()
      const afterCreateHookFile = get(site, 'eshop.afterCreateOrderHook')
      if (afterCreateHookFile) {
        const afterCreateHookFilePath = `../../../../data/${site.key}/modules/${afterCreateHookFile}`
        const afterCreateHook = require(afterCreateHookFilePath).default
        if (afterCreateHook) {
          await afterCreateHook(site, this)
        }
      }
      await this.save()
    })

  }

  async cancel(this: DocumentType<Order>, ) {
    const Product = this.site.Item('product')
    await Promise.map(this.lines, line => Product.findByIdAndUpdate(line.product, {$inc: {stock: 1}}))
    this.status = 'canceled'
    await this.save()
  }

  returnStock(this: DocumentType<Order>) {
    const Product = this.site.Item('product')
    return Promise.map(this.lines, line =>
      Product.findByIdAndUpdate(line.product, {$inc: {stock: line.count}})
    )
  }

  get availableDeliveryMethods() {
    const country = get(this.shippingAddress, 'country')
    return pickBy(this.site.eshop.deliveryMethods, method =>
      (!method.countries || includes(method.countries, country)) &&
      (!method.excludedCountries  || !includes(method.excludedCountries, country))
    )
  }

  async setDefaultDeliveryMethod(this: DocumentType<Order>) {
    const methods = await this.availableDeliveryMethods
    const method = Object.keys(pickBy(methods, 'default'))[0]
    if (method) {
      await this.setDeliveryMethod(method, methods[method])
    }
  }

  async setDefaultPaymentMethod(this: DocumentType<Order>) {
    const method = Object.keys(pickBy(this.site.eshop.paymentMethods, 'default'))[0]
    if (method) {
      await this.setPaymentMethod(method)
    }
  }
}



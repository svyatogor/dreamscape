import { Request } from 'express'
import { find, findIndex, get, isEmpty, isNil, map, reject, sumBy } from 'lodash'
import { Site } from '..'
import Product from './product'

export interface IPricingPolicy {
  bind(): Promise<void>
  price(product: Product): number
}

interface IPricingPolicyConstructor {
  new(req: Request): IPricingPolicy
}

class DefaultPricingPolicy implements IPricingPolicy {
  async bind() { }
  price(product: Product) {
    const discountedPrice = product.discountedPrice || 0
    return discountedPrice > 0 ? product.discountedPrice : product.price
  }
}

export default class {
  private req: Request
  private site: Site
  private _items: { count: number, product: string }[]
  public items: {count: number, product: Product}[]

  constructor(req: Request) {
    this.req = req
    this.site = (req as any).site //TODO: TS
    if (isNil(req.cookies.cart) || isEmpty(req.cookies.cart)) {
      this._items = []
    } else {
      this._items = JSON.parse(req.cookies.cart)
    }
  }

  add(product: string) {
    const idx = findIndex(this._items, {product})
    if (idx > -1) {
      this._items[idx].count++
    } else {
      this._items.push({product, count: 1})
    }
  }

  remove(product: string) {
    this._items = reject(this._items, {product})
  }

  inc(product: string, count: number) {
    const idx = findIndex(this._items, {product})
    if (idx >= 0) {
      this._items[idx].count += count
    }
  }

  async set(product: string, count: number) {
    const idx = findIndex(this._items, {product})
    if (idx >= 0) {
      this._items[idx].count = Math.min((await this.items)[idx].product.stock, count)
    }
  }

  get count() {
    return this._items.length;
  }

  async load() {
    const pricingPolicy = this.pricingPolicy
    const productIds = map(this._items, 'product')
    await pricingPolicy.bind()
    const objects = await this.site.Item<Product>('product').find({_id: {$in: productIds}})
    objects.forEach(o => o.pricingPolicy = pricingPolicy)
    this.items = map(this._items, i => ({
      ...i,
      product: find(objects, o => String(o._id) === i.product)
    }))
  }

  get total(): number {
    return sumBy(this.items, item => item.product.finalPrice * item.count)
  }

  serialize(): string {
    return JSON.stringify(this._items)
  }

  get pricingPolicy(): IPricingPolicy {
    const pricingPolicyName = get(this.req, 'site.eshop.discountPolicy')
    const siteKey = get(this.req, 'site.key')
    if (!pricingPolicyName) {
      return new DefaultPricingPolicy()
    }
    const pricingPolicyFile = `../../../data/${siteKey}/modules/${pricingPolicyName}`
    try {
      const PricingPolicy = require(pricingPolicyFile).default as IPricingPolicyConstructor
      if (PricingPolicy) {
        return new PricingPolicy(this.req)
      }
    } catch (e) {
      console.log(e)
    }
  }
}

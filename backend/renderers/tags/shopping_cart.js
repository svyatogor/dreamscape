import Promise from 'bluebird'
import {t} from '../../common/utils'
import Cart from '../../models/eshop/cart'
import Order from '../../models/eshop/order'

export class shopping_cart {
  constructor(renderContext) {
    this.tags = ['shopping_cart']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('checkout_form', 'payment', 'finally', 'endshopping_cart');
    let checkoutForm = null
    let finalBlock = null
    let paymentBlock = null

    if(parser.skipSymbol('checkout_form')) {
      parser.skip(lexer.TOKEN_BLOCK_END);
      checkoutForm = parser.parseUntilBlocks('payment', 'finally', 'endshopping_cart');
    }

    if(parser.skipSymbol('payment')) {
      parser.skip(lexer.TOKEN_BLOCK_END);
      paymentBlock = parser.parseUntilBlocks('finally', 'endshopping_cart');
    }

    if(parser.skipSymbol('finally')) {
      parser.skip(lexer.TOKEN_BLOCK_END);
      finalBlock = parser.parseUntilBlocks('endshopping_cart');
    }
    parser.advanceAfterBlockEnd();
    return new nodes.CallExtensionAsync(this, 'run', args, [body, checkoutForm, paymentBlock, finalBlock]);
  }

  async run({ctx}, body, checkoutForm, paymentBlock, finalBlock, callback) {
    if (ctx.inspect) {
      return callback(null, null)
    }

    const cart = new Cart(ctx.req)
    await cart.items

    const items = await Promise.map(cart.items, async item => {
      return {
        ...item,
        product: await item.product.toContext({locale: ctx.req.locale})
      }
    })
    ctx.cart = {
      total: cart.total,
      count: cart.count,
      items
    }

    if (ctx.page.params === 'checkout' && checkoutForm) {
      checkoutForm(callback)
      return
    }

    if (ctx.page.params === 'thankyou' && finalBlock) {
      finalBlock(callback)
      return
    }

    const urlMatch = ctx.page.params.match(/complete\/(.+)/)
    if (urlMatch && paymentBlock) {
      const orderId = urlMatch[1]
      ctx.order = await Order.findOne({site: ctx.site._id, _id: orderId}).then(order => order.toContext(ctx.req))
      paymentBlock(callback)
      return
    }

    body(callback)
  }
}
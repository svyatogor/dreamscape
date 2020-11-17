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
    ctx.cart = await cart.toContext()

    if (ctx.page.params === 'checkout' && checkoutForm) {
      checkoutForm(callback)
      return
    }

    const thankyouUrlMath = ctx.page.params.match(/thankyou\/(.+)/)
    if (thankyouUrlMath && finalBlock) {
      const orderId = thankyouUrlMath[1]
      ctx.order = await Order.findOne({site: ctx.site._id, _id: orderId}).then(order => order.toContext(ctx.req))
      finalBlock(callback)
      return
    }

    const completeUrlMatch = ctx.page.params.match(/complete\/(.+)/)
    if (completeUrlMatch && paymentBlock) {
      const orderId = completeUrlMatch[1]
      ctx.order = await Order.findOne({site: ctx.site._id, _id: orderId}).then(order => order.toContext(ctx.req))
      paymentBlock(callback)
      return
    }

    body(callback)
  }
}
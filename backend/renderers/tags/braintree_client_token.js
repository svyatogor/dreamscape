import braintree from 'braintree'

export class braintree_client_token {
  constructor(renderContext) {
    this.tags = ['braintree_client_token']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtensionAsync(this, 'run', args, [undefined]);
  }

  run({ctx, env: {site}}, argx, callback) {
    if (ctx.inspect) {
      return callback(null, null)
    }
    const {braintree: {merchantId, publicKey, privateKey, environment}} = site.eshop.paymentMethods
    const gateway = braintree.connect({
      environment: braintree.Environment[environment],
      merchantId,
      publicKey,
      privateKey
    })
    gateway.clientToken.generate({}, function (err, response) {
      if (err) callback(err)
      else callback(null, response.clientToken)
    })
  }
}
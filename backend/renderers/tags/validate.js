import {some} from 'lodash'

export class validate {
  constructor(renderContext) {
    this.tags = ['validate']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endvalidate');
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  run({ctx}, key, options, body, callback) {
    if (typeof options === 'function') {
      callback = body
      body = options
      options = {}
    }
    if (ctx.inspect) {
      return callback(null, null)
    }
    ctx.hasError = some(ctx.flash.validation, v => !!v[key])
    body(callback)
  }
}
import {t} from '../../common/utils'
import {StaticText} from '../../models'

export class snippet {
  constructor(renderContext) {
    this.tags = ['snippet']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    let body = parser.parseUntilBlocks('endsnippet');
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  run({ctx}, snippetName, options, body, callback) {
    if (typeof options === 'function') {
      callback = body
      body = options
      options = {type: 'string'}
    }
    if (ctx.inspect) {
      return callback(null, null)
    }

    const {StaticText} = ctx.site
    const props = {key: snippetName, global: true}
    return StaticText.findOne(props)
      .then(text => {
        if (text) {
          var localText = t(text.content, ctx.req.locale)
          if (text.type === 'text') {
            localText = localText.replace(/^\s+/mg, '').replace(/\r?\n/g, '<br />')
          }
          callback(null, localText)
          return localText
        } else {
          text = new StaticText({...props, content: {en: body()}, type: (options.type || 'text')})
          return text.save().catch(e => console.log(e)).then(() => {
            return callback(null, body())
          })
        }
      })
      .catch(err => callback(err, null))
  }
}
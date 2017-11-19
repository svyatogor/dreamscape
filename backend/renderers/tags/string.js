import {t} from '../../common/utils'
import {StaticText} from '../../models'

export class string {
  constructor(renderContext) {
    this.tags = ['string']
  }

  parse(parser, nodes, lexer) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtensionAsync(this, 'run', args);
  }

  run({ctx}, str, callback) {
    if (ctx.inspect) {
      return callback(null, null)
    }

    const props = {site: ctx.site._id, key: str, global: true}
    return StaticText.findOne(props)
      .then(text => {
        if (text) {
          const localText = t(text.content, ctx.req.locale)
          callback(null, localText)
          return localText
        } else {
          text = new StaticText({...props, content: {en: str}, type: 'string'})
          return text.save().catch(e => console.log(e)).then(() => {
            callback(null, str)
          })
        }
      })
      .catch(err => callback(err, null))
  }
}
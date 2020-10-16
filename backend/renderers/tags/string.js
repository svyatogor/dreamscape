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

  async run({ctx, env: {site: {StaticText}}}, str, callback) {
    if (ctx.inspect) {
      return callback(null, null)
    }

    const props = {key: str, global: true}
    const text = await StaticText.findOne(props)
    try {
      if (text) {
        const localText = t(text.content, ctx.req.locale)
        callback(null, localText)
        return localText
      } else {
        text = new StaticText({...props, content: {en: str}, type: 'string'})
        await text.save()
        callback(null, str)
      }
    } catch (err) {
      callback(err, null)
    }
  }
}
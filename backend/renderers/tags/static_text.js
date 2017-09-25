import nunjucks from 'nunjucks'
import StaticText from '../../models/static_text'
import {t} from '../../common/utils'

export class static_text {
  static async render(block, {req}) {
    const text = await StaticText.findById(block.ref)
    return new nunjucks.runtime.SafeString(t(text.content, req.locale))
  }
}
import StaticText from '../models/static_text'
import {t} from '../common/utils'
export default async function(block, {req}) {
  const text = await StaticText.findById(block.ref)
  return t(text.content, req.locale)
}
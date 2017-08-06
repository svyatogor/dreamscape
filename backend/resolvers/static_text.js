import {query, mutation} from './utils'
import {StaticText} from '../models'

export default class {
  @query
  static async staticText(context, {id}) {
    return await StaticText.findById(id)
  }

  @mutation
  static async saveStaticText(context, {input: {id, content, locale}}) {
    const text = await StaticText.findById(id)
    text.set(`content.${locale}`, content)
    await text.save()
    return text
  }

  static queries = {}
  static mutations = {}
}
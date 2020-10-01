import {query, mutation} from './utils'
import {StaticText} from '../models'

export default class {
  @query
  static async staticText({site}, {id}) {
    return await site.StaticText.findById(id)
  }

  @query
  static async snippets({site}) {
    return await site.StaticText.find({global: true})
  }

  @mutation
  static async saveStaticText({site}, {input: {id, content, locale, ...props}}) {
    let text
    const {StaticText} = site
    if (id) {
      text = await StaticText.findById(id)
      text.set(`content.${locale}`, content)
      text.set({...props, site: site.id})
    } else {
      text = new StaticText({...props, site: site.id})
      text.set(`content.${locale}`, content)
    }
    await text.save()
    return text
  }

  static queries = {}
  static mutations = {}
}
import mongoose from 'mongoose'
import {findIndex, find} from 'lodash'
import {query, mutation} from './utils'
import {StaticText} from '../models'

export default class {
  @query
  static async staticText(context, {id}) {
    return await StaticText.findById(id)
  }

  @mutation
  static async saveStaticText(context, {id, content}) {
    const text = await StaticText.findById(id)
    const string = find(text.content, {locale: content.locale})
    string.value = content.value
    await text.save()
    return text
  }

  static queries = {}
  static mutations = {}
}
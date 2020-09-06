import {find, isNil, isEmpty} from 'lodash'
import {FileList} from '../../models'
import fs from 'fs'

export class file_list {
  static async render(block, context) {
    const {req, page, env, site} = context
    const list = await FileList.findById(block.ref)
    let fileOptions = []
    const prefix = `./data/${site.key}/layouts/`
    if (!isNil(list.template) && !isEmpty(list.template)) {
      fileOptions = [
        `${page.layout}/${list.template}.html`,
        `common/${list.template}.html`,
      ]
    }
    fileOptions = [
      ...fileOptions,
      `${page.layout}/file_list.html`,
      `common/file_list.html`
    ]
    const template = find(fileOptions, tpl => fs.existsSync(prefix + tpl))
    if (!template) {
      return ''
    }

    return new Promise((resolve, reject) => {
      env.render(template, {...context, files: list.toContext(req).files}, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }
}
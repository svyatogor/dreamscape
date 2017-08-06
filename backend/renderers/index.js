import nunjucks from 'nunjucks'
import {get, zipObject, map} from 'lodash'
import langs from 'langs'
import * as tags from './tags'

const renderPage = ({req, res}, page, context) => {
  page.title = get(page.title, req.locale, page.title.en)
  const {site} = context
  try {
    context = {
      ...context,
      site: {
        ...site,
        assetsRoot: `${process.env.ASSETS_DOMAIN}/data/${site.key}/layouts`,
        localeName: langs.where('1', req.locale).name,
        supportedLanguages: zipObject(site.supportedLanguages,
          map(site.supportedLanguages, l => ({
            name: langs.where('1', l).local,
            locale: l,
          })))
      },
      page,
      req: {
        ...req,
        localeName: langs.where('1', req.locale).local,
      }
    }
    const env = nunjucks.configure(`./data/${site.key}/layouts`)
    env.addExtension('section', new tags.section())
    return new Promise((resolve, reject) => {
      env.render(`${page.layout}/index.html`, context, (err, result) => {
        if (err) {
          console.log(err)
          return reject(err)
        }
        res.send(result)
        resolve()
      })
    })
  } catch(e) {
    console.log(e)
    return Promise.reject(e)
  }
}

export {renderPage}
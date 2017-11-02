import nunjucks from 'nunjucks'
import {zipObject, map, reduce, forEach, isNil, isEmpty, isNaN} from 'lodash'
import langs from 'langs'
import Promise from 'bluebird'
import * as tags from './tags'

const renderPage = async ({req, res}, page, context) => {
  const {site} = context
  const locale = req.locale
  const breadcrumbs = await Promise.map(page.parents, p => p.toContext({locale, site}))

  reduce(
    breadcrumbs,
    (path, page) => {
      page.path = `${path}/${page.slug}`
      return page.path
    }, "")
  breadcrumbs[breadcrumbs.length-1].active = true
  try {
    context = {
      ...context,
      site: {
        ...site,
        assetsRoot: `${process.env.ASSETS_DOMAIN}/${site.key}/layouts`,
        uploadRoot: process.env.ASSETS_DOMAIN,
        localeName: langs.where('1', locale).name,
        supportedLanguages: zipObject(site.supportedLanguages,
          map(site.supportedLanguages, l => ({
            name: langs.where('1', l).local,
            locale: l,
          })))
      },
      page: {
        ...(await page.toContext({locale, site})),
        parents: page.parents,
      },
      breadcrumbs,
      req: {
        ...req,
        localeName: langs.where('1', req.locale).local,
      }
    }
    const env = nunjucks.configure(`./data/${site.key}/layouts`, {autoescape: false})
    forEach(tags, (tag, name) => {
      env.addExtension(name, new tag())
    })
    // TODO: Refactor me
    env.addFilter('currency', (str, currency, defaultValue = '-') => {
      if (isNil(currency) || isEmpty(currency)) {
        return defaultValue
      }
      const val = parseFloat(str).toLocaleString(locale, {style: 'currency', currency})
      return isNaN(val) ? defaultValue : val
    })
    return new Promise((resolve, reject) => {
      env.render(`${page.layout}/index.html`, {...context, env}, (err, result) => {
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

const renderEmail = async (req, template, context) => {
  const {site} = req
  try {
    context = {
      ...context,
      site: {
        ...site,
        assetsRoot: `${process.env.ASSETS_DOMAIN}/${site.key}/layouts`,
      },
      req
    }
    const env = nunjucks.configure(`./data/${site.key}/layouts`, {autoescape: false})
    return new Promise((resolve, reject) => {
      env.render(`${template}/index.html`, context, (err, result) => {
        if (err) {
          console.log(err)
          return reject(err)
        }
        return resolve(result)
      })
    })
  } catch(e) {
    console.log(e)
    return Promise.reject(e)
  }
}

export {renderPage, renderEmail}

import express from 'express'
import {Site, Page} from './models'
import {reduce, get, last, isEmpty, filter} from 'lodash'
import {renderPage} from './renderers'
const frontend = express.Router()

frontend.use(async (req, res, next) => {
  const site = await Site.findOne({
    domains: {$elemMatch: {$regex: new RegExp(req.hostname, 'i')}}
  })
  if (!site) {
    next('router')
  } else {
    req.site = site
    next()
  }
})

frontend.use('/data', express.static(__dirname + '/../data'))

frontend.use(async (req, res, next) => {
  const path = req.path.split('/')
  path.shift()
  if (req.site.supportedLanguages.includes(path[0])) {
    req.locale = path[0]
    path.shift()
  } else {
    req.locale = 'en'
  }

  const allPages = await Page.find({slug: {$in: path}}).populate('parent')

  const pages = reduce(path, (sum, slug, i) => {
    if (isEmpty(slug)) {
      return sum
    }
    const matches = filter(allPages, {slug})
    let page
    if (i === 0) {
      page = matches.filter(p => !p.parent || p.parent.slug === 'index' || p.parent.slug === '/')[0]
    } else {
      page = matches.filter(p => get(p.parent, 'slug') === path[i-1])[0]
    }
    return [...sum, page]
  }, [])
  if (pages.some(p => !p)) {
    next()
    return
  }
  const page = {
    ...last(pages).toObject(),
    path,
  }
  renderPage({req, res, page, site: req.site.toObject()})
    .then(() => res.end())
    .catch(() => res.sendStatus(500))
})

frontend.use((req, res) => {
  res.sendStatus(404)
})

export default frontend

import express from 'express'
import {Page} from './models'
import {reduce, get, last, isEmpty, filter, forEach} from 'lodash'
import {renderPage} from './renderers'
const frontend = express.Router()

frontend.use('/data', express.static(__dirname + '/../data'))

frontend.get('/*', (req, res, next) => {
  renderRequest(req.path, {req, res, next})
})

forEach(require('./middlewares'), middleware => frontend.use(middleware))

frontend.use((req, res) => {
  res.sendStatus(404)
})

export function renderRequest(requestPath, {req, res, next}, context = {}) {
  context = {
    ...context,
    site: req.site.toObject(),
  }
  resolvePath(requestPath, req).then(page => {
    renderPage({req, res}, page, context)
      .then(() => res.end())
      .catch(() => res.sendStatus(500))
  }).catch(e => {
    console.log(e)
    res.sendStatus(404)
  })
}

async function resolvePath(path, req) {
  path = path.split('/')
  path.shift()
  if (req.site.supportedLanguages.includes(path[0])) {
    req.locale = path[0]
    path.shift()
  } else {
    req.locale = 'en'
  }

  if (path.length === 0 || path[0] === '') {
    path = ['index']
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
    return Promise.reject()
  }
  return {
    ...last(pages).toObject(),
    path: `/${path}`,
  }
}

export default frontend

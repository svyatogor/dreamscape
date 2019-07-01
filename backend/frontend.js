import express from 'express'
import cookieParser from 'cookie-parser'
import flash from 'connect-flash'
import session from 'express-session'
import {Page} from './models'
import {map, findLastIndex, isNil, get, identity, find, forEach, reject, slice} from 'lodash'
import {renderPage} from './renderers'
const frontend = express.Router()
frontend.use(cookieParser())
frontend.use(flash())
frontend.use(session({secret: process.env.SESSION_SECRET, name: 'session_id', saveUninitialized: true, resave: true}));

frontend.use((req, res, next) => {
  req.flash('referrer', req.get('Referrer'))
  next()
})

frontend.use('/data', express.static(__dirname + '/../data'))
forEach(require('./middlewares'), middleware => frontend.use(middleware))

frontend.get('/*', (req, res, next) => {
  console.log('Render', req.path)
  renderRequest(req.path, {req, res, next})
})

frontend.use((req, res) => {
  res.sendStatus(404)
})

export function renderRequest(requestPath, {req, res, next}, context = {}) {
  context = {
    ...context,
    site: req.site,
  }
  resolvePath(requestPath, req).then(page => {
    if (!page) {
      res.sendStatus(404)
      return
    }
    return renderPage({req, res}, page, context)
      .then(() => res.end())
      .catch((e) => {
        console.log('Error', e);
        res.sendStatus(500)
      })
  }).catch(e => {
    console.log('Error', e);
    res.sendStatus(404)
  })
}

async function resolvePath(path, req) {
  path = path.replace(/\.html?$/, '').split('/')
  path.shift()
  if (req.site.supportedLanguages.includes(path[0])) {
    req.locale = path[0]
    path.shift()
  } else {
    req.locale = req.site.supportedLanguages[0]
  }

  if (path.length === 0 || path[0] === '') {
    path = ['index']
  }

  const allPages = (await Page.find({site: req.site.id, slug: {$in: path}}).populate('parent'))

  const pages = map(path, (slug, i) =>
    find(allPages, page =>
      page.slug === slug && (
        i === 0 ? !page.parent : get(page.parent, 'slug') === path[i-1]
      )
    )
  )

  const pageIdx = findLastIndex(pages, identity)
  const page = pages[pageIdx]
  if (!page) return null
  page.parents = reject(pages, isNil)
  page.path = path.join('/')
  page.params = slice(path, pageIdx + 1).join('/')
  return page
}

export {frontend as default, resolvePath}

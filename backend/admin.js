import express from 'express'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema, addResolveFunctionsToSchema} from 'graphql-tools'
import path from 'path'
import aws from 'aws-sdk'
import shortid from 'shortid'
import bodyParser from 'body-parser'
import {get, last, map} from 'lodash'
import cors from 'cors'
import {readFileSync} from 'fs'
import jwtExpress from 'express-jwt'
import jwt from 'jsonwebtoken'
import {Strategy as GoogleStrategy} from 'passport-google-oauth2'
import passport from 'passport'
import {User} from './models'
import resolvers from './resolvers'
import {Site} from './models'

const admin = express.Router()

admin.use(cors({origin: 'http://medinstitute.dreamscape.dev:4000', credentials: true}))

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://admin.dreamscape.dev:3000/auth/google/callback",
    passReqToCallback: true
  },
  (request, accessToken, refreshToken, profile, done) => {
    User.findOne({email: profile.email}).then(user => {
      const opts = {
        name: profile.displayName,
        email: profile.email,
        avatar: profile.photos ? profile.photos[0].value : null
      }
      if (user) {
        user.set(opts)
      } else {
        user = new User(opts)
      }
      user.save().then((_user) => {
        done(null, _user.toObject())
      }).catch((err) => done(err, null))
    }).catch((err) => done(err, null))
  }
))

admin.get('/auth/google/callback',
	passport.authenticate( 'google', {session: false}), (req, res) => {
  res.cookie('authtoken', jwt.sign(req.user, process.env.JWT_SECRET), {
    domain: `.${process.env.BACKEND_DOMAIN}`,
    httpOnly: true,
    path: '/',
    expires: new Date(Date.now() + 365 * 24 * 3600 * 1000)
  })
  res.redirect(req.cookies.redirect)
})

if (process.env.NODE_ENV === 'development') {
  admin.get('/auth/as/:email', (req, res) => {
    const user = {
      email: req.params.email,
      name: req.params.email
    }
    res.cookie('authtoken', jwt.sign(user, process.env.JWT_SECRET), {
      domain: `.${process.env.BACKEND_DOMAIN}`,
      httpOnly: true,
      path: '/',
      expires: new Date(Date.now() + 365 * 24 * 3600 * 1000)
    })
    res.send(`Ok, you are now ${user.email}`)
  })
}

const typeDefs = readFileSync('./backend/schema.gql').toString()
const schema = makeExecutableSchema({typeDefs, resolvers})
addResolveFunctionsToSchema(schema, {});

admin.use(async (req, res, next) => {
  const regex = new RegExp(`(.*).${process.env.BACKEND_DOMAIN}`, 'i')
  if (!regex.test(req.hostname)) {
    next('router')
  } else {
    const match = req.hostname.match(regex)
    const site = await Site.findOne({key: match[1].toLowerCase()})
    if (site) {
      req.site = site
      next()
    } else {
      next('router')
    }
  }
})

admin.use(passport.initialize())

admin.get('/auth/google', (req, res, next) => {
  res.cookie('redirect', req.get('Referrer'), {domain: `.${process.env.BACKEND_DOMAIN}`})
  next()
},
passport.authenticate('google', { scope:
  [ 'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read' ], session: false }
))

admin.use(jwtExpress({
  secret: process.env.JWT_SECRET,
  credentialsRequired: false,
  getToken: req => req.cookies.authtoken,
}).unless({path: [
  '/auth/google'
]}), (req, res, next) => {
  if (!req.user) {
    res.sendStatus(401)
  } else {
    next()
  }
})

admin.get('/session', (req, res) => {
  res.json(req.user)
})

admin.use('/graphql', bodyParser.json(), graphqlExpress(req => ({
  schema,
  rootValue: req,
  formatError: error => {
    let originalErrors = get(error, 'originalError.errors')
    let errors = {}
    if (originalErrors) {
      Object.keys(originalErrors).forEach(field => {
        errors[field] = originalErrors[field].message
      })
    }
    return {
      message: error.message,
      errors,
    }
  },
})))

admin.use('/logout', (req, res) => {
  res.clearCookie('authtoken')
  res.sendStatus(200)
})

admin.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}))

admin.get('/sign-s3', async (req, res) => {
  const s3 = new aws.S3({region: 'eu-west-1'})
  const ext = last(req.query.name.split('.'))
  const fileName = `${req.site.key}/images/${shortid.generate()}.${ext}`
  const fileType = req.query.type
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read',
  }
  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err)
      return res.end()
    }
    res.write(data)
    res.end()
  });
})

admin.get('/images', async (req, res) => {
  const {type, id} = req.query
  const klass = require('./models')[type]
  const object = await klass.findById(id)
  res.json(map(object.images, url => ({
    thumb: url,
    url,
    id: url,
  })))
})

if (process.env.NODE_ENV === 'production') {
  admin.use(express.static(path.resolve(__dirname, '../build-admin')))
  admin.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build-admin/index.html'))
  })
}

export default admin

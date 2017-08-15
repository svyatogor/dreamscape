import express from 'express'
import {get, find} from 'lodash'
import cors from 'cors'
import jwtExpress from 'express-jwt'
import jwt from 'jsonwebtoken'
import {Strategy as GoogleStrategy} from 'passport-google-oauth2'
import {Strategy as WindowsLiveStrategy} from 'passport-windowslive'
import passport from 'passport'
import {User} from './models'

const auth = express()

const findOrCreateFromProfile = (profile, done) => {
  User.findOne({email: profile.email}).then(user => {
    const opts = {
      name: profile.displayName,
      email: profile.email || get(profile, 'emails.preferred'),
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

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `https://api.${process.env.ROOT_DOMAIN}/auth/google/callback`,
    passReqToCallback: true
  },
  (request, accessToken, refreshToken, profile, done) => {
    findOrCreateFromProfile(profile, done)
  }
))

passport.use(new WindowsLiveStrategy({
    clientID:     process.env.WINDOWS_CLIENT_ID,
    clientSecret: process.env.WINDOWS_CLIENT_SECRET,
    callbackURL: `https://api.${process.env.ROOT_DOMAIN}/auth/windowslive/callback`,
    passReqToCallback: true
  },
  (request, accessToken, refreshToken, data, done) => {
    const email = find(data.emails, {primary: true}) || data.emails[0]
    const profile = {
      displayName: data.displayName,
      email: email.value,
      photos: email.photos,
    }
    findOrCreateFromProfile(profile, done)
  }
))

auth.use(passport.initialize())

auth.get('/auth/google/callback',
	passport.authenticate( 'google', {session: false}), (req, res) => {
  res.cookie('authtoken', jwt.sign(req.user, process.env.JWT_SECRET), {
    domain: `.${process.env.ROOT_DOMAIN}`,
    httpOnly: true,
    path: '/',
    expires: new Date(Date.now() + 365 * 24 * 3600 * 1000)
  })
  res.redirect(req.cookies.redirect)
})

auth.get('/auth/windowslive/callback',
	passport.authenticate( 'windowslive', {session: false}), (req, res) => {
  res.cookie('authtoken', jwt.sign(req.user, process.env.JWT_SECRET), {
    domain: `.${process.env.ROOT_DOMAIN}`,
    httpOnly: true,
    path: '/',
    expires: new Date(Date.now() + 365 * 24 * 3600 * 1000)
  })
  res.redirect(req.cookies.redirect)
})

if (process.env.NODE_ENV === 'development') {
  auth.get('/auth/as/:email', (req, res) => {
    const user = {
      email: req.params.email,
      name: req.params.email
    }
    res.cookie('authtoken', jwt.sign(user, process.env.JWT_SECRET), {
      domain: `.${process.env.ROOT_DOMAIN}`,
      httpOnly: true,
      path: '/',
      expires: new Date(Date.now() + 365 * 24 * 3600 * 1000)
    })
    res.send(`Ok, you are now ${user.email}`)
  })
}

auth.get('/auth/google',
  (req, res, next) => {
    res.cookie('redirect', req.get('Referrer'), {domain: `.${process.env.ROOT_DOMAIN}`})
    next()
  },
  passport.authenticate('google', {scope:
    ['https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'], session: false}
  )
  )

auth.get('/auth/windowslive',
  (req, res, next) => {
    res.cookie('redirect', req.get('Referrer'), {domain: `.${process.env.ROOT_DOMAIN}`})
    next()
  },
  passport.authenticate('windowslive', { scope: ['wl.signin', 'wl.basic', 'wl.contacts_emails'], session: false})
)

const requireUser = [
  jwtExpress({
    secret: process.env.JWT_SECRET,
    credentialsRequired: false,
    getToken: req => req.cookies.authtoken,
  }).unless({path: ['/auth/google']}),
  (req, res, next) => {
    if (!req.user) {
      res.sendStatus(401)
    } else {
      next()
    }
  }
]

auth.get('/admin/api/session', requireUser, (req, res) => {
  res.json(req.user)
})

auth.use('/admin/api/logout', requireUser, (req, res) => {
  res.clearCookie('authtoken', {
    domain: `.${process.env.ROOT_DOMAIN}`,
    httpOnly: true,
    path: '/',
  })
  res.sendStatus(200)
})


export {auth as default, requireUser}

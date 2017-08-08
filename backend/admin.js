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
import basicAuth from 'express-basic-auth'
import resolvers from './resolvers'
import {Site} from './models'

const admin = express.Router()

admin.use(cors())

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

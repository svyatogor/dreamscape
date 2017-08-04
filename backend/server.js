import express from 'express'
import {
  graphqlExpress,
  graphiqlExpress,
} from 'graphql-server-express';
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import {get, last, map} from 'lodash'
import {
	makeExecutableSchema,
	addResolveFunctionsToSchema,
} from 'graphql-tools'
import {readFileSync} from 'fs'
import path from 'path'
import aws from 'aws-sdk'
import shortid from 'shortid'
import resolvers from './resolvers'
import './models'
mongoose.Promise = require('bluebird')
mongoose.connect(process.env.MONGODB_URI, {useMongoClient: true})

const app = express()


const resolverMap = {
	Block: {
    __resolveType: ({_type}) => _type
  },
}
const typeDefs = readFileSync('./backend/schema.gql').toString()
const schema = makeExecutableSchema({typeDefs, resolvers})
addResolveFunctionsToSchema(schema, resolverMap);

export default () => {
	app.use(cors())

	app.use('/graphql', bodyParser.json(), graphqlExpress({
		schema,
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
	}))

	app.use('/graphiql', graphiqlExpress({
		endpointURL: '/graphql',
	}))

	app.get('/sign-s3', async (req, res) => {
		const s3 = new aws.S3({region: 'eu-west-1'})
		const ext = last(req.query.name.split('.'))
		const fileName = 'demo' + '/' + shortid.generate() + '.' + ext
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

	app.get('/images', async (req, res) => {
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
		// Serve static assets
		app.use(express.static(path.resolve(__dirname, '..', 'build-admin')))

		// Always return the main index.html, so react-router render the route in the client
		app.get('*', (req, res) => {
			res.sendFile(path.resolve(__dirname, '..', 'build-admin', 'index.html'))
		})
	}

	app.listen(process.env.PORT || 3000)
}

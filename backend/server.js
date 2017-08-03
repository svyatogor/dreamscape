import express from 'express'
import {
  graphqlExpress,
  graphiqlExpress,
} from 'graphql-server-express';
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import {get, map} from 'lodash'
import {
	makeExecutableSchema,
	addResolveFunctionsToSchema,
} from 'graphql-tools'
import {readFileSync} from 'fs'
import path from 'path'
import multer from 'multer'
import cloudinaryStorage from 'multer-storage-cloudinary'
import cloudinary from 'cloudinary'
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


	const storage = cloudinaryStorage({
		cloudinary,
		folder: 'demo',
	})
	app.post('/upload-image', multer({storage}).single('file'), async (req, res) => {
		const {_type, id} = req.query
		const Model = require('./models')[_type]
		const object = await Model.findById(id)
		console.log(object.attach);
		if (object.attach) {
			await object.attach(req.file)
		}
		res.json({url: req.file.url, id: req.file.public_id})
	})

	app.get('/images', async (req, res) => {
		const {_type, id} = req.query
		const Model = require('./models')[_type]
		const object = await Model.findById(id)
		res.json(map(object.images, image => (
			{thumb: image.url, url: image.url, id: image.public_id}
		)))
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

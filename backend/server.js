import express from 'express'
import {
  graphqlExpress,
  graphiqlExpress,
} from 'graphql-server-express';
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import {get} from 'lodash'
import {
	makeExecutableSchema,
	addResolveFunctionsToSchema,
} from 'graphql-tools'
import {readFileSync} from 'fs'
import path from 'path'
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
	}));

	app.use('/graphiql', graphiqlExpress({
		endpointURL: '/graphql',
	}));

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

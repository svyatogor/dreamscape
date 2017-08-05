import express from 'express'
import mongoose from 'mongoose'
import admin from './admin'
import frontend from './frontend'

import './models'
mongoose.Promise = require('bluebird')
mongoose.connect(process.env.MONGODB_URI, {useMongoClient: true})

const app = express()

export default () => {
	app.use('/', admin)
	app.use('/', frontend)
	app.get('/', (req, res) => {
		res.send('w00t?')
		res.end()
	})
	app.listen(process.env.PORT || process.env.BACKEND_PORT)
}

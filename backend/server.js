import express from 'express'
import mongoose from 'mongoose'
import s3 from 's3'
import {Site} from './models'
import admin from './admin'
import frontend from './frontend'

import './models'
mongoose.Promise = require('bluebird')
mongoose.connect(process.env.MONGODB_URI, {useMongoClient: true})

const app = express()

const syncS3 = () => {
	const client = s3.createClient({
		s3Options: {
			// accessKeyId: "your s3 key",
			// secretAccessKey: "your s3 secret",
			region: 'eu-west-1'
		},
	})

	Site.find().then(sites => {
		sites.forEach(site => {
			console.log(`Syncing layout for ${site.key}`)
			const downloader = client.downloadDir({
				localDir: `./data/${site.key}/layouts`,
				s3Params: {
					Bucket: process.env.S3_BUCKET,
					Prefix: `${site.key}/layouts`
				}
			})
			downloader.on('error', err => {
				console.error(`Error syncing layout for ${site.key}`, err)
			})
			downloader.on('end', () => {
				console.log(`Finished syncing layout for ${site.key}`)
			})
		})
	})
}

export default () => {
	app.use('/', admin)
	app.use('/', frontend)
	app.get('/', (req, res) => {
		res.send('w00t?')
		res.end()
	})

	syncS3()
	app.listen(process.env.PORT || process.env.BACKEND_PORT)
}

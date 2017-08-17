import express from 'express'
import mongoose from 'mongoose'
import cachegoose from 'cachegoose'
import s3 from 's3'
import {Site} from './models'
import auth from './auth'
import admin from './admin'
import frontend from './frontend'

import './models'
mongoose.Promise = require('bluebird')
mongoose.connect(process.env.MONGODB_URI, {useMongoClient: true})
mongoose.set('debug', true)
cachegoose(mongoose)

const app = express()
app.use(require('cookie-parser')())
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
				// TODO: Report error
				console.error(`Error syncing layout for ${site.key}`, err)
			})
			downloader.on('end', () => {
				console.log(`Finished syncing layout for ${site.key}`)
			})
		})
	})
}

export default () => {
	app.use(auth)
	app.use(async (req, res, next) => {
		const regex = new RegExp(`(.*).${process.env.ROOT_DOMAIN}`, 'i')
		const match = req.hostname.match(regex)
		if (match) {
			req.site = await Site.findOne({key: match[1].toLowerCase()}).cache(1)
		} else {
			req.site = await Site.findOne({
    		domains: {$elemMatch: {$regex: new RegExp(req.hostname, 'i')}}
  		}).cache(1)
		}

		if (req.site) {
			next()
		} else {
			res.sendStatus(404)
		}
	})

	app.use('/admin', admin)
	app.use('/', frontend)
	app.get('/', (req, res) => {
		res.send('w00t?')
		res.status(404)
		res.end()
	})

	if (process.env.NODE_ENV === 'production') {
		syncS3()
	}
	app.listen(process.env.PORT || process.env.BACKEND_PORT)
}

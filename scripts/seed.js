import mongoose from 'mongoose'
import seeder from 'mongoose-seeder'
import {readFileSync} from 'fs'
import '../config/env'
import '../backend/models'

const data = JSON.parse(readFileSync('./seed-data.json'))
mongoose.Promise = require('bluebird')
mongoose.connect(process.env.MONGODB_URI, {useMongoClient: true}).then(() => {
  seeder.seed(data, {dropCollections: true}).then(function(dbData) {
      console.log('Seed completed');
  }).catch(function(err) {
      console.log(err)
  })
})

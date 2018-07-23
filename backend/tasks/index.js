require('babel-register')
require('../../config/env')
require('../models')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
mongoose.connect(process.env.MONGODB_URI)
mongoose.set('debug', process.env.NODE_ENV === 'development')

const task = require(`./${process.argv[2]}`).default
task().then(_ => process.exit(0))
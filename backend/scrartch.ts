process.env.ROOT_DB = 'dreamscape'
import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost/dreamscape')

import Site from './models/site'

(async function f() {
  const site = await Site.findOne({
    key: 'arbat'
  })

  console.log('2', site.layouts);
})()
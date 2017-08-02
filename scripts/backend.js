require('../config/env')
if (process.env.NODE_ENV === 'production') {
  require('babel-register')
}
const server = require('../backend/server').default
server()
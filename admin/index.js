import React from 'react'
import ReactDOM from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css'
// import "jquery"
import 'bootstrap/dist/js/bootstrap.js'
import 'propellerkit/dist/css/propeller.css'
import 'propellerkit/dist/js/propeller.js'
import 'mdi/css/materialdesignicons.css'
import './index.css'
import App from './App'
// import registerServiceWorker from './registerServiceWorker'
import injectTapEventPlugin from 'react-tap-event-plugin'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import * as colors from 'material-ui/styles/colors'

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: '#4285f4',
    accent1Color: '#d23f31',
    // accent1Color: colors.blue500,
    // textColor: colors.cyan500,
  },
})

injectTapEventPlugin()

ReactDOM.render((<MuiThemeProvider muiTheme={muiTheme}><App /></MuiThemeProvider>),
  global.document.getElementById('root'))
// registerServiceWorker()

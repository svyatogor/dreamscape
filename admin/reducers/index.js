import {combineReducers} from 'redux'
import {reducer as formReducer} from 'redux-form'
import {routerReducer} from 'react-router-redux'
import session from './session'
import app from './app'
import site from './site'

const reducers = client => combineReducers({
  session,
  site,
  app,
  form: formReducer,
  routing: routerReducer,
  apollo: client.reducer(),
})

export default reducers

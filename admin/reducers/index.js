import {combineReducers} from 'redux'
import {reducer as formReducer} from 'redux-form'
import {routerReducer} from 'react-router-redux'
import session from './session'
import site from './site'
import page from './page'

const reducers = combineReducers({
  session,
  site,
  page,
  form: formReducer,
  routing: routerReducer,
})

export default reducers

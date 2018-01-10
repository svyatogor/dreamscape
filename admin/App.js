import React from 'react'
import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import createHistory from 'history/createBrowserHistory'
import {routerMiddleware} from 'react-router-redux'
import {ApolloProvider, ApolloClient, createNetworkInterface} from 'react-apollo'
import {persistStore, autoRehydrate} from 'redux-persist'
import reducers from './reducers'
import AppContainer from './AppContainer'

const networkInterface = createNetworkInterface({
  uri: `/admin/api/graphql`,
  opts: {
    credentials: 'include',
  },
})
const client = new ApolloClient({
  networkInterface: networkInterface
})
const history = createHistory({basename: '/admin/'})
const middleware = routerMiddleware(history)
let persistor
const storePurger = store => next => action => {
  if (persistor && action.type === 'LOGOUT') {
    persistor.purge()
  }
  return next(action)
}
const store = createStore(
  reducers(client),
  {},
  compose(
    applyMiddleware(client.middleware(), thunk, middleware, storePurger),
    autoRehydrate(),
    (typeof window.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined') ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f,
  )
)
persistor = persistStore(store, {whitelist: ['app',]})


networkInterface.useAfter([{
  applyAfterware({response}, next) {
    if (response.status === 401) {
      store.dispatch({type: 'LOGOUT'})
    }
    next()
  }
}])

export default () =>
  <ApolloProvider client={client} store={store}>
    <AppContainer history={history} />
  </ApolloProvider>

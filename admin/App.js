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
  uri: `${process.env.REACT_APP_BACKEND}/graphql`,
  opts: {
    credentials: 'include',
  },
})
const client = new ApolloClient({
  networkInterface: networkInterface
})
const history = createHistory({basename: '/admin/'})
const middleware = routerMiddleware(history)
const store = createStore(
  reducers(client),
  {},
  compose(
    applyMiddleware(client.middleware(), thunk, middleware),
    autoRehydrate(),
    (typeof window.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined') ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f,
  )
)
persistStore(store, {whitelist: ['app',]})

export default () =>
  <ApolloProvider client={client} store={store}>
    <AppContainer history={history} />
  </ApolloProvider>

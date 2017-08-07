import React, {Component} from 'react'
import {
  Route,
  NavLink,
} from 'react-router-dom'
import {Drawer, MenuItem, Divider} from 'material-ui'
import {createStore, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'
import createHistory from 'history/createBrowserHistory'
import {ConnectedRouter, routerMiddleware} from 'react-router-redux'
import {ApolloProvider, ApolloClient, createNetworkInterface} from 'react-apollo'
import {persistStore, autoRehydrate} from 'redux-persist'
import Notification from './components/notification'
import reducers from './reducers'
import styles from './App.scss'
import Header from './components/header'
import Logo from './assets/logo_blue_2x.png'
import Welcome from './components/welcome'
import SiteEditor from './components/site_editor'
import SnippetsEditor from './components/snippets_editor'

if (!process.env.REACT_APP_BACKEND) {
  process.env.REACT_APP_BACKEND = ''
}
const networkInterface = createNetworkInterface({
  uri: `${process.env.REACT_APP_BACKEND}/graphql`
})
const client = new ApolloClient({
  networkInterface: networkInterface
})
const history = createHistory()
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
persistStore(store, {whitelist: ['app', 'session']})

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
    }
  }

  render() {
    return (
      <ApolloProvider client={client} store={store}>
        <ConnectedRouter history={history}>
          <div className={styles.appContainer}>
            <Header onMenu={() => this.setState({open: true})} />
            <Drawer
              open={this.state.open} docked={false} width={300}
              onRequestChange={(open) => this.setState({open})}
            >
              <img src={Logo} alt="" style={{margin: 20, marginBottom: 40, width: '50%'}} />
              <NavLink to="/site">
                <MenuItem leftIcon={<div className="menuIcon"><i className="mdi mdi-sitemap" /></div>}>Site</MenuItem>
              </NavLink>
              <NavLink to="/snippets">
                <MenuItem leftIcon={<div className="menuIcon"><i className="mdi mdi-code-braces" /></div>}>Snippets</MenuItem>
              </NavLink>
              <MenuItem leftIcon={<div className="menuIcon"><i className="material-icons">view_list</i></div>}>Catalog</MenuItem>
              <MenuItem leftIcon={<div className="menuIcon"><i className="material-icons">photo_library</i></div>}>Assets</MenuItem>
              <Divider />

              <footer className="copyright">&copy; 2014-2017 Dreamscape CMS</footer>
            </Drawer>

            <section className={styles.appBody}>
              <Route exact path="/" component={Welcome} />
              <Route path="/site" component={SiteEditor} />
              <Route path="/snippets" component={SnippetsEditor} />
            </section>
            <Notification />
          </div>
        </ConnectedRouter>
      </ApolloProvider>
    )
  }
}

export default App

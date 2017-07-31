import React, {Component} from 'react'
import {
  Route,
  NavLink,
} from 'react-router-dom'
import {Drawer, MenuItem, Divider} from 'material-ui'
import {createStore, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import createHistory from 'history/createBrowserHistory'
import {ConnectedRouter, routerMiddleware} from 'react-router-redux'
import {ApolloProvider, ApolloClient, createNetworkInterface} from 'react-apollo'
import reducers from './reducers'
import styles from './App.scss'
import Header from './components/header'
import Logo from './assets/logo-c.png'
import Welcome from './components/welcome'
import SiteEditor from './components/site_editor'


const history = createHistory()
const middleware = routerMiddleware(history)
const store = createStore(reducers, applyMiddleware(thunk, middleware))

const networkInterface = createNetworkInterface({
  uri: 'http://localhost:3000/graphql'
})
const client = new ApolloClient({
  networkInterface: networkInterface
})

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
              <img src={Logo} alt="" style={{margin: 20, marginBottom: 40}} />
              <NavLink to="/site">
                <MenuItem leftIcon={<div className="menuIcon"><i className="mdi mdi-sitemap" /></div>}>Site</MenuItem>
              </NavLink>
              <MenuItem leftIcon={<div className="menuIcon"><i className="material-icons">view_list</i></div>}>Catalog</MenuItem>
              <MenuItem leftIcon={<div className="menuIcon"><i className="material-icons">photo_library</i></div>}>Assets</MenuItem>
              <Divider />

              <footer className="copyright">&copy; 2014-2017 Dreamscape CMS</footer>
            </Drawer>

            <section className={styles.appBody}>
              <Route exact path="/" component={Welcome} />
              <Route path="/site" component={SiteEditor} />
            </section>
          </div>
        </ConnectedRouter>
      </ApolloProvider>
    )
  }
}

export default App

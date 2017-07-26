import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  NavLink
} from 'react-router-dom'
import { createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunk from 'redux-thunk'
import reducers from './reducers'
import styles from './App.scss';
import Header from './components/header'
import Welcome from './components/welcome'
import SiteEditor from './components/site_editor'


let store = createStore(reducers, applyMiddleware(thunk))
window.store = store
class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Router>
          <div className={styles.container}>
            <nav className={styles.mainNav}>
              <header></header>
              <NavLink to="/site">
                <i className="mdi mdi-sitemap"></i>
                Structure
              </NavLink>
              <a href="/">
                <i className="material-icons">view_list</i>
                Catalog
              </a>
              <a href="/">Assets</a>
              <a href="/">Blocks</a>
              <a href="/">Articles</a>
            </nav>

            <section className={styles.main}>
              <Header />
              <Route exact path="/" component={Welcome} />
              <Route path="/site" component={SiteEditor} />
              <footer>&copy; 2014-2017 Dreamscape CMS</footer>
            </section>
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;

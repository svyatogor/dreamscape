import React from 'react'
import {Drawer, MenuItem, Divider, CircularProgress} from 'material-ui'
import {Route, NavLink} from 'react-router-dom'
import {connect} from 'react-redux'
import {ConnectedRouter} from 'react-router-redux'
import {graphql} from 'react-apollo'
import {get, includes} from 'lodash'
import {pluralize, humanize} from 'inflection'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {loader} from 'graphql.macro'
import {getSession} from './actions'
import Notification from './components/notification'
import styles from './App.module.scss'
import Header from './components/header'
import Logo from './assets/logo_blue_2x.png'
import Welcome from './components/welcome'
import SiteEditor from './components/site_editor'
import SnippetsEditor from './components/snippets_editor'
import OrdersManager from './components/eshop/orders_manager'
import Catalog from './components/catalog'
import Login from './components/login'

const siteQuery = loader('./graphql/site.gql')

class MainContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false
    }
  }

  getChildContext() {
    return {site: this.props.data.site}
  }

  render() {
    const {history, data: {site}} = this.props
    const documentTypes = _(get(site, 'documentTypes', {})).pickBy(type => !type.hidden)
    return (<ConnectedRouter history={history}>
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
          {documentTypes.map((docType, key) =>
            <NavLink to={`/catalog/${key}`} key={key}>
              <MenuItem
                leftIcon={<div className="menuIcon"><i className={`mdi mdi-${docType.icon}`} /></div>}
              >
                {humanize(pluralize(key))}
              </MenuItem>
            </NavLink>
          ).value()}
          {includes(get(site, 'features'), 'members') && (
            <NavLink to="/members">
              <MenuItem
                leftIcon={<div className="menuIcon"><i className="mdi mdi-account" /></div>}
              >
                Members
              </MenuItem>
            </NavLink>
          )}
          {includes(get(site, 'features'), 'eShop') && (
            <NavLink to="/orders">
              <MenuItem
                leftIcon={<div className="menuIcon"><i className="mdi mdi-cart" /></div>}
              >
                Orders
              </MenuItem>
            </NavLink>
          )}
          <Divider />
          <NavLink to="/snippets">
            <MenuItem leftIcon={<div className="menuIcon"><i className="mdi mdi-code-braces" /></div>}>Snippets</MenuItem>
          </NavLink>
          <NavLink to="/settings">
            <MenuItem leftIcon={<div className="menuIcon"><i className="mdi mdi-settings" /></div>}>Settings</MenuItem>
          </NavLink>

          <footer className="copyright">&copy; 2014-2017 Dreamscape CMS</footer>
        </Drawer>
        <section className={styles.appBody}>
          <Route exact path="/" component={Welcome} />
          <Route path="/site" component={SiteEditor} />
          <Route path="/orders" component={OrdersManager} />
          <Route path="/snippets" component={SnippetsEditor} />
          <Route path="/catalog/:catalogKey" component={Catalog} />
        </section>
        <Notification />
      </div>
    </ConnectedRouter>)
  }
}

MainContainer.childContextTypes = {
  site: PropTypes.object,
}
const ConnectedMainContainer = graphql(siteQuery)(MainContainer)


class AppContainer extends React.Component {
  componentWillMount() {
    this.props.getSession()
  }

  render() {
    const {session} = this.props
    if (session.authenticated === false) {
      return <Login />
    } else if (session.authenticated === true) {
      return <ConnectedMainContainer {...this.props} />
    } else {
      return (<div className={styles.appContainer}>
        <div style={{height: '100%', display: 'flex', flexDirection: 'column',  justifyContent: 'center', alignItems: 'center'}}>
          <CircularProgress size={80} thickness={5} style={{marginBottom: 20}} />
          Loggin in...
        </div>
      </div>)
    }
  }
}

export default connect(state => ({session: state.session}), {getSession})(DragDropContext(HTML5Backend)(AppContainer))

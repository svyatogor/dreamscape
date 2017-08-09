import React from 'react'
import {Drawer, MenuItem, Divider, CircularProgress} from 'material-ui'
import {Route, NavLink} from 'react-router-dom'
import {connect} from 'react-redux'
import {getSession} from './actions'
import Notification from './components/notification'
import styles from './App.scss'
import Header from './components/header'
import Logo from './assets/logo_blue_2x.png'
import Welcome from './components/welcome'
import SiteEditor from './components/site_editor'
import SnippetsEditor from './components/snippets_editor'
import Login from './components/login'

class MainContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false
    }
  }

  render() {
    return (<div className={styles.appContainer}>
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
    </div>)
  }
}



class AppContainer extends React.Component {
  componentWillMount() {
    this.props.getSession()
  }

  render() {
    const {session} = this.props
    if (session.authenticated === false) {
      return <Login />
    } else if (session.authenticated === true) {
      return <MainContainer />
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

export default connect(state => ({session: state.session}), {getSession})(AppContainer)

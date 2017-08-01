import React from 'react'
import {connect} from 'react-redux'
import {logout} from '../actions'
import Logo from '../assets/logo.png'
import {AppBar, IconButton} from 'material-ui'
import styles from './header.scss'

const Title = ({title}) =>
  <div style={{display: 'flex', width: '100%'}}>
    <div style={{flex: 3, minWidth: 300}}>
      <img src={Logo} alt="" />
    </div>
    <div style={{flex: 15, color: '#ddd', fontWeight: 300}}>
      {title}
    </div>
    <div style={{flex: '1 4 5%', minWidth: 100}}></div>
    <div style={{position: 'fixed', bottom: 20, right: 20}}>
    </div>
  </div>

const Header = ({session, logout, onMenu, title}) =>
  (<AppBar
    title={<Title title={title} />}
    onLeftIconButtonTouchTap={onMenu}
    iconElementRight={(
      <div className={styles.whoami}>
        <IconButton style={{color: 'white'}}><i className="material-icons">exit_to_app</i></IconButton>
      </div>
    )}
  />)

const mapStateToProps = ({session, app: {title}}, ownProps) => {
  return {session, title}
}
export default connect(mapStateToProps, {logout})(Header)

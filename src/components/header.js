import React from 'react'
import {connect} from 'react-redux'
import {logout} from '../actions'
import Logo from '../assets/logo.png'
import {AppBar, IconButton} from 'material-ui'
import styles from './header.scss'

const Header = ({session, logout, onMenu}) =>
  (<AppBar
    title={<img src={Logo} alt="" />}
    onLeftIconButtonTouchTap={onMenu}
    iconElementRight={(
      <div className={styles.whoami}>
        <IconButton style={{color: 'white'}}><i className="material-icons">exit_to_app</i></IconButton>
      </div>
    )}
  />)

const mapStateToProps = ({session}, ownProps) => {
  return {session}
}
export default connect(mapStateToProps, {logout})(Header)

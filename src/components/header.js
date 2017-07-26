import React from 'react';
import {connect} from 'react-redux'
import {logout} from '../actions'
import Logo from '../assets/logo.png'
import styles from './header.scss'

const Header = ({session, logout}) =>
  <header className={styles.container}>
    <div className={styles.toolbar}>
      <div className={styles.logo}>
        <a href="/admin">
          <img src={Logo} alt="" />
        </a>
      </div>
      <a href="/admin/page_editor?page_id=-1" className={styles.button}>
        <i className="material-icons">add</i> New page
      </a>
    </div>
    <div className={styles.whoami}>
      Logged in as: {session.fullName}
      <a href="#" role="button" onClick={() => logout()}><i className="material-icons">exit_to_app</i></a>
    </div>
  </header>

const mapStateToProps = ({session}, ownProps) => {
  return {session}
}
export default connect(mapStateToProps, {logout})(Header)

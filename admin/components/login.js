import React from 'react'
import FontAwesome from 'react-fontawesome'
import {Paper} from 'material-ui'
import appStyles from '../App.scss'
import styles from './login.scss'
import cx from 'classnames'
import Logo from '../assets/logo_blue_2x.png'

const Login = (props) =>
  <div className={appStyles.appContainer}>
    <div style={{height: '100%', display: 'flex', flexDirection: 'column',  justifyContent: 'center', alignItems: 'center'}}>
      <Paper style={{padding: '30px 40px', textAlign: 'center'}}>
        <img src={Logo} alt="" width="50%" style={{marginBottom: 30}} />
        <div className={cx([styles.button, styles.google])} onClick={() => {
          window.location = `${process.env.REACT_APP_BACKEND}/auth/google`
        }}>
          <FontAwesome name='google' /> Sign in with google
        </div>
        <div className={cx([styles.button, styles.windows])} onClick={() => {
          window.location = `${process.env.REACT_APP_BACKEND}/auth/windowslive`
        }}>
          <FontAwesome name='windows' /> Sign in with windows
        </div>
      </Paper>
    </div>
  </div>

export default Login
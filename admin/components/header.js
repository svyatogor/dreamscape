import React from 'react'
import {connect} from 'react-redux'
import {logout, setLocale} from '../actions'
import Logo from '../assets/logo.png'
import {AppBar, IconButton, SelectField, MenuItem} from 'material-ui'
import styles from './header.scss'
import {map} from 'lodash'

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

const Header = ({session, logout, onMenu, locale, setLocale}) =>
  (<AppBar
    title={<Title title="" />}
    onLeftIconButtonTouchTap={onMenu}
    iconElementRight={(
      <div className={styles.whoami}>
        <SelectField value={locale} className={styles.languagePicker} onChange={(e, key, value) => setLocale(value)}>
          {map(['en', 'ru'], l => <MenuItem value={l} key={l} primaryText={l} />)}
        </SelectField>
        <IconButton style={{color: 'white'}}><i className="material-icons">exit_to_app</i></IconButton>
      </div>
    )}
  />)

const mapStateToProps = ({session, app: {locale}}, ownProps) => {
  return {session, locale}
}
export default connect(mapStateToProps, {logout, setLocale})(Header)

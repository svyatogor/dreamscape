import React from 'react'
import {connect} from 'react-redux'
import {logout, setLocale} from '../actions'
import Logo from '../assets/logo_white_2x.png'
import {AppBar, IconMenu, SelectField, MenuItem, Avatar as MaterialAvatar} from 'material-ui'
import styles from './header.scss'
import {map} from 'lodash'

const Title = ({title}) =>
  <div style={{display: 'flex', width: '100%'}}>
    <div style={{flex: 3, minWidth: 300}}>
      <img src={Logo} alt="" width="50%" />
    </div>
    <div style={{flex: 15, color: '#ddd', fontWeight: 300}}>
      {title}
    </div>
    <div style={{flex: '1 4 5%', minWidth: 100}}></div>
    <div style={{position: 'fixed', bottom: 20, right: 20}}>
    </div>
  </div>

const Avatar = ({session}) => {
  if (session.avatar) {
    return <MaterialAvatar src={session.avatar} style={{position: 'relative', top: 5, cursor: 'pointer'}} />
  } else {
    return (<MaterialAvatar style={{position: 'relative', top: 5, cursor: 'pointer'}}>
      {session.name.slice(0,1).toUpperCase()}
    </MaterialAvatar>)
  }
}

const Header = ({session, logout, onMenu, locale, setLocale}) =>
  (<AppBar
    title={<Title title="" />}
    onLeftIconButtonTouchTap={onMenu}
    iconElementRight={(
      <div className={styles.whoami}>
        <SelectField value={locale} className={styles.languagePicker} onChange={(e, key, value) => setLocale(value)}>
          {map(['en', 'ru'], l => <MenuItem value={l} key={l} primaryText={l} />)}
        </SelectField>
        <IconMenu
          iconButtonElement={<Avatar session={session} />}
          anchorOrigin={{horizontal: 'right', vertical: 'top'}}
          targetOrigin={{horizontal: 'right', vertical: 'bottom'}}
        >
          <MenuItem primaryText="Sign out" onTouchTap={() => logout()} />
        </IconMenu>
      </div>
    )}
  />)

const mapStateToProps = ({session, app: {locale}}, ownProps) => {
  return {session, locale}
}
export default connect(mapStateToProps, {logout, setLocale})(Header)

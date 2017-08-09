export function setTitle(title) {
  return {type: 'SET_TITLE', title}
}

export function setLocale(locale) {
  return {type: 'SET_LOCALE', locale}
}

export function showNotification(payload) {
  return {type: 'SHOW_NOTIFICATION', payload}
}

export function getSession() {
  return dispatch =>
    fetch(`${process.env.REACT_APP_BACKEND}/session`, {credentials: 'include'}).then(async res => {
      const payload = await res.json()
      dispatch({type: 'SET_SESSION', payload})
    }).catch(e => {
      dispatch({type: 'SET_SESSION', payload: {authenticated: false}})
    })
}

export function logout() {
  return dispatch =>
    fetch(`${process.env.REACT_APP_BACKEND}/logout`, {credentials: 'include'}).then(async res => {
      dispatch({type: 'LOGOUT'})
    })
}
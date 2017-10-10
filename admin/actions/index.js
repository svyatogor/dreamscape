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
    fetch(`/admin/api/session`, {credentials: 'include'}).then(async res => {
      const payload = await res.json()
      dispatch({type: 'SET_SESSION', payload})
    }).catch(e => {
      dispatch({type: 'LOGOUT'})
    })
}

export function logout() {
  return dispatch =>
    fetch(`/admin/api/logout`, {credentials: 'include'}).then(async res => {
      dispatch({type: 'LOGOUT'})
    })
}

export function toggleField(site, catalog, field) {
  return {
    type: 'TOGGLE_FIELD_VISIBILITY',
    payload: {site, catalog, field},
  }
}
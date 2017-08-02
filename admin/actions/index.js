export function logout() {
  return {type: 'LOGOUT'}
}

export function setTitle(title) {
  return {type: 'SET_TITLE', title}
}

export function setLocale(locale) {
  return {type: 'SET_LOCALE', locale}
}

export function showNotification(payload) {
  return {type: 'SHOW_NOTIFICATION', payload}
}
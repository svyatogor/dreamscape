import {REHYDRATE} from 'redux-persist/constants'

const initialState = {
  title: "",
  locale: 'en',
  notification: null,
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SET_LOCALE':
      return {...state, locale: action.locale}
    case 'SET_TITLE':
      return {...state, title: action.title}
    case 'SHOW_NOTIFICATION':
      return {...state, notification: action.payload, notificationId: new Date()}
    case REHYDRATE:
      const incoming = action.payload.app
      if (incoming) {
        return {...state, ...incoming, notification: null}
      }
      return state
    default:
      return state
  }
}

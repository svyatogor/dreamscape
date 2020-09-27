import {REHYDRATE} from 'redux-persist/constants'
import {includes, without, get} from 'lodash'

const initialState = {
  title: "",
  locale: 'en',
  notification: null,
  visibleFields: {},
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SET_LOCALE':
      return {...state, locale: action.locale}
    case 'SET_TITLE':
      return {...state, title: action.title}
    case 'SHOW_NOTIFICATION':
      return {...state, notification: action.payload, notificationId: new Date()}
    case 'TOGGLE_FIELD_VISIBILITY': {
      const {site, catalog, field} = action.payload
      if (state.visibleFields[site] && includes(state.visibleFields[site][catalog], field)) {
        return {
          ...state,
          visibleFields: {
            ...state.visibleFields,
            [site]: {
              ...state.visibleFields[site],
              [catalog]: without(state.visibleFields[site][catalog], field)
            }
          }
        }
      } else {
        return {
          ...state,
          visibleFields: {
            ...state.visibleFields,
            [site]: {
              ...get(state.visibleFields, site, {}),
              [catalog]: [
                ...get(state.visibleFields, [site, catalog], []),
                field,
              ]
            }
          }
        }
      }
    }
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

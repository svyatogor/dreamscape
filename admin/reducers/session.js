const initialState = {
  email: null,
  name: null,
  avatar: null,
  authenticated: null,
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SET_SESSION': {
      return {...state, ...action.payload, authenticated: true}
    }
    case 'LOGOUT':
      return {
        ...state,
        email: null,
        name: null,
        avatar: null,
        authenticated: false,
      }
    default:
      return state
  }
}

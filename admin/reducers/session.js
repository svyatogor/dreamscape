const initialState = {
  loggedin: true,
  username: 'admin',
  fullName: 'Administrator',
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'LOGOUT':
      return {
        ...state,
        loggedin: false,
        username: undefined,
        fullName: undefined,
      }
    default:
      return state
  }
}

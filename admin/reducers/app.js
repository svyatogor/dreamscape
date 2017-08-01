const initialState = {
  title: ""
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SET_TITLE':
      return {...state, title: action.title}
    default:
      return state
  }
}

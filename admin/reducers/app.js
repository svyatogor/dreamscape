const initialState = {
  title: "",
  locale: 'en',
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SET_LOCALE':
      return {...state, locale: action.locale}
    case 'SET_TITLE':
      return {...state, title: action.title}
    default:
      return state
  }
}

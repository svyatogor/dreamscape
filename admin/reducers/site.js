const initialState = {
  modules: {
    StaticText: {
      name: 'Static text',
    },
  },
  layouts: {
    main: {
      label: 'Main',
      sections: {
        'main_area': {name: 'Main area'},
        'right_column': {name: 'Right column'},
      }
    },
  }
}

export default function (state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

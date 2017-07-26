const initialState = {
  locale: 'en',
  pages: [
    {
      id: 1,
      name: 'Home',
    },
    {
      id: 2,
      name: 'About us',
      parent_id: 1,
    },
  ],
  modules: {
    static_text: {
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

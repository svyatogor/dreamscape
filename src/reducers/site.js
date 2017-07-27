const initialState = {
  locale: 'en',
  pages: [
    {
      id: 1,
      title: {en: 'Home'},
    },
    {
      id: 2,
      title: {en: 'About Us'},
      parent_id: 1,
    },
    {
      id: 3,
      title: {en: 'Services'},
      parent_id: 1,
    },
    {
      id: 4,
      title: {en: 'Legal'},
      parent_id: 3,
    },
    {
      id: 5,
      title: {en: 'Finance Consulting'},
      parent_id: 3,
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

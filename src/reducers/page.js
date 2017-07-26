const initialState = {
  id: 2,
  title: {
    en: 'About XyZ'
  },
  link: {
    en: 'About'
  },
  slug: 'about',
  published: true,
  parent_id: 1,
  layout: 'main',
  sections: {
    main_area: {
      abc: {
        module: 'static_text'
      }
    }
  }
}

export default function (state = initialState, action) {
  switch (action.type) {
    default:
      return state
  }
}

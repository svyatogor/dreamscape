import React from 'react'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {Route, Switch, withRouter} from 'react-router-dom'
import PageMenu from './page_menu'
import PageEditorGeneral from './page_editor_general'

const SectionEditor = (page, Module) => props => {
  const {sectionKey, blockKey} = props.match.params
  let content = null
  if (sectionKey && blockKey) {
    const {module, ...moduleOptions} = page.sections[sectionKey][blockKey]
    Module = require(`./modules/${module}`).default
    content = <Module {...moduleOptions} />
  } else {
    content = <Module id={page.id} />
  }
  return (
    <div className="row">
      <div className="col-md-4">
        <PageMenu section={sectionKey} block={blockKey} page={page} />
      </div>
      <div className="col-md-8">
        {content}
      </div>
    </div>
  )
}

class PageEditorLayout extends React.Component {
  render() {
    const {page} = this.props
    return (
      <Switch>
        <Route path="/site/page/:pageId/section/:sectionKey/block/:blockKey" component={SectionEditor(page)} />
        <Route component={SectionEditor(page, PageEditorGeneral)} />
      </Switch>
    )
  }
}

const enhance = compose(
  withRouter,
  connect(({page}) => ({page})),
  withRouter,
)

export default enhance(PageEditorLayout)

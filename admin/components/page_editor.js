import React from 'react'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import {graphql} from 'react-apollo'
import {find} from 'lodash'
import {underscore} from 'inflection'
import PageMenu from './page_menu'
import PageEditorGeneral from './page_editor_general'
import page from '../graphql/page.gql'

const withMenu = (page, Module) => props => {
  const {section, block} = props.match.params
  let content = null
  if (section && block) {
    const pageSection = find(page.sections, {key: section})
    const {__typename} = pageSection.blocks[block]
    Module = require(`./modules/${underscore(__typename)}`).default
  }
  content = <Module page={page} section={section} block={block} />
  return (
    <div className="row">
      <div className="col-md-4">
        <PageMenu section={section} block={block} page={page} />
      </div>
      <div className="col-md-8">
        {content}
      </div>
    </div>
  )
}


class PageEditor extends React.Component {
  render() {
    if (this.props.data.loading) {
      return null
    }
    const {data: {page}} = this.props
    return (
      <Switch>
        <Route path="/site/page/:pageId/section/:section/block/:block" component={withMenu(page)} />
        <Route component={withMenu(page, PageEditorGeneral)} />
      </Switch>
    )
  }
}

const mapStateToProps = ({site}, ownProps) => {
  return {
    modules: site.modules,
    locale: site.locale,
  }
}

const enhance = compose(
  graphql(page, {
    options: ({match: {params: {pageId}}}) => ({variables: {id: pageId}})
  }),
  connect(mapStateToProps),
)

export default enhance(PageEditor)

import React from 'react'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import {graphql} from 'react-apollo'
import {find} from 'lodash'
import {underscore} from 'inflection'
import {t} from '../utils'
import {setTitle} from '../actions'
import PageMenu from './page_menu'
import PageEditorGeneral from './page_editor_general'
import page from '../graphql/page.gql'

const withMenu = (Module) => {
  class PageWithMenu extends React.Component {
    render() {
      if (this.props.data.loading) {
        return null
      }
      const {section, block} = this.props.match.params
      const {page} = this.props.data
      let content = null
      if (section && block) {
        const pageSection = find(page.sections, {key: section})
        if (!pageSection) return null
        const _block = find(pageSection.blocks, {ref: block})
        if (!_block) return null
        Module = require(`./modules/${underscore(_block.__typename)}`).default
      }
      content = <Module page={page} id={block} />
      return (
        <div>
          <div className="row">
            <div className="col-md-12">
              <h1 style={{paddingLeft: 70, marginBottom: 20}}>{t(page.title, this.props.locale)}</h1>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <PageMenu selectedBlock={block} page={page} />
            </div>
            <div className="col-md-8">
              {content}
            </div>
          </div>
        </div>
      )
    }
  }
  return graphql(page, {
    options: ({match: {params: {pageId}}}) => ({variables: {id: pageId}})
  })(connect(({app}) => ({locale: app.locale}))(PageWithMenu))
}

const NewPage = () =>
  <div className="row">
    <div className="col-md-4">
    </div>
    <div className="col-md-8">
      <PageEditorGeneral page={{}} />
    </div>
  </div>


const PageEditor = () =>
  <Switch>
    <Route path="/site/page/:pageId/section/:section/block/:block" component={withMenu()} />
    <Route path="/site/page/new" component={NewPage} />
    <Route component={withMenu(PageEditorGeneral)} />
  </Switch>

export default PageEditor

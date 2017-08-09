import React from 'react'
import {connect} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import {graphql} from 'react-apollo'
import _ from 'lodash'
import {underscore} from 'inflection'
import {t} from '../common/utils'
import PageMenu from './page_menu'
import PageEditorGeneral from './page_editor_general'
import page from '../graphql/page.gql'

const withMenu = (Module) => {
  class PageWithMenu extends React.Component {
    render() {
      if (this.props.data.loading) {
        return null
      }
      const {block} = this.props.match.params
      const {page} = this.props.data
      let content = null
      if (block) {
        const blockObj = _(page.sections).values().flatten().find({ref: block})
        if (blockObj) {
          Module = require(`./modules/${underscore(blockObj._type)}`).default
        } else {
          return null
        }
      }
      content = <Module page={page} id={block} />
      return (
        <div style={{flex: 1}}>
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
    <Route path="/site/page/:pageId/block/:block" component={withMenu()} />
    <Route path="/site/page/new" component={NewPage} />
    <Route component={withMenu(PageEditorGeneral)} />
  </Switch>

export default PageEditor

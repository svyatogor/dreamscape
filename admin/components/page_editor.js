import React from 'react'
import {connect} from 'react-redux'
import {Route, Switch} from 'react-router-dom'
import {graphql} from 'react-apollo'
import _ from 'lodash'
import PropTypes from 'prop-types'
import {t} from '../common/utils'
import PageMenu from './page_menu'
import PageEditorGeneral from './page_editor_general'
import page from '../graphql/page.gql'
import * as modules from './modules'
import ItemEditor from './catalog/item_editor'

const withMenu = (Module) => {
  class PageWithMenu extends React.Component {
    render() {
      if (this.props.data.loading) {
        return null
      }
      const {block} = this.props.match.params
      const {page} = this.props.data
      const {site} = this.context
      let content = null
      if (block) {
        const blockObj = _(page.sections).values().flatten().find({ref: block})
        if (blockObj && modules[blockObj._type]) {
          Module = modules[blockObj._type]
        } else if (blockObj && site.documentTypes[blockObj._type]) {
          content = (<ItemEditor id={block} catalog={site.documentTypes[blockObj._type]} catalogKey={blockObj._type} />)
        } else {
          return null
        }
      }

      if (!content && Module) {
        content = <Module page={page} id={block} />
      }

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

  PageWithMenu.contextTypes = {
    site: PropTypes.object,
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

import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {connect} from 'react-redux'
import {graphql} from 'react-apollo'
import List from './list'
import ItemEditor from './item_editor'
// import SiteTree from './site_tree'
// import SiteEditorWelcome from './site_editor_welcome'
// import PageEditor from './page_editor'
import siteQuery from '../../graphql/site.gql'
import {withTree} from './tree'

const Welcome = () => <div>Welcome</div>

class Catalog extends React.Component {
  render() {
    const {data: {loading, site}, match: {url, params: {catalogKey}}} = this.props
    if (loading) {
      return null
    }
    const catalog = site.documentTypes[catalogKey]
    if (catalog.hasFolders) {
      return (
        <Switch>
          <Route path={`${url}/folder/:folder/product/new`} render={withTree(ItemEditor, catalogKey, {catalog, site, catalogKey})} />
          <Route path={`${url}/folder/:folder/product/:productId`} render={withTree(ItemEditor, catalogKey, {catalog, site, catalogKey})} />
          <Route path={`${url}/folder/:folder/new`} render={withTree(ItemEditor, catalogKey)} />
          <Route path={`${url}/folder/:folder`} render={withTree(List, catalogKey, {catalog, site, catalogKey})} />
          <Route path={`${url}`} render={withTree(Welcome, catalogKey)} />
        </Switch>
      )
    }
  }
}

export default graphql(siteQuery)(connect()(Catalog))

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
import {TreeWrapper} from './tree'

const Welcome = () => <div>Welcome</div>

class Catalog extends React.Component {
  get catalog() {
    const {data: {site}, match: {params: {catalogKey}}} = this.props
    return site.documentTypes[catalogKey]
  }

  renderComponent(Component) {
    const {data: {site}, match: {params: {catalogKey}}} = this.props
    return props => (<TreeWrapper
      catalog={catalogKey}
      onAddFolder={() => this.addFolder()}
      {...props}>
      <Component catalog={this.catalog} site={site} catalogKey={catalogKey} />
    </TreeWrapper>)
  }

  render() {
    const {data: {loading}, match: {url}} = this.props
    if (loading) {
      return null
    }
    if (this.catalog && this.catalog.hasFolders) {
      return (
        <Switch>
          <Route path={`${url}/folder/:folder/product/new`} render={this.renderComponent(ItemEditor)} />
          <Route path={`${url}/folder/:folder/product/:productId`} render={this.renderComponent(ItemEditor)} />
          <Route path={`${url}/folder/:folder`} render={this.renderComponent(List)} />
          <Route path={`${url}`} render={this.renderComponent(Welcome)} />
        </Switch>
      )
    }
  }
}

export default graphql(siteQuery)(connect()(Catalog))

import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {FloatingActionButton, Paper} from 'material-ui'
import ContentAdd from 'material-ui/svg-icons/content/add'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import SiteTree from './site_tree'
import common from '../common.scss'
import SiteEditorWelcome from './site_editor_welcome'
import PageEditor from './page_editor'

class SiteEditor extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path="/site" render={this.renderRoute(SiteEditorWelcome)} />
        <Route path="/site/page/:pageId" render={this.renderRoute(PageEditor)} />
      </Switch>
    )
  }

  renderRoute(Component) {
    return ({match}) => {
      return (
        <div style={{display: 'flex', width: '100%'}}>
          <div style={{flex: 3, minWidth: 300}}>
            <SiteTree activePage={match.params.pageId} />
          </div>
          <div style={{flex: 15}}>
            <Paper style={{minHeight: '50%', marginLeft: '5%', paddingBottom: 20, marginTop: 15, marginBottom: 20}}>
              <Component match={match} />
            </Paper>
          </div>
          <div style={{flex: '1 4 5%', minWidth: 100}}></div>

          <div style={{position: 'fixed', bottom: 20, right: 20}}>
            <FloatingActionButton secondary onTouchTap={() => this.props.dispatch(push('/site/page/new'))}>
              <ContentAdd />
            </FloatingActionButton>
          </div>
        </div>
      )
    }
  }
}

export default connect()(SiteEditor)

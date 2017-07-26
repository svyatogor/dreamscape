import React from 'react'
import {Route} from 'react-router-dom'
import SiteTree from './site_tree'
import common from '../common.scss'
import SiteEditorWelcome from './site_editor_welcome'
import PageEditor from './page_editor'

class SiteEditor extends React.Component {
  render() {
    return (
      <div className={common.section}>
        <nav className={common.sectionSidebar}>
          <SiteTree />
        </nav>
        <div style={{flex: 8}}>
          <Route exact path="/site" component={SiteEditorWelcome} />
          <Route path="/site/(\d+)" component={PageEditor} />
        </div>
      </div>
    )
  }
}

export default SiteEditor
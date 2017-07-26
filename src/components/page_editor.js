import React from 'react'
import cx from 'classnames'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import {RaisedButton, Tabs, Tab} from 'material-ui'
import {withRouter} from 'react-router-dom'
import {
  TextField,
  Toggle,
} from 'redux-form-material-ui'
import {get, isEmpty} from 'lodash'
import common from '../common.scss'
import PageEditorGeneral from './page_editor_general'
import PageEditorLayout from './page_editor_layout'

const required = value => isEmpty(value) && 'Cannot be blank'

class PageEditor extends React.Component {
  render() {
    return (
      <div>
        <div className="pmd-tabs">
          <div className="pmd-tab-active-bar"></div>
          <ul className="nav nav-tabs" role="tablist">
            <li role="presentation"><a href="#default" aria-controls="default" role="tab" data-toggle="tab">Page settings</a></li>
            <li role="presentation" className="active"><a href="#fixed" aria-controls="fixed" role="tab" data-toggle="tab">Layout</a></li>
            <li role="presentation"><a href="#scrollable" aria-controls="scrollable" role="tab" data-toggle="tab">Scrollable</a></li>
          </ul>
        </div>
        <div className="pmd-card-body">
          <div className="tab-content">
            <div role="tabpanel" className="tab-pane" id="default">
              <PageEditorGeneral />
            </div>
            <div role="tabpanel" className="tab-pane active" id="fixed">
              <PageEditorLayout />
            </div>
            <div role="tabpanel" className="tab-pane" id="scrollable">To navigate between scrollable tabs, touch the tab or swipe the content area left or right. To scroll the tabs without
              navigating, swipe the tabs left or right.</div>
          </div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    $('.pmd-tabs').pmdTab()
  }
}

const mapStateToProps = ({site, page}, ownProps) => {
  return {
    modules: site.modules,
    locale: site.locale,
    page,
    initialValues: {
      ...page,
      title: get(page, ['title', site.locale])
    }
  }
}

const enhance = compose(
  withRouter,
  connect(mapStateToProps),
  reduxForm({form: 'page', enableReinitialize: true, keepDirtyOnReinitialize: true}),
)

export default enhance(PageEditor)

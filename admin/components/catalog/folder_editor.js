import React from 'react'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {Dialog, FlatButton} from 'material-ui'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import {TextField, Checkbox} from 'redux-form-material-ui'
import {showNotification} from '../../actions'
import {t} from '../../common/utils'

class FolderForm extends React.Component {
  onSaveFolder(data) {
    const {locale, showNotification, mutate, onClose} =  this.props
    const {name, hidden, id} = data
    const folder = {name, hidden, id, locale}
    console.log(folder)
    mutate({variables: {folder}}).then(() => {
      showNotification("Folder updated")
      onClose()
    })
  }

  render() {
    const {folder} = this.props
    if (!folder) {
      return null
    }
    const dialogActions = [
      <FlatButton
        label="Save"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.props.handleSubmit((data) => this.onSaveFolder(data))}
      />,
    ]

    return (
      <Dialog
        title={t(folder.name)}
        actions={dialogActions}
        modal={false}
        open={this.props.visible || false}
        onRequestClose={this.props.onClose}
        autoDetectWindowHeight
      >
      <form style={{maxWidth: '100%'}}>
        <Field name="name" component={TextField} fullWidth floatingLabelText="Name" style={{marginBottom: 10}} />
        <Field name="hidden" component={Checkbox} label="Hidden" labelPosition="left" />
      </form>
    </Dialog>)
  }
}

const upsertMutation = gql`
  mutation upsertFolder($folder: FolderInput!) {
    upsertFolder(folder: $folder) { id name hidden }
  }
`

const mapStateToProps = ({app: {locale}}, {folder}) => {
  return {initialValues: {
    ...folder,
    name: t(folder.name, locale),
  }, locale}
}

const e = compose(
  connect(mapStateToProps, {showNotification}),
  graphql(upsertMutation),
  reduxForm({form: 'folderForm', enableReinitialize: true})
)

export default e(FolderForm)
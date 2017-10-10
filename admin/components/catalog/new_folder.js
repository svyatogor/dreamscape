import React from 'react'
import {Dialog, FlatButton} from 'material-ui'
import {reduxForm, Field} from 'redux-form'
import {TextField} from 'redux-form-material-ui'
import {graphql, gql} from 'react-apollo'
import {connect} from 'react-redux'
import {compose} from 'recompose'
import {showNotification} from '../../actions'

class NewFolder extends React.Component {
  saveFolder(data) {
    const variables = {folder: {
      ...data,
      locale: this.props.locale,
      id: this.props.id,
      parent: this.props.parent,
      catalog: this.props.catalog,
    }}
    this.props.upsert({variables, refetchQueries: ['folders']}).then(() => {
      this.props.showNotification("Folder saved")
      this.props.onFolderSaved()
    })
  }

  render() {
    const dialogActions = [
      <FlatButton
        label="Save"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.props.handleSubmit((data) => this.saveFolder(data))}
      />,
    ]

    return (<Dialog
      title="New folder"
      actions={dialogActions}
      modal={false}
      open
      onRequestClose={this.props.onClose}
      autoDetectWindowHeight
    >
      <form style={{maxWidth: '100%'}}>
        <Field
          name="name"
          component={TextField}
          hintText="Folder name"
          floatingLabelText="Name"
          floatingLabelFixed
          fullWidth
        />
      </form>
    </Dialog>)
  }
}

const upsertMutation = gql`
  mutation upsertFolder($folder: FolderInput!) {
    upsertFolder(folder: $folder) { id }
  }
`

const enhancer = compose(
  graphql(upsertMutation, {name: 'upsert'}),
  connect(state => ({locale: state.app.locale}), {showNotification}),
  reduxForm({form: 'newFolderForm', enableReinitialize: true}),
)

export default enhancer(NewFolder)

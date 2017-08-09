import React from 'react'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {Paper, FloatingActionButton, Dialog, FlatButton} from 'material-ui'
import ContentAdd from 'material-ui/svg-icons/content/add'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import {map} from 'lodash'
import {
  TextField,
} from 'redux-form-material-ui'
import {t} from '../common/utils'
import {RedactorField as Redactor} from './redactor'
import {showNotification} from '../actions'

class SnippetForm extends React.Component {
  render() {
    const {snippet} = this.props
    const dialogActions = [
      <FlatButton
        label="Save"
        primary={true}
        keyboardFocused={true}
        onTouchTap={this.props.handleSubmit((data) => this.props.onSaveSnippet(data))}
      />,
    ]

    return (
      <Dialog
        title={snippet.id ? snippet.key : 'New snippet'}
        actions={dialogActions}
        modal={false}
        open={this.props.visible}
        onRequestClose={this.props.onClose}
        autoDetectWindowHeight
      >
      <form style={{maxWidth: '100%'}}>
        <Field name="key" component={TextField} hintText="Snippet name" floatingLabelText="Name" floatingLabelFixed
          fullWidth />
        <Field name="content" component={Redactor} minHeight={0} maxHeight={200} />
      </form>
    </Dialog>)
  }
}

const ReduxSnippetForm = connect((_, {snippet}) => {
  return {initialValues: {
    id: snippet.id,
    key: snippet.key,
    content: t(snippet.content)
  }}
})(reduxForm({form: 'newSnippetForm', enableReinitialize: true})(SnippetForm))

const Snippet = ({snippet, onTouchTap}) =>
  <Paper style={{padding: 10, marginTop: 20}} onTouchTap={() => onTouchTap()}>
    <h2>{snippet.key}</h2>
    <div dangerouslySetInnerHTML={{__html: t(snippet.content)}}></div>
  </Paper>

class SnippetsEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showNewSnippetDialog: false,
      snippet: {},
    }
  }
  render() {
    const snippets = this.props.data.snippets
    return (<div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
      <div style={{width: '60%'}}>
        {map(snippets, snippet =>
            <Snippet key={snippet.id} snippet={snippet} onTouchTap={() => this.setState({showNewSnippetDialog: true, snippet})} />)}
      </div>

      <div style={{position: 'fixed', bottom: 20, right: 20}}>
        <FloatingActionButton secondary onTouchTap={() => this.setState({showNewSnippetDialog: true, snippet: {}})}>
          <ContentAdd />
        </FloatingActionButton>
      </div>

      <ReduxSnippetForm
        onSaveSnippet={(data) => this.upsertSnippet(data)}
        visible={this.state.showNewSnippetDialog}
        snippet={this.state.snippet}
        onClose={() => this.setState({showNewSnippetDialog: false})}
      />
    </div>)
  }

  upsertSnippet(data) {
    const input = {...data, global: true, locale: this.props.locale}
    this.props.upsert({variables: {input}, refetchQueries: ['snippets']}).then(() => {
      this.props.showNotification("Snippet saved")
      this.setState({showNewSnippetDialog: false})
    })
  }
}

const query = gql`
  query snippets {
    snippets { id content key }
  }
`

const upsertMutation = gql`
  mutation saveSnippet($input: StaticTextInput!) {
    saveStaticText(input: $input) { id content key }
  }
`

const enhancer = compose(
  graphql(upsertMutation, {name: 'upsert'}),
  graphql(query),
  connect(state => ({locale: state.app.locale}), {showNotification}),
)

export default enhancer(SnippetsEditor)

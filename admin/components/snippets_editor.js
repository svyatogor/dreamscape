import React from 'react'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {Card, CardHeader, CardText, FloatingActionButton, Dialog, FlatButton} from 'material-ui'
import ContentAdd from 'material-ui/svg-icons/content/add'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import {map} from 'lodash'
import {
  TextField,
} from 'redux-form-material-ui'
import SearchBar from 'material-ui-search-bar'
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
    let field
    switch (snippet.type) {
      case "html":
        field = (<Field
          name="content"
          component={Redactor}
          minHeight={0} maxHeight={200}
        />)
        break
      case "string":
        field = (<Field
          name="content"
          component={TextField}
          fullWidth
        />)
        break
      case "text":
        field = (<Field
          name="content"
          component={TextField}
          multiLine
          fullWidth
        />)
        break
      default:
        break;
    }

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
        {field}
      </form>
    </Dialog>)
  }
}

const ReduxSnippetForm = connect(({app: {locale}}, {snippet}) => {
  return {initialValues: {
    id: snippet.id,
    key: snippet.key,
    content: t(snippet.content, locale)
  }}
})(reduxForm({form: 'newSnippetForm', enableReinitialize: true})(SnippetForm))

const Snippet = ({snippet, locale, onTouchTap}) =>
  <div style={{width: '33%', padding: 10}}>
    <Card style={{height: 300}} onTouchTap={() => onTouchTap()}>
      <CardHeader title={snippet.key} />
      <CardText>
        {snippet.type === 'string' &&
          <h1 style={{textAlign: 'center'}}>{t(snippet.content, locale)}</h1>
        }
        {snippet.type === 'html' &&
          <div dangerouslySetInnerHTML={{__html: t(snippet.content, locale)}}></div>
        }
        {snippet.type === 'text' &&
          <pre>{t(snippet.content, locale).replace(/^\s+/gm, '')}</pre>
        }
      </CardText>
    </Card>
  </div>

class SnippetsEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showNewSnippetDialog: false,
      snippet: {},
      filter: '',
    }
  }
  render() {
    const {filter} = this.state
    const filterCI = filter.toLowerCase()
    console.log('filter', filter)
    const snippets = filter.length > 3 ?
      this.props.data.snippets.filter(s =>
        s.key.toLowerCase().includes(filterCI) || t(s.content, this.props.locale).toLowerCase().includes(filterCI)
      ) : this.props.data.snippets
    return (<div style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'flex-start'}}>
      <div style={{width: '60%'}}>
        <SearchBar
          onChange={filter => this.setState({filter})}
          onRequestSearch={() => {}}
          style={{
            margin: 20, marginLeft: 10
          }}
        />
        <div style={{display: 'flex',  flexWrap: 'wrap'}}>
          {map(snippets, snippet =>
              <Snippet
                key={snippet.id}
                snippet={snippet}
                locale={this.props.locale}
                onTouchTap={() => this.setState({showNewSnippetDialog: true, snippet})}
              />)}
        </div>
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
    snippets { id content key type }
  }
`

const upsertMutation = gql`
  mutation saveSnippet($input: StaticTextInput!) {
    saveStaticText(input: $input) { id content key type }
  }
`

const enhancer = compose(
  graphql(upsertMutation, {name: 'upsert'}),
  graphql(query),
  connect(state => ({locale: state.app.locale}), {showNotification}),
)

export default enhancer(SnippetsEditor)

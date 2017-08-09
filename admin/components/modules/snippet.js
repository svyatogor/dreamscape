import React from 'react'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {RaisedButton} from 'material-ui'
import {AutoComplete as MUIAutoComplete} from 'material-ui'
import {AutoComplete} from 'redux-form-material-ui'
import {Field, reduxForm} from 'redux-form'
import common from '../../common.scss'
import {showNotification} from '../../actions'

class Snippet extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    if (this.props.data.loading) {
      return null
    }
    return (<div>
      <Field
        name="snippet"
        component={AutoComplete}
        floatingLabelText="Snippet"
        openOnFocus
        filter={MUIAutoComplete.fuzzyFilter}
        dataSourceConfig={{text: 'key', value: 'id'}}
        dataSource={this.props.snippets}
      />
      <div className={common.formActions}>
        <RaisedButton label="Save" primary={true} disabled={!this.state.value} type="submit" onTouchTap={() => this.save()} />
      </div>
    </div>)
  }

  componentWillUpdate({locale}) {
    if (locale !== this.props.locale) {
      this.setState({value: null})
    }
  }

  save() {
    const input = {
      id: this.props.id,
      locale: this.props.locale,
      content: this.state.value,
    }
    this.props.mutate({variables: {input}, refetchQueries: ['staticText']}).then(() =>
      this.props.showNotification("Text saved")
    )
  }
}

const listSnippets = gql`
  query staticText {
    snippets { id key }
  }
`

// const saveStaticText = gql`
//   mutation saveStaticText($input: StaticTextInput!) {
//     saveStaticText(input: $input) { content }
//   }
// `

const mapStateToProps = ({app: {locale}}) => ({
  locale
})

const enhance = compose(
  connect(mapStateToProps, {showNotification}),
  graphql(listSnippets),
  reduxForm({form: 'snippetModule'})
  // graphql(saveStaticText),
)
export default enhance(Snippet)

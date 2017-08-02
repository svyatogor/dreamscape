import React from 'react'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {find, get} from 'lodash'
import {RaisedButton} from 'material-ui'
import Redactor from '../redactor'
import common from '../../common.scss'

class StaticText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    if (this.props.data.loading) {
      return null
    }
    const {locale} = this.props
    const value = this.state.value || get(find(this.props.data.staticText.content, {locale}), 'value', '')
    return (<div>
      <Redactor value={value} onChange={(value) => this.setState({value})} />
      <div className={common.formActions}>
        <RaisedButton label="Save" primary={true} disabled={!this.state.value} type="submit" onTouchTap={() => this.save()} />
      </div>
    </div>)
  }

  save() {
    this.props.save(this.state.value)
  }
}

const getStaticText = gql`
  query staticText($id: ID!) {
    staticText(id: $id) {
      content {
        locale
        value
      }
    }
  }
`

const saveStaticText = gql`
  mutation saveStaticText($id: ID!, $content: I18nStringInput!) {
    saveStaticText(id: $id, content: $content) {
      content {
        locale
        value
      }
    }
  }
`

const mapStateToProps = ({app: {locale}}) => ({
  locale
})

const enhance = compose(
  connect(mapStateToProps),
  graphql(getStaticText),
  graphql(saveStaticText, {
    props: ({mutate, ownProps: {locale, page: {id}, section, block}}) => ({
      save: (value) => {
        mutate({variables: {
          id: block,
          content: {
            locale,
            value
          }
        }})
      },
    }),
  }),
)
export default enhance(StaticText)

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
        <RaisedButton label="Save" primary={true} disabled={!this.state.value} type="submit" />
      </div>
    </div>)
  }
}

const getStaticText = gql`
  query staticText($ref: BlockRef!) {
    staticText(ref: $ref) {
      content {
        locale
        value
      }
    }
  }
`

const mapStateToProps = ({site: {locale}}) => ({
  locale
})

const enhance = compose(
  graphql(getStaticText, {
    options: ({page: {id}, section, block}) => ({
      variables: {ref: {page: id, section, block}}
    })
  }),
  connect(mapStateToProps)
)
export default enhance(StaticText)

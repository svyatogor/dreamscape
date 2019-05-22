import React from 'react'
import {get} from 'lodash'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {AutoComplete} from 'material-ui'
import common from '../../common.scss'

const ReferenceField = props => {
  const {dataSource = [], input, floatingLabelText, required} = props
  const value = get(dataSource.find(i => i.id === input.value), 'label')
  return <AutoComplete
    floatingLabelText={floatingLabelText}
    searchText={value}
    fullWidth floatingLabelFixed
    dataSource={dataSource}
    required={required}
    onNewRequest={({id}) => input.onChange(id)}
    className={common.formControl}
    dataSourceConfig={{text: 'label', value: 'id'}} />
}


const mapStateToProps = (props, ownProps) => {
  return {
    dataSource: get(ownProps, 'data.items'),
    ...ownProps
  }
}

const dataQuery = gql`
  query items($catalog: String!) {
    items(catalog: $catalog) {
      id
      label
    }
  }
`

const enhance = compose(
  graphql(dataQuery, {
    options: props => {
      return ({variables: {catalog: props.field.documentType}})
    }
  }),
  connect(mapStateToProps),
)

export default enhance(ReferenceField)
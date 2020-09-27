import React from 'react'
import {graphql} from 'react-apollo'
import {loader} from 'graphql.macro'
const siteQuery = loader('../graphql/site.gql')

const Welcome = props => {
  if (props.data.site) {
    return <div className="emptyBlock">Welcome to {props.data.site.key} admin.</div>
  } else {
    return null
  }
}

export default graphql(siteQuery)(Welcome)
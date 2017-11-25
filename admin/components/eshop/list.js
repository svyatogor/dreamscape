import React from 'react'
import {map} from 'lodash'
import {graphql, gql} from 'react-apollo'
import Order from './order'

class List extends React.Component {
  render() {
    const {data} = this.props
    if (data.loading) {
      return null
    }
    return <div>{map(data.eshopOrders, order => <Order order={order} key={order.id} />)}</div>
  }
}

const ordersQuery = gql`
  query orders($search: String) {
    eshopOrders(search: $search) {
      id
      createdAt
      number
      lines {
        name
        price
        count
        product
      }
      billingAddress {
        name
        city
        email
        postalCode
        streetAddress
        phone
      }
      status
      paymentMethod
      paymentStatus
      total
      receipt
    }
  }
`

export default graphql(ordersQuery)(List)
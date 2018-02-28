import React from 'react'
import {
  Card,
  CardHeader,
  CardText,
  CardActions,
  FlatButton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderColumn,
  TableRowColumn,
} from 'material-ui'
import numeral from 'numeral'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {get, map} from 'lodash'
import {humanize} from 'inflection'
import moment from 'moment'
import {get, isEmpty} from 'lodash'
import {showNotification} from '../../actions'

const Colors = {
  new: 'green',
  shipped: '#c7ca00',
  completed: 'blue',
  default: '#ccc',
}

class Order extends React.Component {
  getOrderSubtitle({billingAddress: d}) {
    return (<span>
      {d.name} &lt;{d.email}&gt; ({d.phone}), {d.city} {d.postalCode} {d.streetAddress}
    </span>)
  }

  setStatus(newStatus) {
    this.props.mutate({
      variables: {order: this.props.order.id, status: newStatus},
      refetchQueries: ['orders']
    }).then(() => {
      this.props.showNotification(`Order marked as ${newStatus}`)
    }).catch(e => {
      console.log(e);
      this.props.showNotification(`Ooos, something went wrong.`)
    })
  }

  render() {
    const {order} = this.props
    const finiteStatus = ['completed', 'canceled'].includes(order.status)
    return (
      <Card style={{marginBottom: 20}} containerStyle={{borderTopStyle: 'solid', borderTopWidth: 4, borderColor: get(Colors, order.status, Colors.default)}}>
        <CardHeader
          title={<span>#{order.number} <span style={{fontWeight: 'normal'}}>{moment(order.createdAt).format('ll LT')}</span></span>}
          subtitle={this.getOrderSubtitle(order)}
          actAsExpander
          showExpandableButton
          style={{display: 'flex'}}
        >
          <div style={{marginLeft: 'auto', marginRight: 40, textAlign: 'right'}}>
            <span style={{color: get(Colors, order.status, Colors.default)}}>{humanize(order.status).toUpperCase()}</span>
            <br/>
            {numeral(order.total).format('0.00')} <span style={{fontWeight: '200'}}>({humanize((order.paymentStatus || 'not-paid').replace('-', '_'))})</span>
          </div>
        </CardHeader>
        <CardText expandable={true}>
          <Table selectable={false}>
            <TableHeader displaySelectAll={false} adjustForCheckbox={false} enableSelectAll={false}>
              <TableRow>
                <TableHeaderColumn>Name</TableHeaderColumn>
                <TableHeaderColumn>Quantity</TableHeaderColumn>
                <TableHeaderColumn>Price</TableHeaderColumn>
                <TableHeaderColumn style={{textAlign: 'right'}}>Total</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false}>
              {map(order.lines, item => (<TableRow key={item.product.id} hoverable>
                <TableRowColumn>{isEmpty(item.name) ? get(item, 'product.data.name', 'DELETED') : item.name}</TableRowColumn>
                <TableRowColumn>{item.count}</TableRowColumn>
                <TableRowColumn>{numeral(item.price).format('0.00')}</TableRowColumn>
                <TableRowColumn style={{textAlign: 'right'}}>{numeral(item.price * item.count).format('0.00')}</TableRowColumn>
              </TableRow>))}
              <TableRow>
                <TableRowColumn style={{textAlign: 'right', fontSize: 18}} colSpan={4}>
                  Delivery - {order.delivery.label}: {numeral(order.delivery.cost).format('0.00')}
                </TableRowColumn>
              </TableRow>
              <TableRow>
                <TableRowColumn style={{textAlign: 'right', fontSize: 18}} colSpan={4}>
                  Order total: {numeral(order.total).format('0.00')}
                </TableRowColumn>
              </TableRow>
            </TableBody>
          </Table>
        </CardText>
        <CardActions expandable>
          {!finiteStatus && order.status !== 'shipped' &&
            <FlatButton icon={<i className="mdi mdi-truck" />} label="Ship" onClick={() => this.setStatus('shipped')} />
          }
          {!finiteStatus &&
            <FlatButton icon={<i className="mdi mdi-check" />} label="Complete" onClick={() => this.setStatus('completed')} />
          }
          {!finiteStatus &&
            <FlatButton style={{float: 'right'}} secondary label="Cancel" onClick={() => this.setStatus('canceled')} />
          }
          {order.paymentMethod === 'paypal' &&
            <FlatButton
              icon={<i className="mdi mdi-receipt" />}
              style={{float: 'right'}}
              label="View receipt"
              onClick={() => window.open(`https://www.paypal.com/activity/payment/${get(order.receipt, 'id')}`, get(order.receipt, 'id'), {toolbar: false})} />
          }
        </CardActions>
      </Card>
    )
  }
}

const updateOrderStatus = gql`
  mutation updateOrderStatus($order: ID!, $status: OrderStatus!) {
    updateOrderStatus(order: $order, status: $status) { id }
  }
`

const e = compose(
  graphql(updateOrderStatus),
  connect(() => ({}), {showNotification})
)

export default e(Order)

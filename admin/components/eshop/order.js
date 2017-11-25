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
import {get, map} from 'lodash'
import {humanize} from 'inflection'
import moment from 'moment'

const Colors = {
  new: 'green',
  shipped: 'yellow',
  completed: 'blue',
  default: '#ccc',
}

export default class extends React.Component {
  getOrderSubtitle({billingAddress: d}) {
    return (<span>
      {d.name} &lt;{d.email}&gt; ({d.phone}), {d.city} {d.postalCode} {d.streetAddress}
    </span>)
  }

  render() {
    const {order} = this.props
    return (
      <Card style={{marginBottom: 20}} containerStyle={{borderTopStyle: 'solid', borderTopWidth: 4, borderColor: get(Colors, order.status, Colors.default)}}>
        <CardHeader
          title={<span>#13439 <span style={{fontWeight: 'normal'}}>{moment(order.createdAt).format('ll LT')}</span></span>}
          subtitle={this.getOrderSubtitle(order)}
          actAsExpander
          showExpandableButton
          style={{display: 'flex'}}
        >
          <div style={{marginLeft: 'auto', marginRight: 40, textAlign: 'right'}}>
            <span style={{color: get(Colors, order.status, Colors.default)}}>{humanize(order.status).toUpperCase()}</span>
            <br/>
            {order.total} <span style={{fontWeight: '200'}}>({humanize((order.paymentStatus || 'not-paid').replace('-', '_'))})</span>
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
              {map(order.lines, item => (<TableRow key={item.product} hoverable>
                <TableRowColumn>{item.name}</TableRowColumn>
                <TableRowColumn>{item.count}</TableRowColumn>
                <TableRowColumn>{item.price}</TableRowColumn>
                <TableRowColumn style={{textAlign: 'right'}}>{item.price * item.count}</TableRowColumn>
              </TableRow>))}
              <TableRow>
                <TableRowColumn style={{textAlign: 'right', fontSize: 18}} colSpan={4}>
                  Order total: {order.total}
                </TableRowColumn>
              </TableRow>
            </TableBody>
          </Table>
        </CardText>
        <CardActions expandable>
          <FlatButton icon={<i className="mdi mdi-truck" />} label="Ship" onClick={this.handleExpand} />
          <FlatButton icon={<i className="mdi mdi-check" />} label="Complete" onClick={this.handleReduce} />
          <FlatButton style={{float: 'right'}} label="Cancel" secondary onClick={this.handleReduce} />
          {order.paymentMethod === 'paypal' &&
            <FlatButton
              icon={<i className="mdi mdi-receipt" />}
              style={{float: 'right'}}
              label="View receipt"
              onClick={() => window.open(`https://www.sandbox.paypal.com/activity/payment/${get(order.receipt, 'id')}`, get(order.receipt, 'id'), {toolbar: false})} />
          }
        </CardActions>
      </Card>
    )
  }
}
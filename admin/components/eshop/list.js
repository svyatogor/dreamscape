import React from 'react'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
  Card,
  CardTitle,
  IconMenu,
  IconButton,
  MenuItem,
  Divider,
} from 'material-ui'
import SearchBar from 'material-ui-search-bar'
import ContentFilterList from 'material-ui/svg-icons/content/filter-list'
import {grey500} from 'material-ui/styles/colors'
import {omitBy, includes, get, map} from 'lodash'
import {humanize} from 'inflection'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import moment from 'moment'
import {push} from 'react-router-redux'
import {t} from '../../common/utils'

class List extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  get configurationMenu() {
    return (
      <IconMenu
        iconButtonElement={<IconButton><ContentFilterList color={grey500} /></IconButton>}
        anchorOrigin={{horizontal: 'right', vertical: 'top'}}
        targetOrigin={{horizontal: 'right', vertical: 'top'}}
        style={{marginLeft: 'auto', marginTop: -5}}
      >
        <MenuItem primaryText="New" checked />
        <MenuItem primaryText="Completed" />
      </IconMenu>
    )
  }

  render() {
    const {data} = this.props
    return (
      <div style={{minHeight: '50%', marginLeft: '5%', marginRight: '5%', marginTop: 20}}>
        <SearchBar
          onChange={filter => this.setState({filter})}
          onRequestSearch={() => {}}
          style={{marginBottom: 20}}
        />
        <Card style={{minHeight: '25%'}}  className="flexContainer">
          <CardTitle title="Orders" style={{display: 'flex'}}>
            {this.configurationMenu}
          </CardTitle>
          <Table selectable={true}>
            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
              <TableRow>
                <TableHeaderColumn>#</TableHeaderColumn>
                <TableHeaderColumn>Date</TableHeaderColumn>
                <TableHeaderColumn>Buyer</TableHeaderColumn>
                <TableHeaderColumn>Total</TableHeaderColumn>
                <TableHeaderColumn>Status</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false}>
              {map(data.eshopOrders, order => (<TableRow key={order.id} hoverable onTouchTap={() => {}}>
                <TableRowColumn>{order.id}</TableRowColumn>
                <TableRowColumn>{moment(order.createdAt).format('MMM D, LT')}</TableRowColumn>
                <TableRowColumn>{order.billingAddress.name}</TableRowColumn>
                <TableRowColumn>{order.total}</TableRowColumn>
                <TableRowColumn>{order.status}</TableRowColumn>
              </TableRow>))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }
}

const ordersQuery = gql`
  query orders {
    eshopOrders {
      id
      createdAt
      number
      billingAddress {
        name
        city
      }
      status
      paymentMethod
      paymentStatus
      total
    }
  }
`

const mapStateToProps = (state, ownProps) => {
  return {}
}

const enhance = compose(
  graphql(ordersQuery),
  connect(mapStateToProps, {push})
)

export default enhance(List)
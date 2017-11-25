import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  IconMenu,
  IconButton,
  MenuItem,
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
import SearchBar from 'material-ui-search-bar'
import ContentFilterList from 'material-ui/svg-icons/content/filter-list'
import {grey500} from 'material-ui/styles/colors'
import {omitBy, includes, get, map, debounce} from 'lodash'
import {humanize} from 'inflection'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import moment from 'moment'
import {push} from 'react-router-redux'
import {t} from '../../common/utils'
import OrdersList from './list'

class OrdersManager extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const setFilter = debounce(filter => this.setState({filter}), 500)
    return (
      <div style={{minHeight: '50%', marginLeft: '5%', marginRight: '5%', marginTop: 20, width: '100%'}}>
        <SearchBar
          onChange={setFilter}
          onRequestSearch={() => {}}
          style={{marginBottom: 20}}
        />
        <OrdersList search={this.state.filter} />
      </div>
    );
  }
}

export default OrdersManager
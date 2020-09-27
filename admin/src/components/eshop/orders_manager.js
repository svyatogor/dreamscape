import React from 'react'
import SearchBar from 'material-ui-search-bar'
import {debounce} from 'lodash'
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
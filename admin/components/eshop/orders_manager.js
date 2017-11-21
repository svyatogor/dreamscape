import React from 'react'
import {Route, Switch} from 'react-router-dom'
import List from './list'
// import Order from './order'

export default class OrdersManager extends React.Component {
  render() {
    const {match: {url}} = this.props
    return (
      <Switch>
        <Route path={`${url}`} component={List} />
      </Switch>
    )
  }
}

// <Route path={`${url}/order/:order`} component={Order} />
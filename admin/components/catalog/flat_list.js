import React from 'react'
import {
  Card,
  CardTitle,
} from 'material-ui'
import {pluralize, humanize} from 'inflection'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import SearchBar from 'material-ui-search-bar'
import {push} from 'react-router-redux'
import ListConfigurationMenu from './list_configuration_menu'
import {showNotification} from '../../actions'
import ItemsList from './items_list'

class FlatList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const {catalogKey, catalog, site} = this.props
    const {search} = this.state
    return (
      <div>
      <SearchBar
        onChange={search => this.setState({search})}
        onRequestSearch={() => {}}
        style={{marginBottom: 10, marginTop: 15, marginLeft: '5%'}}
        value={this.state.search}
      />
      {search && search.length >= 3 && <Card style={{minHeight: '50%', marginLeft: '5%', paddingBottom: 20, marginTop: 15, marginBottom: 20}} className="flexContainer">
        <CardTitle title={search} />
        <ItemsList search={search} site={site} catalog={catalog} catalogKey={catalogKey} />
      </Card>}

      {!search &&
        <Card style={{minHeight: '50%', marginLeft: '5%', paddingBottom: 20, marginTop: 15, marginBottom: 20}} className="flexContainer">
          {this.deleteFolderConfirmationDialog}
          <CardTitle title={humanize(pluralize(catalogKey))} style={{display: 'flex'}}>
            <ListConfigurationMenu {...this.props} />
          </CardTitle>
          <ItemsList site={site} catalog={catalog} catalogKey={catalogKey} />}
        </Card>
      }
      </div>
    );
  }

  componentWillReceiveProps(props, state) {
    this.setState({search: ''})
  }
}

const enhance = compose(
  connect(() => ({}), {push, showNotification})
)

export default enhance(FlatList)
import React from 'react'
import {Card} from 'material-ui'
import SearchBar from 'material-ui-search-bar'
import {replace} from 'react-router-redux'
import {connect} from 'react-redux'
import ItemsList from './items_list'

class Search extends React.Component {
  render() {
    const {catalogKey, catalog, site, replace} = this.props
    const {search} = this.props.match.params
    return (
      <div style={{minHeight: '50%', marginLeft: '5%', paddingBottom: 20, marginTop: 15, marginBottom: 20}}>
        <SearchBar
          onChange={search => replace(`/catalog/${catalogKey}/search/${search}`)}
          onRequestSearch={() => {}}
          style={{marginBottom: 40}}
          value={search}
        />
        {search && search.length >= 3 && <Card className="flexContainer">
          <ItemsList search={search} site={site} catalog={catalog} catalogKey={catalogKey} />
        </Card>}
      </div>

    );
  }
}

export default connect(() => ({}), {replace})(Search)
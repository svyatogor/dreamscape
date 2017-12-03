import React from 'react'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
  IconButton,
  Dialog,
  FlatButton,
} from 'material-ui'
import {get, map} from 'lodash'
import {humanize} from 'inflection'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {t} from '../../common/utils'
import {showNotification} from '../../actions'
import { isBoolean } from 'util';

class ItemsList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  get deleteItemConfirmationDialog() {
    const {labelField} = this.props.catalog
    const {requestDeleteItem} = this.state
    return (<Dialog
      title="Delete item?"
      actions={
        [
          <FlatButton
            label="Cancel"
            keyboardFocused
            onClick={() => this.setState({requestDeleteItem: null})}
          />,
          <FlatButton
            label="Delete"
            primary
            onClick={() => this.deleteItem()}
          />,
        ]
      }
      modal={false}
      open={!!requestDeleteItem}
      onRequestClose={() => this.setState({requestDeleteItem: null})}
    >
      {requestDeleteItem &&
        `Are you sure you want to delete ${t(this.state.requestDeleteItem.data[labelField])}`
      }
    </Dialog>)
  }

  deleteItem() {
    this.props.deleteItem({
      variables: {id: this.state.requestDeleteItem.id},
      refetchQueries: ['items'],
    }).then(() => {
      this.setState({requestDeleteItem: null})
      this.props.showNotification('Item deleted')
    })
  }

  requestDeleteItem(item) {
    this.setState({requestDeleteItem: item})
  }

  render() {
    const {visibleFields, data, catalogKey, push} = this.props
    return (
      <Table selectable={false}>
        <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
          {this.deleteItemConfirmationDialog}
          <TableRow>
            {map(visibleFields, f =>
              <TableHeaderColumn key={f}>{humanize(f)}</TableHeaderColumn>
            )}
            <TableHeaderColumn />
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {map(data.items, item => (<TableRow key={item.id} hoverable>
            {map(visibleFields, f =>
              <TableRowColumn key={f}>
                {isBoolean(item.data[f]) && item.data[f] && <i className="mdi mdi-check" />}
                {!isBoolean(item.data[f]) && t(item.data[f])}
              </TableRowColumn>
            )}
            <TableRowColumn style={{textAlign: 'right'}}>
              <IconButton
                onTouchTap={() => push(`/catalog/${catalogKey}/folder/${item.folder}/item/${item.id}`)}
              >
                <i className="material-icons">edit</i>
              </IconButton>
              <IconButton onTouchTap={() => this.requestDeleteItem(item)}>
                <i className="material-icons">delete</i>
              </IconButton>
            </TableRowColumn>
          </TableRow>))}
        </TableBody>
      </Table>
    );
  }
}

const items = gql`
  query items($folder: ID, $search: String) {
    items(folder: $folder, search: $search) {
      id
      folder
      data
    }
  }
`

const deleteItem = gql`
  mutation deleteItem($id: ID!) {
    deleteItem(id: $id)
  }
`

const mapStateToProps = (state, ownProps) => {
  return {
    visibleFields: [
      get(ownProps, 'catalog.labelField'),
      ...get(state.app.visibleFields, [ownProps.site.key, ownProps.catalogKey], []),
    ]
  }
}

const enhance = compose(
  graphql(items),
  graphql(deleteItem, {name: 'deleteItem'}),
  connect(mapStateToProps, {push, showNotification})
)

export default enhance(ItemsList)
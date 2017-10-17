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
  Dialog,
  FlatButton,
  Divider,
} from 'material-ui'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import {grey500} from 'material-ui/styles/colors'
import {omitBy, includes, get, map} from 'lodash'
import {humanize} from 'inflection'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {t} from '../../common/utils'
import {toggleField, showNotification} from '../../actions'

class List extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  get configurationMenu() {
    const {
      catalog: {fields, labelField},
      catalogKey,
      site: {key: siteKey},
      visibleFields, toggleField
    } = this.props
    const controllableFields = omitBy(fields, ({type}) =>
      type === 'html' || type === 'image'
    )
    return (
      <IconMenu
        iconButtonElement={<IconButton><MoreVertIcon color={grey500} /></IconButton>}
        anchorOrigin={{horizontal: 'right', vertical: 'top'}}
        targetOrigin={{horizontal: 'right', vertical: 'top'}}
        style={{marginLeft: 'auto', marginTop: -5}}
      >
        <MenuItem
          primaryText="Rename folder"
          leftIcon={<i className="material-icons">edit</i>}
        />
        <MenuItem
          primaryText="Delete folder"
          style={{color: 'red'}}
          onTouchTap={() => this.requestDeleteFolder()}
          leftIcon={<i className="material-icons">delete</i>}
        />
        <Divider />
        {Object.keys(controllableFields).sort().map(key => {
          const disabled = key === labelField
          const checked = includes(visibleFields, key)
          return (<MenuItem
            primaryText={humanize(key)}
            key={key}
            style={{paddingLeft: disabled ? 70 : (checked ? -5 : 55)}}
            onTouchTap={() => toggleField(siteKey, catalogKey, key)}
            disabled={disabled}
            checked={checked}
          />)
        })}

      </IconMenu>
    )
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

  get deleteFolderConfirmationDialog() {
    const {requestDeleteFolder} = this.state
    return (<Dialog
      title="Delete item?"
      actions={
        [
          <FlatButton
            label="Cancel"
            keyboardFocused
            onClick={() => this.setState({requestDeleteFolder: null})}
          />,
          <FlatButton
            label="Delete"
            primary
            onClick={() => this.deleteFolder()}
          />,
        ]
      }
      modal={false}
      open={!!requestDeleteFolder}
      onRequestClose={() => this.setState({requestDeleteFolder: null})}
    >
      Are you sure you want to delete this folder with all subfolders and items?
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

  deleteFolder() {
    const {showNotification, push, deleteFolder, folderData, catalogKey} = this.props
    console.log(folderData);
    deleteFolder({
      variables: {id: folderData.folder.id},
      refetchQueries: ['folders'],
    }).then(() => {
      this.setState({requestDeleteFolder: null})
      showNotification('Folder deleted')
      push(`/catalog/${catalogKey}`)
    })
  }

  requestDeleteItem(item) {
    this.setState({requestDeleteItem: item})
  }

  requestDeleteFolder() {
    this.setState({requestDeleteFolder: true})
  }

  render() {
    const {visibleFields, data, folderData, catalogKey, push, match: {params: {folder}}} = this.props
    return (
      <Card style={{minHeight: '50%', marginLeft: '5%', paddingBottom: 20, marginTop: 15, marginBottom: 20}} className="flexContainer">
        {this.deleteItemConfirmationDialog}
        {this.deleteFolderConfirmationDialog}
        <CardTitle title={t(get(folderData, 'folder.name'))} style={{display: 'flex'}}>
          {this.configurationMenu}
        </CardTitle>
        <Table selectable={false}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow>
              {visibleFields.map(f =>
                <TableHeaderColumn key={f}>{humanize(f)}</TableHeaderColumn>
              )}
              <TableHeaderColumn />
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {map(data.items, item => (<TableRow key={item.id} hoverable>
              {map(visibleFields, f => <TableRowColumn key={f}>{t(item.data[f])}</TableRowColumn>)}
              <TableRowColumn style={{textAlign: 'right'}}>
                <IconButton
                  onTouchTap={() => push(`/catalog/${catalogKey}/folder/${folder}/product/${item.id}`)}
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
      </Card>
    );
  }
}

const items = gql`
  query items($folder: ID!) {
    items(folder: $folder) {
      id
      data
    }
  }
`
const folder = gql`
  query items($id: ID!) {
    folder(id: $id) { id name }
  }
`

const deleteItem = gql`
  mutation deleteItem($id: ID!) {
    deleteItem(id: $id)
  }
`

const deleteFolder = gql`
  mutation deleteFolder($id: ID!) {
    deleteFolder(id: $id)
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
  graphql(folder, {
    options: ({match}) => ({ variables: { id: match.params.folder } }),
    name: 'folderData'
  }),
  graphql(items, {
    options: ({match}) => ({ variables: { folder: match.params.folder } }),
  }),
  graphql(deleteItem, {name: 'deleteItem'}),
  graphql(deleteFolder, {name: 'deleteFolder'}),
  connect(mapStateToProps, {toggleField, push, showNotification})
)

export default enhance(List)
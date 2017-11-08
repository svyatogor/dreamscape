import React from 'react'
import {FloatingActionButton, Paper} from 'material-ui'
import ContentAdd from 'material-ui/svg-icons/content/add'
import {connect} from 'react-redux'
import _, {get, isEmpty, isEqual, filter, map, find, sortBy, findIndex, isNumber, without} from 'lodash'
import {List} from 'material-ui'
import {push} from 'react-router-redux'
import {compose} from 'recompose'
import {graphql, gql} from 'react-apollo'
import {DragDropContext} from 'react-dnd'
import Folder from '../site_tree_element'
import HTML5Backend from 'react-dnd-html5-backend'
import {showNotification} from '../../actions'
import {t} from '../../common/utils'
import folders from '../../graphql/folders.gql'
import NewFolder from './new_folder'

const folderIcon = <i className="mdi mdi-folder" style={{fontSize: 24, top: 4, color: '#757575'}} />

class Tree extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      folders: []
    }
  }

  move(id, after, d) {
    const collection = this.state.folders
    const self = find(collection, {id})
    if (isNumber(after)) {
      const otherItems = without(collection, self)
      this.setState({pages: [...otherItems, {...self, position: after}]})
      return
    }
    let otherItems = collection.filter(page => page.parent !== self.parent)
    let sortedItems = _(collection)
      .filter({parent: self.parent})
      .sortBy('position')
      .map((page, i) => ({...page, position: i}))
      .value()
    const other = findIndex(sortedItems, {id: after})
    sortedItems = sortedItems.map(item => {
      if (item.id === self.id) {
        return {...item, position: other}
      } else if (item.position === other) {
        return {...item, position: item.position + (d < 0 ? 1 : -1)}
      } else if (item.position > other) {
        return {...item, position: item.position + 1}
      } else {
        return item
      }
    })
    this.setState({folders: [...otherItems, ...sortedItems]})
  }

  commitMove(parent) {
    const items = sortBy(filter(this.state.folders, {parent}), 'position')
    const optimisticResponse = items.map(item => ({
      ...item,
      parent: item.parent ? {
        __typename: 'Folder',
        id: item.parent
      } : null
    }))
    return this.props.saveOrder({
      variables: {folders: map(items, 'id')},
      optimisticResponse: {
        __typename: 'Mutation',
        orderFolders: optimisticResponse,
      },
    })
      .then(({data}) => {
        this.props.showNotification("Order saved")
      })
      .catch((error) => {
        this.props.showNotification("Ooops, could not save new page order")
      })
  }

  componentWillReceiveProps({folders}) {
    if (folders) {
      this.setState({folders})
    }
  }

  renderFolder(folder) {
    let props = {}
    const subFolders = filter(this.state.folders, ({parent}) => parent === folder.id)
    if (!isEmpty(subFolders)) {
      props = {
        // primaryTogglesNestedList: true,
        // initiallyOpen: this.props.fullPath.includes(folder.id),
        nestedItems: map(sortBy(subFolders, 'position'), this.renderFolder.bind(this)),
      }
    }
    return (
      <Folder
        leftIcon={folderIcon}
        primaryText={t(folder.name, this.props.locale)}
        key={folder.id}
        id={folder.id}
        position={folder.position}
        parent={folder.parent}
        move={this.move.bind(this)}
        commitMove={this.commitMove.bind(this)}
        onTouchTap={() => this.props.push(`/catalog/${this.props.catalog}/folder/${folder.id}`)}
        {...props}
      />
    )
  }

  render() {
    const folders = sortBy(this.state.folders.filter(f => !f.parent), 'position')
    return (
      <List>
        {folders.map(folder => this.renderFolder(folder))}
      </List>
    )
  }

  onClickNode(node) {
    this.setState({
      active: node,
    })
  }

  shouldComponentUpdate(newProps, newState) {
    return !isEqual(this.props, newProps) || !isEqual(this.state, newState)
  }
}

const mapStateToProps = ({app: {locale}}, {data}) => {
  return {
    folders: get(data, 'folders', []),
    locale
  }
}


const saveOrder = gql`
mutation orderFolders($folders: [ID!]!) {
  orderFolders(folders: $folders) {
    id
    parent
    position
    name
  }
}
`

const enhance = compose(
  graphql(folders, {
    options: ({catalog}) => ({variables: {catalog}})
  }),
  graphql(saveOrder, {name: 'saveOrder'}),
  connect(mapStateToProps, {push, showNotification}),
  DragDropContext(HTML5Backend)
)
const ConnectedTree = enhance(Tree)

class TreeWrapper extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const {match, history, catalog, children} = this.props
    const childrenWithParams = React.Children.map(children, child => {
      return React.cloneElement(child, {match})
    })
    return (
      <div style={{display: 'flex', width: '100%'}}>
        {this.state.addFolder &&
          <NewFolder
            parent={match.params.folder}
            catalog={catalog}
            onFolderSaved={() => this.setState({addFolder: false})} />
        }
        <div style={{flex: 3, minWidth: 300}}>
          <ConnectedTree activePage={match.params.folder} catalog={catalog} />
        </div>
        <div style={{flex: 15}}>
          {childrenWithParams}
        </div>
        <div style={{flex: '1 4 5%', minWidth: 100}}></div>

        <div style={{position: 'fixed', bottom: 20, right: 20}}>
          <FloatingActionButton secondary
            onTouchTap={() => this.setState({addFolder: true})}
          >
            <i className="mdi mdi-folder-plus" style={{fontSize: '24px'}} />
          </FloatingActionButton>
          <FloatingActionButton secondary
            onTouchTap={() => history.push(`/catalog/${catalog}/folder/${match.params.folder}/product/new`)}
            style={{marginLeft: 10}}
          >
            <ContentAdd />
          </FloatingActionButton>
        </div>
      </div>
    )
  }
}

export {TreeWrapper}

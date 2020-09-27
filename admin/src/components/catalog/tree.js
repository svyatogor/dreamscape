import React from 'react'
import {FloatingActionButton} from 'material-ui'
import ContentAdd from 'material-ui/svg-icons/content/add'
import {connect} from 'react-redux'
import _, {get, isEmpty, isEqual, filter, map, find, sortBy, findIndex} from 'lodash'
import {List} from 'material-ui'
import {push} from 'react-router-redux'
import {compose} from 'recompose'
import {graphql, gql} from 'react-apollo'
import Folder from '../site_tree_element'
import {showNotification} from '../../actions'
import {t} from '../../common/utils'
import {loader} from 'graphql.macro'
import NewFolder from './new_folder'

const folders = loader('../../graphql/folders.gql')

const folderIcon = <i className="mdi mdi-folder" style={{fontSize: 24, top: 4, color: '#757575'}} />

class Tree extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      folders: []
    }
  }

  hover(id) {
    this.setState({hover: id})
  }

  move(id, targetId, action) {
    if (id === targetId) {
      return
    }
    const collection = this.state.folders
    const target = find(collection, {id: targetId})
    const self = find(collection, {id})
    let {parent} = target
    let sortedItems
    if (action === 'move') {
      parent = target.id
      sortedItems = [...filter(collection, {parent: target}), self]
    } else {
      let sortableItems = _(collection)
        .reject({id})
        .filter({parent})
        .sortBy('position')
        .value()
      const i = findIndex(sortableItems, {id: targetId})
      sortedItems = action === 'before' ?
      [...sortableItems.slice(0, i), {...self, parent}, target, ...sortableItems.slice(i+1, sortableItems.length)] :
      [...sortableItems.slice(0, i), target, {...self, parent}, ...sortableItems.slice(i+1, sortableItems.length)]
      sortedItems = map(sortedItems, (item, position) => ({...item, position}))
    }

    this.setState({hover: null})

    return this.props.saveOrder({
      variables: {folders: map(sortedItems, 'id'), parent},
      optimisticResponse: {
        __typename: 'Mutation',
        orderFolders: sortedItems,
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
    const textStyle = folder.hidden ? {textDecoration: 'line-through', color: '#888'} : {}
    return (
      <Folder
        leftIcon={folderIcon}
        primaryText={t(folder.name, this.props.locale)}
        innerDivStyle={textStyle}
        key={folder.id}
        id={folder.id}
        hover={folder.id === this.state.hover}
        position={folder.position}
        parent={folder.parent}
        onMove={this.move.bind(this)}
        onHover={this.hover.bind(this)}
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
mutation orderFolders($folders: [ID!]!, $parent: ID) {
  orderFolders(folders: $folders, parent: $parent) {
    id
    parent
    position
    name
    hidden
  }
}
`

const enhance = compose(
  graphql(folders, {
    options: ({catalog}) => ({variables: {catalog}})
  }),
  graphql(saveOrder, {name: 'saveOrder'}),
  connect(mapStateToProps, {push, showNotification}),
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
        <NewFolder
          parent={match.params.folder}
          open={this.state.addFolder || false}
          catalog={catalog}
          onFolderSaved={() => this.setState({addFolder: false})}
          onClose={() => this.setState({addFolder: false})}
        />
        <div style={{flex: 3, minWidth: 300}}>
          <ConnectedTree activePage={match.params.folder} catalog={catalog} />
        </div>
        <div style={{flex: 15}}>
          {childrenWithParams}
        </div>
        <div style={{flex: '1 4 5%', minWidth: 100}}></div>

        <div style={{position: 'fixed', bottom: 20, right: 20}}>
          {match.params.folder && <FloatingActionButton secondary
            onTouchTap={() => this.setState({addFolder: true})}
          >
            <i className="mdi mdi-folder-plus" style={{fontSize: '24px'}} />
          </FloatingActionButton>}
          {match.params.folder && <FloatingActionButton secondary
            onTouchTap={() => history.push(`/catalog/${catalog}/folder/${match.params.folder}/item/new`)}
            style={{marginLeft: 10}}
          >
            <ContentAdd />
          </FloatingActionButton>}
          {!match.params.folder && <FloatingActionButton secondary
            onTouchTap={() => history.push(`/catalog/${catalog}/item/new`)}
            style={{marginLeft: 10}}
          >
            <ContentAdd />
          </FloatingActionButton>}
        </div>
      </div>
    )
  }
}

export {TreeWrapper}

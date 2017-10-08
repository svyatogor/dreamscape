import React from 'react'
import {FloatingActionButton, Paper} from 'material-ui'
import ContentAdd from 'material-ui/svg-icons/content/add'
import {connect} from 'react-redux'
import _, {isEmpty, isEqual, filter, map, find, sortBy, findIndex, isNumber, without} from 'lodash'
import {List} from 'material-ui'
import {push} from 'react-router-redux'
import {get} from 'lodash'
import {compose} from 'recompose'
import {graphql, gql} from 'react-apollo'
import {DragDropContext} from 'react-dnd'
import Folder from '../site_tree_element'
import HTML5Backend from 'react-dnd-html5-backend'
import {showNotification} from '../../actions'
import {t} from '../../common/utils'
import folders from '../../graphql/folders.gql'

const folderIcon = <i className="mdi mdi-folder" style={{fontSize: 24, top: 4, color: '#757575'}} />

class Tree extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      folders: []
    }
  }

  move(id, after, d) {
    const self = this.state.pages.find(page => page.id === id)
    if (isNumber(after)) {
      const otherPages = without(this.state.pages, self)
      this.setState({pages: [...otherPages, {...self, position: after}]})
      return
    }
    let otherPages = this.state.pages.filter(page => page.parent !== self.parent)
    let pages = _(this.state.pages)
      .filter({parent: self.parent})
      .sortBy('position')
      .map((page, i) => ({...page, position: i}))
      .value()
    const other = findIndex(pages, {id: after})
    pages = pages.map(page => {
      if (page.id === self.id) {
        return {...page, position: other}
      } else if (page.position === other) {
        return {...page, position: page.position + (d < 0 ? 1 : -1)}
      } else if (page.position > other) {
        return {...page, position: page.position + 1}
      } else {
        return page
      }
    })
    this.setState({pages: [...otherPages, ...pages]})
  }

  commitMove(parent) {
    const pages = sortBy(filter(this.state.pages, {parent}), 'position')
    const optimisticResponse = pages.map(page => ({
      ...page,
      parent: page.parent ? {
        __typename: 'Page',
        id: page.parent
      } : null
    }))
    return this.props.saveOrder({
      variables: {pages: map(pages, 'id')},
      optimisticResponse: {
        __typename: 'Mutation',
        orderPages: optimisticResponse,
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

const enhance = compose(
  graphql(folders, {
    options: ({catalog}) => ({variables: {catalog}})
  }),
  connect(mapStateToProps, {push, showNotification}),
  DragDropContext(HTML5Backend)
)
const ConnectedTree = enhance(Tree)

const withTree = (Component, catalog, options = {}) => {
  return ({match, history}) => {
    return (
      <div style={{display: 'flex', width: '100%'}}>
        <div style={{flex: 3, minWidth: 300}}>
          <ConnectedTree activePage={match.params.folderId} catalog={catalog} />
        </div>
        <div style={{flex: 15}}>
          <Component match={match} {...options} />
        </div>
        <div style={{flex: '1 4 5%', minWidth: 100}}></div>

        <div style={{position: 'fixed', bottom: 20, right: 20}}>
          <FloatingActionButton secondary
            onTouchTap={() => history.push(`/catalog/${catalog}/folder/${match.params.folder}/product/new`)}
          >
            <ContentAdd />
          </FloatingActionButton>
        </div>
      </div>
    )
  }
}

export {withTree}

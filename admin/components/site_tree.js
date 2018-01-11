import React from 'react'
import {connect} from 'react-redux'
import _, {isEmpty, isEqual, filter, map, find, sortBy, findIndex} from 'lodash'
import {List} from 'material-ui'
import {push} from 'react-router-redux'
import {get} from 'lodash'
import {compose} from 'recompose'
import {graphql, gql} from 'react-apollo'
import SiteTreeElement from './site_tree_element'
import {showNotification} from '../actions'
import {t} from '../common/utils'
import pages from '../graphql/pages.gql'

const documentIcon = <i className="mdi mdi-file-document" style={{fontSize: 24, top: 4, color: '#757575'}} />
const inactiveDocumentIcon = <i className="mdi mdi-file-document" style={{fontSize: 24, top: 4, color: '#757575', opacity: 0.7}} />

class Tree extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  move(id, targetId, action) {
    if (id === targetId) {
      return
    }
    const collection = this.state.pages
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
      variables: {pages: map(sortedItems, 'id'), parent},
      optimisticResponse: {
        __typename: 'Mutation',
        orderPages: sortedItems.map(page => ({
          ...page,
          parent: page.parent ? {
            __typename: 'Page',
            id: page.parent
          } : null
        })),
      },
    })
      .then(({data}) => {
        this.props.showNotification("Order saved")
      })
      .catch((error) => {
        this.props.showNotification("Ooops, could not save new page order")
      })
  }

  hover(id) {
    this.setState({hover: id})
  }

  componentWillReceiveProps({pages}) {
    if (pages) {
      this.setState({pages})
    }
  }

  renderPage(page) {
    let props = {}
    const subPages = filter(this.state.pages, ({parent}) => parent === page.id)
    if (!isEmpty(subPages)) {
      props = {
        // primaryTogglesNestedList: true,
        initiallyOpen: this.props.fullPath.includes(page.id),
        nestedItems: map(sortBy(subPages, 'position'), this.renderPage.bind(this)),
      }
    }
    return (
      <SiteTreeElement
        leftIcon={page.published ? documentIcon : inactiveDocumentIcon}
        primaryText={t(page.title, this.props.locale)}
        key={page.id}
        id={page.id}
        position={page.position}
        parent={page.parent}
        onMove={this.move.bind(this)}
        onHover={this.hover.bind(this)}
        hover={page.id === this.state.hover}
        style={{color: page.published ?  '#000' : '#888'}}
        onTouchTap={() => this.props.push(`/site/page/${page.id}`)}
        {...props}
      />
    )
  }

  render() {
    if (this.props.data.loading) {
      return null
    }
    const topPages = sortBy(this.state.pages.filter(page => !page.parent), 'position')
    return (
        <List>
          {topPages.map((page, id) => this.renderPage(page, id))}
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

const buildFullPath = (pages, page, path = []) => {
  if (!page) {
    return []
  }
  if (page.parent) {
    return buildFullPath(pages, find(pages, {id: page.parent}), [...path, page.id])
  } else {
    return [...path, page.id]
  }
}

const mapStateToProps = ({app: {locale}, routing}, {data, activePage}) => {
  const pages = map(data.pages, page => ({...page, parent: get(page.parent, 'id')}))
  const page = find(pages, {id: activePage})
  return {
    pages,
    locale,
    routing,
    fullPath: buildFullPath(pages, page)
  }
}

const saveOrder = gql`
  mutation orderPges($pages: [ID!]!, $parent: ID) {
    orderPages(pages: $pages, parent: $parent) {
      id
      title
      published
      position
      parent {
        id
      }
    }
  }
`

const enhance = compose(
  graphql(pages),
  graphql(saveOrder, {name: 'saveOrder'}),
  connect(mapStateToProps, {push, showNotification}),
)
export default enhance(Tree)

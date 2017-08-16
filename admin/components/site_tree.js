import React from 'react'
import {connect} from 'react-redux'
import _, {isEmpty, isEqual, filter, map, find, sortBy, findIndex, isNumber, without} from 'lodash'
import {List} from 'material-ui'
import {push} from 'react-router-redux'
import {get} from 'lodash'
import {compose} from 'recompose'
import {graphql, gql} from 'react-apollo'
import {DragDropContext} from 'react-dnd'
import SiteTreeElement from './site_tree_element'
import HTML5Backend from 'react-dnd-html5-backend'
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
      parent: {
        __typename: 'Page',
        id: page.parent
      }
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
        move={this.move.bind(this)}
        commitMove={this.commitMove.bind(this)}
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
    const topPages = sortBy(this.props.pages.filter(page => !page.parent), 'position')
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
  mutation orderPges($pages: [ID!]!) {
    orderPages(pages: $pages) {
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
  DragDropContext(HTML5Backend)
)
export default enhance(Tree)

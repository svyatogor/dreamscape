import React from 'react'
import {connect} from 'react-redux'
import {isEmpty, isEqual, filter, map, find} from 'lodash'
import {NavLink} from 'react-router-dom'
import {ListItem, List, Paper} from 'material-ui'
import {push} from 'react-router-redux'
import {get} from 'lodash'
import cx from 'classnames'
import {compose} from 'recompose'
import {gql, graphql} from 'react-apollo'
import 'react-ui-tree/dist/react-ui-tree.css'

const documentIcon = <i className="mdi mdi-file-document" style={{fontSize: 24, top: 4, color: '#757575'}} />
const inactiveDocumentIcon = <i className="mdi mdi-file-document" style={{fontSize: 24, top: 4, color: '#757575', opacity: 0.7}} />
class Tree extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  renderPage(page) {
    let props = {}
    const subPages = filter(this.props.pages, ({parent}) => parent === page.id)
    if (!isEmpty(subPages)) {
      props = {
        // primaryTogglesNestedList: true,
        initiallyOpen: this.props.fullPath.includes(page.id),
        nestedItems: map(subPages, this.renderPage.bind(this)),
      }
    }
    return (
      <ListItem
        leftIcon={page.published ? documentIcon : inactiveDocumentIcon}
        primaryText={page.title[0].value}
        key={page.id}
        {...props}
        style={{color: page.published ?  '#000' : '#888'}}
        onTouchTap={() => this.props.push(`/site/page/${page.id}`)}
      />
    )
  }

  render() {
    if (this.props.data.loading) {
      return null
    }
    const topPages = this.props.pages.filter(page => !page.parent)
    return (
        <List>
          {topPages.map((page, id) => this.renderPage(page, id))}
        </List>
    )
  }

  renderNode(node) {
    return (
      <span
        className={cx('node', {
          'is-active': node === this.state.active
        })}
      >
        <ListItem primaryText={node.name} onTouchTap={() => this.setState({active: node})}  />
      </span>
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

const buildTree = (pages, parent) => {
  return pages.filter(page => page.parent === parent).map(page => {
    const children = buildTree(pages, page.id)
    return {
      ...page,
      // leaf: isEmpty(children),
      children,
      collapsed: !isEmpty(children),
    }
  })
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

const mapStateToProps = ({site: {locale}, routing}, {data, activePage}) => {
  const pages = map(data.pages, page => ({...page, parent: get(page.parent, 'id')}))
  const page = find(pages, {id: activePage})
  return {
    pages,
    locale,
    routing,
    fullPath: buildFullPath(pages, page)
  }
}

const listAllPages = gql`
  query {
    pages {
      id
      title {
        locale
        value
      }
      published
      parent {
        id
      }
    }
  }
`

const enhance = compose(
  graphql(listAllPages),
  connect(mapStateToProps, {push}),
)
export default enhance(Tree)

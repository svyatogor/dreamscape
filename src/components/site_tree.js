import React from 'react'
import {connect} from 'react-redux'
import {isEmpty, isEqual, filter, map, find} from 'lodash'
import {NavLink} from 'react-router-dom'
import {ListItem, List, Paper} from 'material-ui'
import {push} from 'react-router-redux'
import cx from 'classnames'
import 'react-ui-tree/dist/react-ui-tree.css'

const documentIcon = <i className="mdi mdi-file-document" style={{fontSize: 24, top: 4, color: '#757575'}} />
class Tree extends React.Component {
  constructor() {
    super()
    this.state = {}
  }

  renderPage(page) {
    let props = {}
    const subPages = filter(this.props.pages, ({parent_id}) => parent_id === page.id)
    if (!isEmpty(subPages)) {
      props = {
        // primaryTogglesNestedList: true,
        initiallyOpen: this.props.fullPath.includes(page.id),
        nestedItems: map(subPages, this.renderPage.bind(this)),
      }
    }
    return (
      <ListItem
        leftIcon={documentIcon}
        primaryText={page.title[this.props.locale]}
        key={page.id}
        {...props}
        onTouchTap={() => this.props.push(`/site/${page.id}`)}
      />
    )
  }

  render() {
    const topPages = this.props.pages.filter(page => !page.parent_id)
    return (
        <List>
          {topPages.map((page, id) => this.renderPage(page, id))}
        </List>
    )
  }

  renderNode(node) {
    console.log(node);
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
  return pages.filter(page => page.parent_id === parent).map(page => {
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
  if (page.parent_id) {
    return buildFullPath(pages, find(pages, {id: page.parent_id}), [...path, page.id])
  } else {
    return [...path, page.id]
  }
}

const mapStateToProps = ({site: {pages, locale}, routing}, ownProps) => {
  const page = find(pages, {id: Number(ownProps.activePage)})
  return {
    pages,
    locale,
    routing,
    fullPath: buildFullPath(pages, page)
  }
}

export default connect(mapStateToProps, {push})(Tree)

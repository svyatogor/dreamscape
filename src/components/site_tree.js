import React from 'react'
import {connect} from 'react-redux'
import {isEmpty, isEqual} from 'lodash'
import UITree from 'react-ui-tree'
import cx from 'classnames'
import 'react-ui-tree/dist/react-ui-tree.css'

class Tree extends React.Component {
  constructor() {
    super()
    this.state = {}
  }

  render() {
    return (
      <UITree
        paddingLeft={20}
        tree={this.props.tree}
        renderNode={this.renderNode.bind(this)}
      />
    )
  }

  renderNode(node) {
    console.log(node);
    return (
      <span
        className={cx('m-node', {
          'is-active': node === this.state.active
        })}
        onClick={() => this.onClickNode(node)}
      >
        {node.name}
      </span>
    );
  };

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
      leaf: isEmpty(children),
      children,
    }
  })
}

const mapStateToProps = ({site: {pages}}, ownProps) => {
  return {
    tree: buildTree(pages)[0]
  }
}

export default connect(mapStateToProps)(Tree)

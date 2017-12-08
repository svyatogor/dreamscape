import React, {Component} from 'react'
import {DragSource, DropTarget} from 'react-dnd'
import {TableRow} from 'material-ui'
import {compose} from 'recompose'


const collectDrag = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
})

const collectDrop = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver({ shallow: true }),
})


class Row extends Component {
  render() {
    const {
      id,
      connectDragPreview,
      isDragging,
      connectDragSource,
      connectDropTarget,
      isOver,
      canDrop,
      isOverCurrent,
      position,
      parent,
      commitMove,
      hover,
      onMove,
      onHover,
      ...props} = this.props

    const style = {}
    if (isDragging) {
      style.opacity = .5
    }

    if (isOver) {
      style.fontWeight = 'bold'
    }

    return connectDragPreview(connectDropTarget(connectDragSource(
      <tr style={style}>
        {props.children}
      </tr>
    )), {captureDraggingState: true})
  }

  static dragSpec = {
    beginDrag(props) {
      return {id: props.id, position: props.position}
    },

    endDrag(props, monitor) {
      if (monitor.didDrop()) {
        props.onMove(monitor.getDropResult().position)
      }
    },
  }

  static dropSpec = {
    drop: (props, monitor) => {
      if (monitor.didDrop()) {
        return monitor.getDropResult()
      }
      return {id: props.id, position: props.position}
    },
  }
}

export default compose(
  DropTarget('catalog', Row.dropSpec, collectDrop),
  DragSource('catalog', Row.dragSpec, collectDrag)
)(Row)

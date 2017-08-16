import React from 'react'
import {DragSource, DropTarget} from 'react-dnd'
import {ListItem} from 'material-ui'
import {compose} from 'recompose'

const collectDrag = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
  offset: monitor.getClientOffset(),
})

const collectDrop = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
})

class SiteTreeElement extends React.Component {
  render() {
    const {
      id,
      offset,
      connectDragPreview,
      isDragging,
      connectDragSource,
      connectDropTarget,
      isOver,
      canDrop,
      isOverCurrent,
      position,
      parent,
      move,
      commitMove,
      ...props} = this.props

    const style = {}
    if (isDragging) {
      props.nestedItems = []
      props.disabled = true
      style.opacity = .5
    }

    if (isOver || isOverCurrent) {
      props.initiallyOpen = true
      // style.borderBottom = '2px dashed #ccc'
    }

    return connectDragPreview(connectDropTarget(connectDragSource(
      <div style={style}><ListItem {...props} /></div>
    )), {captureDraggingState: true})
  }

  static dragSpec = {
    beginDrag(props) {
      return {id: props.id, originalPosition: props.position, parent: props.parent}
    },

    endDrag(props, monitor) {
      const {id: droppedId, originalPosition, parent} = monitor.getItem()
      if (monitor.didDrop()) {
        props.commitMove(parent)
      } else {
        props.move(droppedId, originalPosition);
      }
    },
  }

  static dropSpec = {
    canDrop(props, monitor) {
      const { parent: draggedParent } = monitor.getItem();
      const { parent: overParent } = props;
      return draggedParent === overParent
    },

    hover(props, monitor) {
      const {y} = monitor.getDifferenceFromInitialOffset()
      const { id: draggedId, parent: draggedParent } = monitor.getItem();
      const { id: overId, parent: overParent } = props;
      if (draggedId !== overId && draggedParent === overParent) {
        props.move(draggedId, overId, y)
      }
    },
  }
}

export default compose(
  DropTarget('page', SiteTreeElement.dropSpec, collectDrop),
  DragSource('page', SiteTreeElement.dragSpec, collectDrag)
)(SiteTreeElement)

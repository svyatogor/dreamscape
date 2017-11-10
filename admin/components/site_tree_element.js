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
  isOver: monitor.isOver({ shallow: true }),
})


const DropDivider = DropTarget('page', {
  drop: props => {
    return {id: props.id, action: props.before ? 'before' : 'after'}
  },
}, collectDrop)((props) => {
  const background = props.isOver ? '#dbdbdb' : 'transparent'
  return props.connectDropTarget(<div style={{
    position: 'absolute',
    width: '100%',
    height: 20,
    background,
    zIndex: 2,
    marginTop: props.before ? -10 : -12
  }} />)
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
      commitMove,
      hover,
      onMove,
      onHover,
      ...props} = this.props

    const style = {}
    if (isDragging) {
      props.nestedItems = []
      props.disabled = true
      style.opacity = .5
    }

    if (isOver) {
      style.fontWeight = 'bold'
    }

    return connectDragPreview(connectDropTarget(connectDragSource(
      <div style={{...style, position: 'relative'}}>
        {<DropDivider id={id} before />}
        <ListItem {...props} />
        {<DropDivider id={id} />}
      </div>
    )), {captureDraggingState: true})
  }

  static dragSpec = {
    beginDrag(props) {
      return {id: props.id, position: props.position, parent: props.parent}
    },

    endDrag(props, monitor) {
      if (monitor.didDrop()) {
        props.onMove(props.id, monitor.getDropResult().id, monitor.getDropResult().action)
        // props.commitMove(parent)
      } else {
        // props.move(droppedId, originalPosition);
      }
    },
  }

  static dropSpec = {
    drop: (props, monitor) => {
      if (monitor.didDrop()) {
        return monitor.getDropResult()
      }
      return {id: props.id, action: 'move'}
    },
  }
}

export default compose(
  DropTarget('page', SiteTreeElement.dropSpec, collectDrop),
  DragSource('page', SiteTreeElement.dragSpec, collectDrag)
)(SiteTreeElement)

import React from 'react'
import {Snackbar} from 'material-ui'
import {connect} from 'react-redux'

const Notification = ({notification}) => {
  if (notification) {
    return <Snackbar
      open={true}
      message={notification}
      autoHideDuration={3000}
    />
  }
  return null
}

export default connect(({app: {notification, notificationId}}) => ({notification, notificationId}))(Notification)
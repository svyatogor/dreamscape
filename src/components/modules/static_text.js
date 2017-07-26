import React from 'react'

class StaticText extends React.Component {
  render() {
    return (<div>
      <textarea id="redactor" />
    </div>)
  }

  componentDidMount() {
    global.$('#redactor').redactor()
  }
}

export default StaticText

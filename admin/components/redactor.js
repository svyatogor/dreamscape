import React from 'react'
import querystring from 'querystring'

export default class extends React.Component {
  render() {
    return <textarea id="redactor" defaultValue={this.props.value} />
  }

  shouldComponentUpdate() {
    return false
  }

  componentWillMount() {
    this.value = this.props.value
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value && newProps.value !== this.value) {
      global.$('#redactor').redactor('code.set', newProps.value)
      this.value = newProps.value
    }
  }

  componentDidMount() {
    const onChange = this.props.onChange.bind(this)
    const self = this
    const {parent} = this.props
    global.$('#redactor').redactor({
      minHeight: 300,
      plugins: ['source', 'table', 'fullscreen', 'fontsize', 'fontcolor', 'fontfamily', 'imagemanager'],
      codemirror: {
          lineNumbers: true,
          mode: 'htmlmixed',
          indentUnit: 4
      },
      imageUpload: `${process.env.REACT_APP_BACKEND}/upload-image?${querystring.stringify(parent)}`,
      imageManagerJson: `${process.env.REACT_APP_BACKEND}/images?${querystring.stringify(parent)}`,
      callbacks: {
        change: function() {
          self.value = this.code.get()
          onChange(self.value)
        },
      },
    })
  }
}
import React from 'react'

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
    global.$('#redactor').redactor({
      minHeight: 300,
      plugins: ['source', 'table', 'fullscreen', 'fontsize', 'fontcolor', 'fontfamily'],
      codemirror: {
          lineNumbers: true,
          mode: 'htmlmixed',
          indentUnit: 4
      },
      callbacks: {
        change: function() {
          self.value = this.code.get()
          onChange(self.value)
        },
      },
    })
  }
}
import React from 'react'
import CodeMirror from "codemirror/lib/codemirror.js"
import "codemirror/lib/codemirror.css"
import "codemirror/mode/htmlmixed/htmlmixed.js"

class StaticText extends React.Component {
  render() {
    return (<div>
      <textarea id="redactor" defaultValue={this.props.content} />
    </div>)
  }

  onChange(value) {
    console.log(value)
  }

  componentDidMount() {
    const onChange = this.onChange.bind(this)
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
          onChange(this.code.get())
        },
      },
    })
  }
}

export default StaticText

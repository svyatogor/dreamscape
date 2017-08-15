import React from 'react'
import querystring from 'querystring'
import {graphql} from 'react-apollo'
import attachImage from '../graphql/attachImage.gql'

class Redactor extends React.Component {
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

  onUpload(json) {
    this.props.mutate({variables: {
      type: this.props.parent.type,
      id: this.props.parent.id,
      url: json.url,
    }})
  }

  componentDidMount() {
    const onChange = this.props.onChange.bind(this)
    const onUpload = this.onUpload.bind(this)
    const self = this
    const {parent} = this.props
    global.$('#redactor').redactor({
      minHeight: this.props.minHeight || 300,
      maxHeight: this.props.maxHeight || 999999,
      plugins: ['source', 'table', 'fullscreen', 'fontsize', 'fontcolor', 'fontfamily', 'imagemanager'],
      codemirror: {
          lineNumbers: true,
          mode: 'htmlmixed',
          indentUnit: 4
      },
      s3: `/admin/api/sign-s3`,
      imageUpload: true,
      imageManagerJson: `/admin/api/images?${querystring.stringify(parent)}`,
      imageResizable: true,
      imagePosition: true,
      callbacks: {
        change: function() {
          self.value = this.code.get()
          onChange(self.value)
        },
        imageUpload: function(_, json) {
          onUpload(json)
        }
      },
    })
  }
}

const ConnectedRedactor = graphql(attachImage)(Redactor)

const RedactorField = (props) => {
    const {input: {value, onChange}, meta, ...otherProps} = props
    return <ConnectedRedactor value={value} onChange={(v) => onChange(v)} {...otherProps} />
}

export {ConnectedRedactor as default, RedactorField}

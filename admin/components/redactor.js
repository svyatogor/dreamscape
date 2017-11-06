import React from 'react'
import querystring from 'querystring'
import {graphql} from 'react-apollo'
import attachImage from '../graphql/attachImage.gql'

class Redactor extends React.Component {
  static id = 0

  constructor(props) {
    super(props)
    this.id = "redactor-" + Redactor.id
    Redactor.id++
  }

  render() {
    console.log(this.props);
    return <textarea id={this.id} defaultValue={this.props.value} />
  }

  shouldComponentUpdate() {
    return false
  }

  componentWillMount() {
    this.value = this.props.value
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value && newProps.value !== this.value) {
      global.$('#' + this.id).redactor('code.set', newProps.value)
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
    global.$('#' + this.id).redactor({
      minHeight: this.props.minHeight || 300,
      maxHeight: this.props.maxHeight || 300,
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
    const {input: {value, onChange}, meta, label, ...otherProps} = props
    return (
      <div>
        {label && <label>{label}</label>}
        <ConnectedRedactor value={value} onChange={(v) => onChange(v)} {...otherProps} />
      </div>
    )
}

export {ConnectedRedactor as default, RedactorField}

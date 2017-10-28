import React from 'react'
import {graphql, gql} from 'react-apollo'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {RaisedButton, List, Subheader, ListItem, IconButton, TextField, Dialog, FlatButton} from 'material-ui'
import ActionDelete from 'material-ui/svg-icons/action/delete'
import {isEqual, last, omit, isNil, remove} from 'lodash'
import {t} from '../../common/utils'
import DropzoneS3Uploader from 'react-dropzone-s3-uploader'
import common from '../../common.scss'
import {showNotification} from '../../actions'

const icons = {
  xls: 'file-excel',
  xlsx: 'file-excel',
  doc: 'file-word',
  docx: 'file-word',
  pdf: 'file-pdf',
  ppt: 'file-powerpoint',
  pptx: 'file-powerpoint',
  png: 'file-image',
  jpg: 'file-image',
  jpeg: 'file-image',
  gif: 'file-image',
  tiff: 'file-image',
  zip: 'zip-box',
  default: 'file',
}

class FileList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
    };
  }

  addFile({file, fileKey}) {
    console.log('file =>', file);
    const files = [
      ...this.state.files,
      {
        originalName: file.name,
        displayName: file.name,
        size: file.size,
        type: last(file.name.split('.')),
        url: fileKey,
      }
    ]
    this.setState({files})
  }

  editDialog() {
    const {editFile, files, newName} = this.state
    const file = this.state.files[editFile]
    const actions = [
      <FlatButton
        label="Cancel"
        primary
        onClick={() => this.setState({editFile: null})}
      />,
      <FlatButton
        label="Save"
        primary
        onClick={() => {
          const updatedFiles = [...files]
          updatedFiles[editFile].displayName = newName
          this.setState({editFile: null, files: updatedFiles})
        }}
      />,
      <FlatButton
        label="Delete"
        secondary
        style={{float: 'left'}}
        onClick={() => {
          this.setState({files: remove(files, (_, idx) => idx !== editFile), editFile: null})
        }}
      />,
    ]
    return <Dialog
      title="Edit file"
      actions={actions}
      modal={false}
      open={!isNil(editFile)}
      onRequestClose={() => this.setState({editFile: null})}
    >
      {file &&
        <TextField
          floatingLabelText="Display name"
          value={newName}
          fullWidth
          onChange={(e, newName) => this.setState({newName})}
        />
      }
    </Dialog>
  }

  render() {
    if (this.props.data.loading) {
      return null
    }
    console.log(this.props.data);
    const {locale} = this.props
    return (<div style={{paddingRight: 20}}>
      {this.editDialog()}
      <List>
        {this.state.files.map((file, idx) =>
          <ListItem
            key={idx}
            leftIcon={<i style={{paddingTop: 5, fontSize: 24}} className={["mdi", `mdi-${icons[file.type] || icons.default}`].join(' ')} />}
            rightIconButton={<IconButton
              iconClassName="mdi mdi-cloud-download"
              href={`https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${file.url}`}
            />}
            primaryText={file.displayName}
            onClick={(e) => {
              if (e.nativeEvent.target.className.indexOf('mdi') >= 0) {
                return
              }
              this.setState({editFile: idx, newName: file.displayName})
            }}
          />
        )}
      </List>
      <DropzoneS3Uploader
        style={{width: '100%', border: '1px dashed #ccc', backgroundColor: '#f8f8f8'}}
        onFinish={params => this.addFile(params)}
        s3Url={`https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com`}
        maxSize={1024 * 1024 * 50}
        upload={{
          signingUrl: '/admin/api/s3/sign',
          signingUrlWithCredentials: true,
        }}
        passChildrenProps={false}
      >
        <div className="emptyBlock" style={{fontSize: 18, lineHeight: '200px'}}>Drop a file here</div>
      </DropzoneS3Uploader>
      <div className={common.formActions}>
        <RaisedButton label="Save" primary={true} type="submit" onTouchTap={() => this.save()} />
      </div>
    </div>)
  }

  save() {
    const input = {
      id: this.props.data.fileList.id,
      files: this.state.files,
    }
    const {locale} = this.props
    this.props.mutate({variables: {input, locale}, refetchQueries: ['fileList']}).then(() =>
      this.props.showNotification("File list saved")
    )
  }

  componentWillUpdate(newProps) {
    if (!isEqual(this.props.data.fileList, newProps.data.fileList) || newProps.locale !== this.props.locale) {
      const files = newProps.data.fileList.files.map(file => (
        {
          ...omit(file, '__typename'),
          displayName: t(file.displayName, newProps.locale),
        }
      ))
      this.setState({files})
    }
  }
}

const fileList = gql`
  query fileList($id: ID!) {
    fileList(id: $id) {
      id
      template
      files {
        originalName
        displayName
        size
        type
        url
      }
    }
  }
`

const upsertFileList = gql`
  mutation upsertFileList($input: FileListInput!, $locale: String!) {
    upsertFileList(input: $input, locale: $locale) {
      id
      template
      files {
        originalName
        displayName
        size
        type
        url
      }
    }
  }
`

const mapStateToProps = ({app: {locale}}) => ({
  locale
})

const enhance = compose(
  connect(mapStateToProps, {showNotification}),
  graphql(fileList),
  graphql(upsertFileList),
)
export default enhance(FileList)

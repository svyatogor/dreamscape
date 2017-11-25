import React, {Component} from 'react'
import {map, get, isEmpty, mapValues, sortBy} from 'lodash'
import {humanize} from 'inflection'
import {reduxForm, Field, SubmissionError, getFormValues} from 'redux-form'
import {graphql, gql} from 'react-apollo'
import {compose, branch} from 'recompose'
import {connect} from 'react-redux'
import {Paper, RaisedButton, MenuItem} from 'material-ui'
import {
  TextField,
  Toggle,
  SelectField,
} from 'redux-form-material-ui'
import {push} from 'react-router-redux'
import DropzoneS3Uploader from 'react-dropzone-s3-uploader'
import {t} from '../../common/utils'
import {showNotification} from '../../actions'
import {RedactorField as Redactor} from '../redactor'
import common from '../../common.scss'

class ItemEditor extends Component {
  onSubmit(data) {
    const {match: {params: {folder}}, locale} = this.props
    return this.props.mutate({variables: {
      id: data.id,
      data,
      locale,
      folder,
    }, refetchQueries: ['items']})
      .then(({data}) => {
        this.props.showNotification("Item saved")
        this.props.push(`..`)
      })
      .catch((error) => {
        throw new SubmissionError(error.graphQLErrors[0].errors)
      })
  }

  render() {
    const {handleSubmit, pristine, submitting, locale, catalog} = this.props
    return (
      <Paper style={{minHeight: '50%', marginLeft: '5%', paddingBottom: 20, marginTop: 15, marginBottom: 20}} className="flexContainer">
        <div style={{flex: 1, paddingLeft: 70, marginBottom: 20}}>
          <h1 style={{marginBottom: 20}}>Title</h1>
          <form onSubmit={handleSubmit((data) => this.onSubmit(data))} className="wide-form">
            {map(sortBy(mapValues(catalog.fields, (v, key) => ({...v, key})), 'position'), field => {
              const renderer = `${field.type}Render`
              if (this[renderer]) {
                return this[renderer](field.key, field)
              }
            })}
            <div className={common.formActions}>
              <RaisedButton label="Save" primary={true} disabled={pristine || submitting} type="submit" />
            </div>
          </form>
        </div>
      </Paper>
    )
  }

  stringRender(key, field) {
    return (
      <Field
        name={key}
        key={key}
        component={TextField}
        floatingLabelText={humanize(key)}
        fullWidth floatingLabelFixed
        required={key === this.props.catalog.labelField}
        className={common.formControl}
      />
    )
  }

  moneyRender(key, field) {
    return (
      <Field
        name={key}
        key={key}
        component={TextField}
        floatingLabelText={humanize(key)}
        fullWidth floatingLabelFixed
        required={key === this.props.catalog.labelField}
        className={common.formControl}
      />
    )
  }

  numberRender(key, field) {
    return (
      <Field
        name={key}
        key={key}
        component={TextField}
        floatingLabelText={humanize(key)}
        fullWidth floatingLabelFixed
        required={key === this.props.catalog.labelField}
        className={common.formControl}
      />
    )
  }

  booleanRender(key, field) {
    return <Field key={key} name={key} component={Toggle} label={humanize(key)} className={common.formControl} />
  }

  htmlRender(key, field) {
    return <Field key={key} name={key} component={Redactor} label={humanize(key)} />
  }

  imageRender(key, field) {
    const val = get(this.props.formValues, key)
    return (<div key={key} className={common.formControl}>
      <label htmlFor="">{humanize(key)}</label>
      <DropzoneS3Uploader
        style={{width: '100%', border: '1px dashed #ccc', backgroundColor: '#f8f8f8'}}
        onFinish={params => {
          this.props.change(key, `https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${params.fileKey}`)
        }}
        s3Url={`https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com`}
        maxSize={1024 * 1024 * 5}
        upload={{
          signingUrl: '/admin/api/s3/sign',
          signingUrlWithCredentials: true,
        }}
        passChildrenProps={false}
      >
        {!isEmpty(val) &&
          <img style={{maxWidth: 200, maxHeight: 200}} src={val} alt="" />
        }
        {isEmpty(val) &&
          <div className="emptyBlock" style={{fontSize: 18, lineHeight: '200px'}}>Drop an image here</div>
        }
      </DropzoneS3Uploader>
      {!isEmpty(val) && <i
        className="mdi mdi-close-circle"
        style={{position: 'absolute', top: 0, right: 2, cursor: 'pointer'}}
        onClick={() => this.props.change(key, '')}
      />}
    </div>)
  }

}

const upsertItem = gql`
  mutation upsertItem($id: ID, $folder: ID!, $data: JSON!, $locale: String!) {
    upsertItem(id: $id, folder: $folder, data: $data, locale: $locale) {
      id
      data
    }
  }
`

const mapStateToProps = ({app, ...state}, ownProps) => {
  const item = get(ownProps, 'data.item.data')
  const {catalog} = ownProps
  const initialValues = mapValues(item, (value, field) =>
    get(catalog.fields, [field, 'localized']) ? t(value, app.locale) : value
  )
  initialValues.id = get(ownProps, 'data.item.id')
  return {
    initialValues,
    formValues: {...initialValues, ...getFormValues('item')(state)},
    locale: app.locale
  }
}

const itemGql = gql`
  query item($id: ID!) {
    item(id: $id) {
      id
      data
    }
  }
`

const enhance = compose(
  branch(
    props => !!props.match.params.itemId,
    graphql(itemGql, {
      options: props => ({variables: {id: props.match.params.itemId}})
    }),
  ),
  graphql(upsertItem),
  connect(mapStateToProps, {showNotification, push}),
  reduxForm({form: 'item', enableReinitialize: true, keepDirtyOnReinitialize: true}),
)

export default enhance(ItemEditor)
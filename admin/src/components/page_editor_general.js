import React from 'react'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {reduxForm, Field, SubmissionError, getFormValues} from 'redux-form'
import {RaisedButton, MenuItem} from 'material-ui'
import {
  TextField,
  Toggle,
  SelectField,
} from 'redux-form-material-ui'
import {omit, isEmpty, map, get, reject, pickBy, forEach} from 'lodash'
import {graphql, gql} from 'react-apollo'
import {humanize} from 'inflection'
import DropzoneS3Uploader from 'react-dropzone-s3-uploader'
import {showNotification} from '../actions'
import {loader} from 'graphql.macro'
import {t} from '../common/utils'
import common from '../common.module.scss'
import {RedactorField as Redactor} from '../components/redactor'

const upsertPage = loader('../graphql/upsertPage.gql')
const deletePage = loader('../graphql/deletePage.gql')
const siteQuery = loader('../graphql/site.gql')

const required = value => isEmpty(value) && 'Cannot be blank'

class PageEditorGeneral extends React.Component {
  constructor(p) {
    super(p)
    this.state = {}
  }

  onSubmit(data) {
    const page = omit(data, '__typename', 'sections')
    const newPage = !data.id
    console.log(this.props);
    return this.props.upsertPage({variables: {page, locale: this.props.locale}})
      .then(({data}) => {
        this.props.showNotification("Page saved")
        if (newPage) {
          this.props.push(`/site/page/${data.upsertPage.id}`)
        }
      })
      .catch((error) => {
        throw new SubmissionError(error.graphQLErrors[0].errors)
      })
  }

  get properties() {
    return get(this.props.siteData, ['site', 'layouts', this.props.page.layout, 'properties'], [])
  }

  render() {
    if (this.props.data.loading || this.props.siteData.loading) {
      return null
    }
    const {handleSubmit, pristine, submitting, locale, data: {pages}, siteData: {site}} = this.props
    const layouts = site.layouts
    const validParents = reject(pages, parent => parent.id === get(this.props.page, 'id'))
    return (
      <form onSubmit={handleSubmit((data) => this.onSubmit(data))}>
        <Field name="title" component={TextField} hintText="Page title" floatingLabelText="Title" validate={required} floatingLabelFixed
          fullWidth className={common.formControl} />
        <Field name="slug" component={TextField} hintText="Page URL" floatingLabelText="Slug"
          fullWidth floatingLabelFixed className={common.formControl} />
        <Field
          name="layout"
          component={SelectField}
          hintText="Page base layout"
          floatingLabelText="Layout"
          validate={required}
          className={common.formControl}
          fullWidth
        >
          {map(layouts, ({name}, key) => <MenuItem value={key} primaryText={name} key={key} />)}
        </Field>
        <Field
          name="parent"
          component={SelectField}
          hintText="Parent page"
          floatingLabelText="Parent page"
          className={common.formControl}
          fullWidth
        >
          <MenuItem value={null} primaryText={<i>Root</i>} />
          {map(validParents, ({title, id}) => <MenuItem value={id} primaryText={t(title, locale)} key={id} />)}
        </Field>
        <Field name="published" component={Toggle} label="Published" />
        {map(this.properties, prop => this.renderPropetyField(prop))}
        <div className={common.formActions}>
          <RaisedButton label="Save" primary disabled={pristine || submitting} type="submit" />
          {this.props.page.id &&
            <RaisedButton style={{float: 'right'}} label="Delete" secondary onTouchTap={() => this.deletePage()} />
          }
        </div>
      </form>)
  }

  deletePage() {
    this.props.deletePage({variables: {id: this.props.page.id}})
      .then(() => {
        this.props.showNotification("Page deleted")
        // this.props.push(`/site`)
      })
      .catch((error) => {
        throw new SubmissionError(error.graphQLErrors[0].errors)
      })
  }

  renderPropetyField(prop) {
    const {key} = prop
    if (prop.type === 'text') {
      return (
        <Field
          name={`properties.${key}`}
          key={key}
          component={TextField}
          floatingLabelText={humanize(key)}
          fullWidth floatingLabelFixed
          multiLine
          rows={2}
          className={common.formControl}
        />
      )
    } else if (prop.type === 'html') {
      return (
        <Field
          name={`properties.${key}`}
          key={key}
          component={Redactor}
          label={humanize(key)}
        />
      )
    } else if (prop.type === 'boolean') {
      return <Field key={key} name={`properties.${key}`} component={Toggle} label={humanize(key)} />
    } else if (prop.type === 'image') {
      const val = get(this.props.formValues, ['properties', key])
      return (<div key={key} style={{position: 'relative'}}>
        <label htmlFor="">{humanize(key)}</label>
        <DropzoneS3Uploader
          onFinish={params => {
            this.props.change(`properties.${key}`, `https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${params.fileKey}`)
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
          onClick={() => this.props.change(`properties.${key}`, '')}
        />}
      </div>)
    } else if (prop.type === 'file') {
      const val = get(this.props.formValues, ['properties', key])
      return (<div key={key} style={{position: 'relative'}}>
        <label htmlFor="">{humanize(key)}</label>
        <DropzoneS3Uploader
          onFinish={params => {
            this.props.change(`properties.${key}`, {
              url: params.fileKey,
              name: params.file.name,
              type: params.file.type,
              size: params.file.size,
            })
          }}
          s3Url={`https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com`}
          maxSize={1024 * 1024 * 50}
          upload={{
            signingUrl: '/admin/api/s3/sign',
            signingUrlWithCredentials: true,
            contentDisposition: prop.disposition || 'auto',
          }}
          passChildrenProps={false}
        >
          {!isEmpty(val) &&
            <a href={`https://${process.env.REACT_APP_S3_BUCKET}.s3.amazonaws.com/${val.url}`} style={{display: 'block', height: '100%', textAlign: 'center', lineHeight: '200px'}}>
              <i style={{fontSize: 48}} className="mdi mdi-download" />
            </a>
          }
          {isEmpty(val) &&
            <div className="emptyBlock" style={{fontSize: 18, lineHeight: '200px'}}>Drop an file here</div>
          }
        </DropzoneS3Uploader>
        {!isEmpty(val) && <i
          className="mdi mdi-close-circle"
          style={{position: 'absolute', top: 0, right: 2, cursor: 'pointer'}}
          onClick={() => this.props.change(`properties.${key}`, null)}
        />}
      </div>)
    } else {
      return (
        <Field
          name={`properties.${key}`}
          key={key}
          component={TextField}
          floatingLabelText={humanize(key)}
          fullWidth floatingLabelFixed
          className={common.formControl}
        />
      )
    }

  }
}

const mapStateToProps = ({app, ...state}, {page, siteData}) => {
  const initialValues = {
    ...page,
    parent: get(page.parent, 'id'),
    title: t(page.title, app.locale),
    properties: {...page.properties} || {},
  }

  if (page.layout) {
    const localizedProperties = pickBy(siteData.site.layouts[page.layout].properties, 'localized')
    forEach(localizedProperties, (prop, key) => {
      initialValues.properties[key] = t(get(page.properties, key), app.locale)
    })
  }

  return {
    locale: app.locale,
    formValues: {...initialValues, ...getFormValues('page')(state)},
    initialValues
  }
}

const listAllPages = gql`
  query {
    pages {
      id
      title
    }
  }
`

const enhance = compose(
  graphql(siteQuery, {name: 'siteData'}),
  graphql(listAllPages),
  graphql(upsertPage, {
    options: {
      refetchQueries: [
        'pages',
      ],
    },
    name: 'upsertPage',
  }),
  graphql(deletePage, {
    options: {
      refetchQueries: [
        'pages',
      ],
    },
    name: 'deletePage',
  }),
  connect(mapStateToProps, {showNotification, push}),
  reduxForm({form: 'page', enableReinitialize: true, keepDirtyOnReinitialize: true}),
)

export default enhance(PageEditorGeneral)

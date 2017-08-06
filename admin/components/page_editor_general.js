import React from 'react'
import {compose} from 'recompose'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {reduxForm, Field, SubmissionError} from 'redux-form'
import {RaisedButton, MenuItem} from 'material-ui'
import {
  TextField,
  Toggle,
  SelectField,
} from 'redux-form-material-ui'
import {omit, isEmpty, map, get, reject} from 'lodash'
import {graphql, gql} from 'react-apollo'
import {showNotification} from '../actions'
import upsertPage from '../graphql/upsertPage.gql'
import siteQuery from '../graphql/site.gql'
import {t} from '../common/utils'
import common from '../common.scss'

const required = value => isEmpty(value) && 'Cannot be blank'

class PageEditorGeneral extends React.Component {
  onSubmit(data) {
    const page = omit(data, '__typename', 'sections')
    const newPage = !data.id
    return this.props.mutate({variables: {page, locale: this.props.locale}})
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

  render() {
    if (this.props.data.loading || this.props.siteData.lodash) {
      return null
    }
    const {error, handleSubmit, pristine, submitting, locale, data: {pages}, siteData: {site: {layouts}}} = this.props
    const validParents = reject(pages, parent => parent.id === get(this.props.page, 'id'))
    return (
      <form onSubmit={handleSubmit((data) => this.onSubmit(data))}>
        <Field name="title" component={TextField} hintText="Page title" floatingLabelText="Title" validate={required} floatingLabelFixed
          fullWidth className={common.formControl} />
        <Field name="linkText" component={TextField} hintText="How page appears in the menus" floatingLabelText="Link text"
          fullWidth floatingLabelFixed className={common.formControl} />
        <Field name="slug" component={TextField} hintText="Slug is used for the URL" floatingLabelText="Slug"
          fullWidth floatingLabelFixed className={common.formControl} />
        <Field name="description" component={TextField} hintText="SEO description" floatingLabelText="Paragraph about your page"
          fullWidth multiLine={true} rows={2} rowsMax={2} floatingLabelFixed className={common.formControl} />
        <Field name="keywords" component={TextField} hintText="SEO keywords" floatingLabelText="Keywords to be added to the global ones"
          fullWidth multiLine={true} rows={2} rowsMax={2} floatingLabelFixed className={common.formControl} />
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
        <div className={common.formActions}>
          <RaisedButton label="Save" primary={true} disabled={pristine || submitting} type="submit" />
        </div>
        {error}
      </form>)
  }
}

const mapStateToProps = ({site, app}, {page}) => {
  return {
    locale: app.locale,
    layouts: site.layouts,
    initialValues: {
      ...page,
      parent: get(page.parent, 'id'),
      title: t(page.title, app.locale),
      linkText: t(page.linkText, app.locale)
    }
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
    }
  }),
  connect(mapStateToProps, {showNotification, push}),
  reduxForm({form: 'page', enableReinitialize: true, keepDirtyOnReinitialize: true}),
)

export default enhance(PageEditorGeneral)

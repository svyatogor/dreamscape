import express from 'express'
import {get, isEmpty} from 'lodash'
import url from 'url'
import bodyParser from 'body-parser'
import Joi from 'joi'
import {form as  joiToForms} from 'joi-errors-for-forms'
import {mailTransporter} from '../common/mailer'
import {renderRequest} from '../frontend'
import {renderEmail} from '../renderers'
import {builder as joiBuilder} from 'joi-json'

export const contact_form = express()

const defaultSchema =  {
  name: {'@type': 'string', max: 250, required: true},
  email: {'@type': 'email', required: true},
  message: {'@type': 'string', required: true},
}

const schema = (site, type = 'contact') => {
  const schema = get(site, ['forms', type, 'fields'], defaultSchema)
  return Joi.object().keys(joiBuilder().build(schema))
}

contact_form.post('/contact_form', bodyParser.json(), bodyParser.urlencoded({extended: true}), (req, res, next) => {
  const ref = req.get('Referrer')
  let path
  if (!isEmpty(ref)) {
    path = url.parse(ref).pathname
  } else {
    path = '/'
  }

  const {site, body: {contact_form, form}} = req
  const formObject = get(site, ['forms', form])
  const hasSchema = formObject && formObject.fields
  const {value, error} = hasSchema ?
    Joi.validate(contact_form, schema(site, form), {abortEarly: false, stripUnknown: true})
    : {value: req.body}

  const errorPath = req.body.callback_error || path
  const successPath = req.body.callback_success || path
  if (error) {
    renderRequest(errorPath, {req, res, next}, {
      contact_form: {
        ...contact_form,
        errors: joiToForms()(error),
        success: false,
        error,
      }
    })
  } else {
    const template = get(site, ['forms', form, 'template'], 'email')
    renderEmail(req, template, value).then(({body, subject}) => {
      mailTransporter.sendMail({
        from: "noreply@dreamscape.tech",
        // replyTo: {
        //   name: value.name,
        //   address: value.email,
        // },
        to: site.notificationEmail,
        subject,
        html: body,
      }, (err, info) => {
        if (err) {
          renderRequest(errorPath, {req, res, next}, {
            contact_form: {
              ...contact_form,
              success: false,
              error: err,
            }
          })
          console.error(err)
        } else {
          renderRequest(successPath, {req, res, next}, {
            contact_form: {success: true}
          })
        }
      })
    })
  }
})
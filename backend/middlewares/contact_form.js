import express from 'express'
import {isEmpty} from 'lodash'
import url from 'url'
import bodyParser from 'body-parser'
import Joi from 'joi'
import {form as  joiToForms} from 'joi-errors-for-forms'
import {mailTransporter} from '../common/mailer'
import {renderRequest} from '../frontend'
import {renderEmail} from '../renderers'

export const contact_form = express()


const schema = Joi.object().keys({
    name: Joi.string().max(250).required(),
    email: Joi.string().email().required(),
    message: Joi.string().required()
})

contact_form.post('/contact_form', bodyParser.urlencoded({extended: true}), (req, res, next) => {
  const ref = req.get('Referrer')
  let path
  if (!isEmpty(ref)) {
    path = url.parse(ref).pathname
  } else {
    path = '/'
  }

  const {value, error} = Joi.validate(req.body.contact_form, schema, {abortEarly: false, stripUnknown: true})
  const errorPath = req.body.callback_error || path
  const successPath = req.body.callback_success || path
  if (error) {
    renderRequest(errorPath, {req, res, next}, {
      contact_form: {
        ...req.body.contact_form,
        errors: joiToForms()(error),
        success: false,
        error,
      }
    })
  } else {
    renderEmail(req, 'email', value).then(({body, subject}) => {
      mailTransporter.sendMail({
        from: "noreply@dreamscape.tech",
        // replyTo: {
        //   name: value.name,
        //   address: value.email,
        // },
        to: req.site.notificationEmail,
        subject,
        html: body,
      }, (err, info) => {
        if (err) {
          renderRequest(errorPath, {req, res, next}, {
            contact_form: {
              ...req.body.contact_form,
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
import express from 'express'
import {isEmpty} from 'lodash'
import url from 'url'
import bodyParser from 'body-parser'
import Joi from 'joi'
import {form as  joiToForms} from 'joi-errors-for-forms'
import nodemailer from 'nodemailer'
import aws from 'aws-sdk'
import {renderRequest} from '../frontend'
import {renderEmail} from '../renderers'

export const contact_form = express()

const transporter = nodemailer.createTransport({
  SES: new aws.SES({
    apiVersion: '2010-12-01'
  })
})

const schema = Joi.object().keys({
    name: Joi.string().max(250).required(),
    email: Joi.string().email().required(),
    message: Joi.string().required()
})

contact_form.post('/contact_form', bodyParser.urlencoded(), (req, res, next) => {
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
    renderEmail(req, 'email', value).then(html => {
      transporter.sendMail({
        from: "noreply@dreamscape.tech",
        replyTo: {
          name: value.name,
          address: value.email,
        },
        to: req.site.notificationEmail,
        subject: 'Contact form',
        html,
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
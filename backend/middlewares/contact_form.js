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

contact_form.post('/contact_form', bodyParser.json(), bodyParser.urlencoded({extended: true}), async (req, res, next) => {
  const ref = req.get('Referrer')
  let path
  if (!isEmpty(ref)) {
    path = url.parse(ref).pathname
  } else {
    path = '/'
  }

  const {site, body: {contact_form, form}} = req
  const formObject = get(site, ['forms', form])
  const schemaLess = formObject && !formObject.fields
  const {value, error} = !schemaLess ?
    Joi.validate(contact_form, schema(site, form), {abortEarly: false, stripUnknown: true})
    : {value: req.body}
  const errorPath = req.body.callback_error || path
  const successPath = req.body.callback_success || path
  if (error) {
    console.log({
      ...contact_form,
      errors: joiToForms()(error),
      success: false,
      error,
    })
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
    const responseTemplate = get(site, ['forms', form, 'responseTemplate'])
    try {
      const {body, subject} = await renderEmail(req, template, value)
      await new Promise((resolve, reject) => {
        mailTransporter.sendMail({
          from: "noreply@dreamscape.tech",
          // replyTo: {
          //   name: value.name,
          //   address: value.email,
          // },
          to: get(formObject, 'notificationEmail', site.notificationEmail),
          subject,
          textEncoding: 'base64',
          html: body,
        }, (err) => {
            if (err) reject(err)
            else resolve()
        })
      })
      console.log({responseTemplate, emai: value.email})
      if (responseTemplate && value.email) {
        const {body, subject} = await renderEmail(req, responseTemplate, value)
        console.log({subject})
        await new Promise((resolve, reject) => {
          mailTransporter.sendMail({
            from: "noreply@dreamscape.tech",
            to: value.email,
            subject,
            textEncoding: 'base64',
            html: body,
          }, (err) => {
              if (err) reject(err)
              else resolve()
          })
        })
      }

      renderRequest(successPath, {req, res, next}, {
        contact_form: {success: true}
      })
    } catch (err) {
      renderRequest(errorPath, {req, res, next}, {
        contact_form: {
          ...contact_form,
          success: false,
          error: err,
        }
      })
      console.error(err)
    }
  }
})
import express from 'express'
import {isEmpty} from 'lodash'
import url from 'url'
import bodyParser from 'body-parser'
import Joi from 'joi'
import {form as  joiToForms} from 'joi-errors-for-forms'
import {renderRequest} from '../frontend'

export const contact_form = express()

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
  if (error) {
    path = req.body.callback_error || path
    renderRequest(path, {req, res, next}, {
      contact_form: {
        ...req.body.contact_form,
        errors: joiToForms()(error)
      }
    })
  } else {
    path = req.body.callback_success || path
    renderRequest(path, {req, res, next}, {
      flash: {
        notice: req.body.success_message
      }
    })
  }
})
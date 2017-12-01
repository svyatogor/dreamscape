import nodemailer from 'nodemailer'
import aws from 'aws-sdk'

export const mailTransporter = nodemailer.createTransport({
  SES: new aws.SES({
    apiVersion: '2010-12-01'
  })
})
/* eslint-disable */
import nodeMail from 'nodemailer'
import mailConfig from '~/src/configs/mail'
import env from '~/src/configs/env'

const {serverHost, emailFrom, user, pass, port, cc} = mailConfig

const mConfig = {
  host: serverHost,
  port,
  logger: true,
  auth: {
    user: user, // generated ethereal user
    pass: pass, // generated ethereal password
  },
  tls: {rejectUnauthorized: false}
}
const transporter = nodeMail.createTransport(mConfig)

async function sendMail ({to = [], title: subject, text, html, attachments}, needCC = true) {
  if (!(to instanceof Array)) {
    to = [to]
  }
  // 如果是生产环境下发送全体，开发环境下只去发送给开发人员
  if (env !== 'development' && needCC) {
    to = to.concat(cc)
  }
  // 使用set过滤 to
  const totalTo = [...new Set(to)]
  for (let i = 0; i < totalTo.length; i += 10) {
    // 每次只给10个人发送，一次发送10个
    const to = []
    for (let j = 0; j < 10; j++) {
      const email = totalTo[i + j]
      if (email) {
        to.push(email)
      }
    }
    const mailOptions = {
      from: emailFrom || user,
      to,
      subject,
      text,
      html,
      attachments,
    }
    await new Promise(
      resolve => transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error)
        }
        console.log('send mail success')

        resolve()
      }))
  }
}

export default sendMail


import env from '~/src/configs/env'

const serverHost = 'mail.xxx.com' //再改成mail.lianjia.com  灯塔线上服务器会把mail.ke.com解析成外网域名
const user = ''
const pass = ''
const port = 587
const cc = []
const leaders = []
const emailFrom = '灯塔系统'

export default {
  serverHost,
  emailFrom,
  leaders,
  user,
  pass,
  port,
  cc,
}

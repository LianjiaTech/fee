import env from '~/src/configs/env'

// 线上环境配置
const production = {
  api: '',
  appkey: '',
  appID: 123456
}

// 测试环境配置
const testing = production
// 开发环境配置
const development = production

let config = {
  development,
  testing,
  production
}

export default config[env]

import env from '~/src/configs/env'

const hosts = []

// 开发环境配置
const development = {
  host: '127.0.0.1:9200'
  // host
}
// 测试环境配置
const testing = {
  hosts
}
// 线上环境配置
const production = {
  hosts
}

let config = {
  development,
  testing,
  production
}

export default config[env]

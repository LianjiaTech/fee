// redis 配置。 redis 使用参见 http://devdocs.io/redis/
import env from '~/src/configs/env'

// 开发环境配置
const development = {
  host: '127.0.0.1',
  port: '6379'
}
// 测试环境配置
const testing = development

// 线上环境配置
const production = testing

let config = {
  development,
  testing,
  production
}

export default config[env]

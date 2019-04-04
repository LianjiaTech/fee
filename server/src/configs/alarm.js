import env from '~/src/configs/env'

const production = {
  addr: '',
  app: '',
  WATCH_UCID_LIST_DEFAULT: [
    123456 // ***
  ],
  WATCH_UCID_LIST_BACKEND: [
    123456 // ***
  ]
}

// 测试环境和prod环境保持一致
const testing = production

// 测试环境下只给自己发就可以了
const development = {
  addr: '',
  app: '',
  WATCH_UCID_LIST_DEFAULT: [
    123456 // ***
  ],
  WATCH_UCID_LIST_BACKEND: [
    123456 // ***
  ]
}

let config = {
  development,
  testing,
  production
}

export default config[env]

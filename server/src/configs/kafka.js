import env from '~/src/configs/env'

const production = {
}

const testing = production

const development = testing

let config = {
  development,
  testing,
  production
}

export default config[env]

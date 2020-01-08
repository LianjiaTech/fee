import env from '~/src/configs/env'

const production = {
  reaminDays: 20,
}

const testing = {
  reaminDays: 20,
}

const development = {
  reaminDays: 2,
}

const backup = {
  reaminDays: 20,
}

let config = {
  development,
  testing,
  production,
  backup
}

export default config[env]

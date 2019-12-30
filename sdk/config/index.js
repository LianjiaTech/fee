var ENV_DEV = 'development'
var ENV_PRODUCTION = 'production'

module.exports = {
  version: '1.1.0-beta.1',
  build: {
    env: ENV_PRODUCTION
  },
  dev: {
    env: ENV_DEV
  }
}

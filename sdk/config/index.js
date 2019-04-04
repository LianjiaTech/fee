const ENV_DEV = 'development'
const ENV_PRODUCTION = 'production'

module.exports = {
  version: '1.0.40',
  build: {
    bundleAnalyzerReport: false,
    env: ENV_PRODUCTION
  },
  dev: {
    bundleAnalyzerReport: false,
    env: ENV_DEV
  }
}

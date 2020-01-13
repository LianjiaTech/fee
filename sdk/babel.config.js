const env = process.env.NODE_ENV || 'production'
const isTesting = env === 'test' // Jest 默认注入 env 为 test

module.exports = isTesting
  ? {
      env: {
        test: {
          presets: [['@babel/preset-env']]
        }
      }
    }
  : {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: '> 0.25%, not dead',
            modules: false
          }
        ]
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            corejs: {
              version: 3,
              proposals: true
            },
            useESModules: true
          }
        ]
      ]
    }

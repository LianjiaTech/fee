import env from '~/src/configs/env'

// 线上环境配置
const production = {
  api: '',
  appkey: '',
  appID: 123456,
  // 这里只做测试使用，正式环境不应该将密钥放到代码中
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
  MIIBOgIBAAJBAIhdx31QICGN1LKRW4WngeL3RtzPh7cEHmhFJB8m4bQUSTcSi4eg
  sUvMeZkWyaF9gOxtZKzk5TI6q+8hg8TY6S8CAwEAAQJASds423cVH/c4NsqhXh8e
  KvYwjBFeeNIjQegIq1KctbHmKNM5MMb4jnDqdY/S5XHHS22EGvLNheLgV8tlRjwG
  UQIhANpNmbl215eOsGPJ0jqz1XPMBrO35V6I3P04kvr66R1JAiEAn+oL0jtAFETR
  4PRfenye5MAu9US3V5MoDN8xUoEvKrcCIQDQT2ZWNNIrHAyzXB2QyJPxqInoqp1j
  5QPDWl3ewtj5iQIgY3E1nKw/stsA8LTGUvMAFBv2l4r9wDXAaBC7KSUwYY0CIAj4
  0gA9etDbPm3H/XDwK4WXs9mXkKroyxewkWoOoAw/
  -----END RSA PRIVATE KEY-----`
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

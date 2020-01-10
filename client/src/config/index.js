export default {
  /**
   * @description token在Cookie中存储的天数，默认1天
   */
  cookieExpires: 1,
  /**
   * @description 是否使用国际化，默认为false
   *              如果不使用，则需要在路由中给需要在菜单中展示的路由设置meta: {title: 'xxx'}
   *              用来在菜单中显示文字
   */
  useI18n: false,
  publicKey: `-----BEGIN PUBLIC KEY-----
  MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIhdx31QICGN1LKRW4WngeL3RtzPh7cE
  HmhFJB8m4bQUSTcSi4egsUvMeZkWyaF9gOxtZKzk5TI6q+8hg8TY6S8CAwEAAQ==
  -----END PUBLIC KEY-----`
}

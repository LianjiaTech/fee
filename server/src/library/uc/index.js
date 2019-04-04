import md5 from 'md5'
/**
* 计算sign值
* @param {*} params 表单值
* @param {*} headers header字段值
* @param {*} key 申请的appid
*/
function getSign (params, headers, key) {
  return md5(sign)
}

export default {
  getSign
}

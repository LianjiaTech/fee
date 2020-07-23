import md5 from 'md5'
/**
* 计算sign值
* @param {*} params 表单值
* @param {*} headers header字段值
* @param {*} key 申请的appid
*/
function getSign (params, headers, key) {
  const keyList = Object.keys(params).concat(Object.keys(headers))
  keyList.sort()
  const data = {
    ...params,
    ...headers
  }
  let sign = ''
  for (let key of keyList) {
    sign += '&' + key + '=' + data[key]
  }
  sign = sign.substr(1) + key
  return md5(sign)
}

export default {
  getSign
}

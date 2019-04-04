// df detail field
// ef extra field
// dft detail field transfer dbfield
const CODE_DETAIL_RULE = []

CODE_DETAIL_RULE[1] = {
  df: ['url', 'http_code', 'during_ms', 'size'],
  ef: ['params', 'response'],
  dft: {
    'size': 'response_size_b'
  }
}
CODE_DETAIL_RULE[2] = {
  df: ['url'],
  ef: ['params', 'response'],
  dft: {
  }
}
CODE_DETAIL_RULE[3] = {
  df: ['url', 'reason'],
  ef: ['code'],
  dft: {
    'reason': 'error_no'
  }
}
CODE_DETAIL_RULE[4] = {
  df: ['step'],
  ef: ['desc'],
  dft: {
    'step': 'error_no'
  }
}
CODE_DETAIL_RULE[5] = {
  df: ['url', 'step'],
  ef: ['params'],
  dft: {
    'step': 'error_no'
  }
}
CODE_DETAIL_RULE[8] = {
  df: [],  //必填字段
  dft: {
    'error_name': 'error_no', // 错误名
    'http_code': 'http_code', // Http状态码
    'during_ms': 'during_ms', // 接口响应时长(毫秒) 
    'url': 'url', // url地址
    'request_size_b': 'request_size_b', // post参数体积, 单位b
    'response_size_b': 'response_size_b', // 响应值体积, 单位b
  } //选填字段
}
// CODE_DETAIL_RULE[10001] = {
//   df: ['duration_ms',],
//   ef: [],
//   dft: {
//   },
// }

// CODE_DETAIL_RULE[10002] = {
//   df: ['code','url'],
//   ef: ['name'],
//   dft: {
//     'code': 'error_no',
//   },
// }
export default CODE_DETAIL_RULE

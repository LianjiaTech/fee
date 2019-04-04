
/**
 * 清洗迭代器
 * 主要罗列数据清洗的不同指标规则，
 * 后续指标都要迁移到这里做统一适配
 */

const config = {
  deviceConfigDevice: {
    os: /^[A-Za-z]+$/,
    country: /[\u4e00-\u9fa5]/,
    province: /[\u4e00-\u9fa5]/,
    city: /[\u4e00-\u9fa5]/
  }
}

export default config

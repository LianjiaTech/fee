const BaseTableName = 't_o_system_collection'

function getTableName (id) {
  return `${BaseTableName}_${id}`
}

export default {
  getTableName
}

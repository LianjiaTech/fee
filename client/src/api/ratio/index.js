import axios from 'src/libs/api.request'
import { getProjectId } from 'src/libs/util'

class Ratio {
  static getDataErrorNum (startAt, endAt, type) {
    return axios.request({
      url: `project/${getProjectId()}/api/ratio/data/error_num`,
      method: 'get',
      params: {
        start_at: startAt,
        end_at: endAt,
        type
      }
    })
  }
  static getPerfAvgData (startAt, endAt, pageType, indicator) {
    return axios.request({
      url: `project/${getProjectId()}/api/ratio/data/perfAvg`,
      method: 'get',
      params: {
        start_at: startAt,
        end_at: endAt,
        pageType,
        indicator
      }
    })
  }
}

export default Ratio

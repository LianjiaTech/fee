import axios from 'src/libs/api.request'
import { getProjectId } from 'src/libs/util'

class Behavior {
  static getMenuCount (startAt, endAt) {
    return axios.request({
      url: `project/${getProjectId()}/api/behavior/menu`,
      method: 'get',
      params: {
        q: JSON.stringify({
          startAt,
          endAt
        })
      }
    })
  }

  static getOnlineTime (filterBy, st, et) {
    return axios.request({
      url: `project/${getProjectId()}/api/behavior/online_time`,
      method: 'get',
      params: {
        filterBy, st, et
      }
    })
  }
}
export default Behavior

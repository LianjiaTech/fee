import axios from 'src/libs/api.request'

const getProjectId = () => {
  return window.location.href.split('/')[4] || 1
}

// via yao
export const fetchErrorDistributionList = (startAt, endAt) => {
  return axios.request({
    url: `project/${getProjectId()}/api/error/distribution/summary`,
    method: 'get',
    params: {
      start_at: startAt,
      end_at: endAt
    }
  }).catch(e => {
    console.warn(e)
    return {}
  })
}

export const fetchUrlList = (startAt, endAt, errorNameList) => {
  return axios.request({
    url: `project/${getProjectId()}/api/error/distribution/url`,
    method: 'get',
    params: {
      start_at: startAt,
      end_at: endAt,
      error_name_list_json: JSON.stringify(errorNameList)
    }
  }).catch(e => {
    console.warn(e)
    return {}
  })
}

export const fetchStackAreaRecordList = (countType, startAt, endAt, errorNameList, url) => {
  return axios.request({
    url: `project/${getProjectId()}/api/error/viser/area/stack_area`,
    method: 'get',
    params: {
      count_type: countType,
      start_at: startAt,
      end_at: endAt,
      error_name_list_json: JSON.stringify(errorNameList),
      url: url
    }
  }).catch(e => {
    console.warn(e)
    return {}
  })
}

export const fetchErrorNameDistribution = (startAt, endAt, errorNameList, url) => {
  return axios.request({
    url: `project/${getProjectId()}/api/error/distribution/error_name`,
    method: 'get',
    params: {
      start_at: startAt,
      end_at: endAt,
      error_name_list_json: JSON.stringify(errorNameList),
      url: url
    }
  }).catch(e => {
    console.warn(e)
    return {}
  })
}

export const fetchGeographyDistribution = (startAt, endAt, errorNameList, url) => {
  return axios.request({
    url: `project/${getProjectId()}/api/error/distribution/geography`,
    method: 'get',
    params: {
      start_at: startAt,
      end_at: endAt,
      error_name_list_json: JSON.stringify(errorNameList),
      url: url
    }
  }).catch(e => {
    console.warn(e)
    return {}
  })
}

export const fetchErrorLog = (startAt, endAt, currentPage, errorNameList, url) => {
  return axios.request({
    url: `project/${getProjectId()}/api/error/log/list`,
    method: 'get',
    params: {
      start_at: startAt,
      end_at: endAt,
      current_page: currentPage,
      error_name_list_json: JSON.stringify(errorNameList),
      url: url
    }
  }).catch(e => {
    console.warn(e)
    return {}
  })
}

/** @format */

import axios from 'src/libs/api.request'

const getProjectId = () => {
  return window.location.href.split('/')[4] || 1
}

// via yao
export const fetchErrorDistributionList = ({ start_at, end_at }) => {
  return axios
    .request({
      url: `project/${getProjectId()}/api/error/distribution/summary`,
      method: 'post',
      data: {
        start_at,
        end_at
      }
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

export const fetchUrlList = (data) => {
  return axios
    .request({
      url: `project/${getProjectId()}/api/error/distribution/url`,
      method: 'post',
      data
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

export const fetchStackAreaRecordList = ({
  count_type,
  start_at,
  end_at,
  error_name_list,
  error_uuid,
  error_ucid,
  error_detail,
  url,
  detail
}) => {
  return axios
    .request({
      url: `project/${getProjectId()}/api/error/viser/area/stack_area`,
      method: 'post',
      data: {
        count_type,
        start_at,
        end_at,
        error_name_list,
        error_uuid,
        error_ucid,
        error_detail,
        url,
        detail
      }
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

export const fetchErrorDetailDistribution = (data) => {
  return axios
    .request({
      url: `project/${getProjectId()}/api/error/distribution/error_detail`,
      method: 'post',
      data
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

export const fetchErrorNameDistribution = ({
  start_at,
  end_at,
  error_name_list,
  error_uuid,
  error_ucid,
  error_detail,
  url,
  detail
}) => {
  return axios
    .request({
      url: `project/${getProjectId()}/api/error/distribution/error_name`,
      method: 'post',
      data: {
        start_at,
        end_at,
        error_name_list,
        error_uuid,
        error_ucid,
        error_detail,
        url,
        detail
      }
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

export const fetchGeographyDistribution = ({
  start_at,
  end_at,
  error_name_list,
  error_uuid,
  error_ucid,
  error_detail,
  url,
  detail
}) => {
  return axios
    .request({
      url: `project/${getProjectId()}/api/error/distribution/geography`,
      method: 'post',
      data: {
        start_at,
        end_at,
        error_name_list,
        error_uuid,
        error_ucid,
        error_detail,
        url,
        detail
      }
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

export const fetchErrorLog = ({
  start_at,
  end_at,
  current_page,
  error_name_list,
  error_uuid,
  error_ucid,
  error_detail,
  url,
  detail
}) => {
  return axios
    .request({
      url: `project/${getProjectId()}/api/error/log/list`,
      method: 'post',
      data: {
        start_at,
        end_at,
        current_page,
        error_name_list,
        error_uuid,
        error_ucid,
        error_detail,
        url,
        detail
      }
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

export const fetchErrorAlarmDetail = ({ pid, lid, page = 1, size = 10 }) => {
  return axios
    .request({
      url: `/api/alarm/error/detail`,
      method: 'post',
      data: {
        pid,
        lid,
        page,
        size
      }
    })
    .catch((e) => {
      console.warn(e)
      return {}
    })
}

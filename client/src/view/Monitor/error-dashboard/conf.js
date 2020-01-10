/** @format */
import _ from 'lodash'
import moment from 'moment'

import DATE_FORMAT from 'src/constants/date_format'

export let errorLogColumnsConfig = function() {
  return [
    {
      title: '时间',
      width: 150,
      key: 'date',
      align: 'center',
      render: (h, params) => {
        const { row } = params
        return h('div', moment.unix(row.log_at).format(DATE_FORMAT.DISPLAY_BY_SECOND))
      }
    },
    {
      title: 'error_name',
      key: 'error_name',
      align: 'center'
    },
    {
      title: 'URL',
      key: 'url',
      align: 'center'
    },
    {
      title: 'http_code',
      key: 'http_code',
      align: 'center',
      width: 100
    },
    {
      title: '地域',
      key: 'position',
      align: 'center',
      width: 120,
      render: (h, params) => {
        let province = _.get(params, ['row', 'province'], '')
        let city = _.get(params, ['row', 'city'], '')
        return h('div', `${province} ${city}`)
      }
    }
  ]
}

export let urlColumnConfig = [
  {
    title: '数量',
    key: 'value',
    width: 100,
    align: 'center'
  },
  {
    title: 'URL',
    key: 'name',
    align: 'center'
  }
]
export let cityColumnsConfig = [
  {
    title: '数量',
    key: 'value',
    align: 'center'
  },
  {
    title: '省份',
    key: 'name',
    align: 'center'
  }
]

/** @format */

import moment from 'moment'
import DATE_FORMAT from 'src/constants/date_format'

let columnsConfig = function(ctx) {
  return [
    {
      title: '时间',
      key: 'log_at',
      align: 'center',
      width: 100,
      render: (h, params) => {
        const { row } = params
        return h('div', moment.unix(row.log_at).format(DATE_FORMAT.DISPLAY_BY_SECOND))
      }
    },
    {
      title: 'error_name',
      key: 'error_name',
      align: 'center',
      width: 200
    },
    {
      title: 'URL',
      key: 'url',
      align: 'center',
      width: 300
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
      width: 100,
      render: (h, params) => {
        let province = _.get(params, ['row', 'province'], '')
        let city = _.get(params, ['row', 'city'], '')
        return h('div', `${province} ${city}`)
      }
    },
    {
      key: 'status',
      title: '扩展信息',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (h, params) => {
        let ext = _.get(params, ['row', 'ext'], '')
        let formatExt = {}
        // 对ext 下的key进行二次解析, 方便查看
        for (let extKey of Object.keys(ext)) {
          let valueJSON = ext[extKey]
          let value
          try {
            value = JSON.parse(valueJSON)
          } catch (e) {
            value = valueJSON
          }
          formatExt[extKey] = value
        }
        return h(
          'Button',
          {
            props: {
              type: 'info'
            },
            on: {
              click: () => {
                ctx.handleLookDetail(formatExt)
              }
            }
          },
          '查看详情'
        )
      }
    }
  ]
}

export { columnsConfig }

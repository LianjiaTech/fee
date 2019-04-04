<template>
  <div>
        <Card style="overflow:hidden">
          <div slot="title">页面加载时间详情</div>
            <Loading :isSpinShow="isSpinShowDetail"></Loading>
            <v-chart
              height="400"
              :data="lineData"
              :scale="lineScale"
              :padding="loadingTimePadding"
              width="490"
              renderer='svg'
            >
              <v-tooltip />
              <v-axis />
              <v-legend layout="horizontal" :custom="true"/>
              <v-line
                position="index_timestamp_ms*ms"
                color="type"
              />
              <v-point
                position="index_timestamp_ms*ms"
                color="type"
                :size="5"
                :shape="'circle'"
              />
            </v-chart>
        </Card>
        <Card>
          <p slot="title">页面加载瀑布图</p> 
          <div>
            <Loading :isSpinShow="isSpinShowWaterfall"></Loading>
            <v-chart
              :forceFit="true"
              :padding="padding"
              height="400"
              :data="data1"
            >
              <v-coord
                type="rect"
                direction="LB"
              />
              <v-tooltip
                dataKey="profession*range"
                :onChange="itemFormatter"
              />
              <v-legend />
              <v-axis
                dataKey="profession"
                :label="label"
              />
              <v-bar
                position="profession*range"
                color="profession"
              />
            </v-chart>
          </div>
        </Card>
  </div>
</template>

<script>
  import moment from 'moment'
  import {
    Page
  } from 'iview'
  import {
    fetchTimeDetail,
    fetchTimeLine,
    fetchUrlList
  } from '@/api/performance'
  import DataSet from '@antv/data-set'
  import Loading from '@/view/components/loading/loading.vue'
  import _ from 'lodash'

  const scale = [{
    dataKey: 'year',
    type: 'linear',
    tickInterval: 500
  }]
  
  export default {
    name: 'home',
    components: {
      Page,
      Loading
    },
    data () {
      return {
        isHighlight: true,
        isSpinShowDetail: true,
        isSpinShowWaterfall: true,
        data1: [],
        height1: 800,
        label: {
          offset: 12
        },
        padding: [20, 80, 70, 110],
        loadingTimePadding: [20, 120, 140, 40],
        areaData: [],
        scale,
        height: 200,
        field: 'error_name',
        errorName: '',
        dateRange: [new Date(+moment().startOf('day')), new Date()],
        // 堆叠图日期
        options: {
          disabledDate (date) {
            let initdate = Date.now() - 7 * 24 * 60 * 60 * 1000
            return (date && date.valueOf() < initdate) || (date && date.valueOf() > Date.now())
          }
        },
        date: new Date(),
        startUpData: {
          dataEmpty: true
        },
        columns: [{
          title: '错误描述',
          key: 'e_desc'
        },
        {
          title: '堆栈信息',
          key: 'e_stack'
        },
        {
          title: '地域',
          key: 'position',
          render: (h, params) => {
            const {
                row
              } = params
            const {
                province,
                city
              } = row
            return h('div', `${province} ${city}`)
          }
        },
        {
          title: '时间',
          width: 150,
          key: 'date',
          render: (h, params) => {
            const {
                row
              } = params
            return h('div', moment(row.timestamp).format('YYYY/MM/DD HH:mm:ss'))
          }
        }
        ],
        current: 1,
        pageSize: 10,
        total: 10,

        urlColumns: [{
          title: 'URL',
          key: 'name'
        }],
        cityColumns: [{
          title: '城市',
          key: 'name',
          width: 80
        },
        {
          title: '数量',
          key: 'value',
          width: 80
        }
        ],
        cityData: [],
        data: [],
        urlData: [],
        chartData: {},
        percent: 0,

        // 折线图
        lineData: [],
        lineScale: [],
        style: {
          stroke: '#fff',
          lineWidth: 1
        },
        url: '',
        timePosition: {
          type: 'absolute',
          top: '100px'
        },
        timeContent: `<ul><li>hdjshfjsfh</li></ul>`,
        isShow: false,
        timeArray: [{
          key: 'dom_ready_ms',
          value: 'DOM_READY_耗时'
        },
        {
          key: 'first_render_ms',
          value: '首次渲染耗时'
        },
        {
          key: 'first_response_ms',
          value: '首次可交互耗时'
        },
        {
          key: 'first_tcp_ms',
          value: '首包时间耗时'
        },
        {
          key: 'load_complete_ms',
          value: '页面完全加载耗时'
        },
        {
          key: 'ssl_connect_ms',
          value: 'SSL连接耗时'
        }
        ],
        rangeArray: [{
          key: 'dns_lookup_ms',
          value: 'DNS查询耗时'
        },
        {
          key: 'tcp_connect_ms',
          value: 'TCP链接耗时'
        },
        {
          key: 'response_request_ms',
          value: '请求响应耗时'
        },
        {
          key: 'response_transfer_ms',
          value: '内容传输耗时'
        },
        {
          key: 'dom_parse_ms',
          'value': 'DOM解析耗时'
        },
        {
          key: 'load_resource_ms',
          value: '资源加载耗时'
        }
        ],
        isShow1: false,
        urlLoading: true
      }
    },
    methods: {
      getViewData (skey, svalue, data = []) {
        var ret = {
          columns: [skey, svalue],
          rows: []
        }
        data.forEach(({
          name: key,
          value
        }) => {
          ret.rows.push({
            [skey]: key,
            [svalue]: value
          })
        })
        return ret
      },
      async getUrlList (params = {}) {
        const {
          st,
          et,
          summaryBy
        } = params
        const res = await fetchUrlList({
          st: st || +this.dateRange[0],
          et: et || +this.dateRange[1],
          summaryBy: summaryBy || 'minute'
        })
        this.urlData = (res.data || []).map((item, index) => ({
          name: item
        }))
        this.url = _.get(this, ['urlData', 0, 'name'], '')
        this.getTimeDetail()
        this.getTimeLine()
        if (this.urlColumns) {
          this.urlLoading = false
        }
      },
      async getTimeDetail (params = {}) {
        const {
          st,
          et,
          url,
          summaryBy
        } = params
        const res = await fetchTimeDetail({
          st: st || +this.dateRange[0],
          et: et || +this.dateRange[1],
          url: url || this.url,
          summaryBy: summaryBy || 'hour'
        })
        const dv = new DataSet.View().source(res.data)
        dv.transform({
          type: 'rename',
          map: {
            dns_lookup_ms: 'DNS查询耗时',
            response_request_ms: '请求响应耗时',
            dom_parse_ms: 'DOM解析耗时',
            response_transfer_ms: '内容传输耗时',
            load_resource_ms: '资源加载耗时',
            dom_ready_ms: 'DOM_READY_耗时',
            first_render_ms: '首次渲染耗',
            first_response_ms: '首次可交互耗时',
            first_tcp_ms: '首包时间耗时',
            load_complete_ms: '页面完全加载耗时',
            ssl_connect_ms: 'SSL连接耗时',
            tcp_connect_ms: 'TCP链接耗时'
          }
        })
        dv.transform({
          type: 'fold',
          fields: [
            'DNS查询耗时',
            '请求响应耗时',
            'DOM解析耗时',
            '内容传输耗时',
            '资源加载耗时',
            'DOM_READY_耗时',
            '首次渲染耗',
            '首次可交互耗时',
            '首包时间耗时',
            '页面完全加载耗时',
            'SSL连接耗时',
            'TCP链接耗时'
          ],
          key: 'type',
          value: 'ms'
        })
        const data = dv.rows
        this.lineData = data
        const scale = [{
          dataKey: 'ms',
          sync: true,
          alias: 'ms',
          formatter: (value) => value / 1000 + 's'
        }, {
          dataKey: 'index_timestamp_ms',
          type: 'time',
          tickCount: 4,
          mask: 'MM-DD HH:mm'
        }]
        this.lineScale = scale
        if (this.lineData && this.lineScale) {
          this.isSpinShowDetail = false
        }
      },
      async getTimeLine (params = {}) {
        const {
          st,
          et
        } = params
        const res = await fetchTimeLine({
          st: st || +this.dateRange[0],
          et: et || +this.dateRange[1],
          url: this.url,
          summaryBy: 'minute'
        })
        /* eslint-disable */
        const {
          dns_lookup_ms = 0,
            tcp_connect_ms = 0,
            ssl_connect_ms = 0,
            response_request_ms = 0,
            dom_parse_ms = 0,
            response_transfer_ms = 0,
            load_resource_ms = 0
        } = res.data
        const sourceData = [{
            profession: 'DNS查询',
            highest: dns_lookup_ms,
            minimum: 0,
            mean: 56636
          },
          {
            profession: 'TCP连接',
            highest: dns_lookup_ms + tcp_connect_ms,
            minimum: dns_lookup_ms,
            mean: 66625
          },
          {
            profession: 'SSL 建连',
            highest: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms,
            minimum: dns_lookup_ms + tcp_connect_ms,
            mean: 72536
          },
          {
            profession: '请求响应',
            highest: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms + response_request_ms,
            minimum: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms,
            mean: 75256
          },
          {
            profession: '内容传输',
            highest: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms + response_request_ms + response_transfer_ms,
            minimum: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms + response_request_ms,
            mean: 77031
          },
          {
            profession: 'DOM解析',
            highest: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms + response_request_ms + response_transfer_ms + dom_parse_ms,
            minimum: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms + response_request_ms + response_transfer_ms,
            mean: 77031
          },
          {
            profession: '资源加载',
            highest: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms + response_request_ms + response_transfer_ms + dom_parse_ms + load_resource_ms,
            minimum: dns_lookup_ms + tcp_connect_ms + ssl_connect_ms + response_request_ms + response_transfer_ms + dom_parse_ms,
            mean: 77031
          }
        ]

        const dv = new DataSet.View().source(sourceData.reverse())
        dv.transform({
          type: 'map',
          key: 'range',
          callback(row) {
            row.range = [row.minimum, row.highest]
            return row
          }
        })
        this.data1 = dv.rows
        if (this.data1) {
          this.isSpinShowWaterfall = false
        }
      },
      onPageChange(current) {
        this.getListData({
          current
        })
      },

      dateChange([st, et]) {
        let format = 'YYYY-MM-DD HH:mm:ss'
        let startAt = moment(st).startOf('day').format(format)
        let endAt = moment(et).endOf('day').format(format)
        this.dateRange = [startAt, endAt]
      },
      dateChangeOk() {
        this.urlLoading = true
        this.isSpinShowDetail = true
        this.isSpinShowWaterfall = true
        this.getUrlList()
        this.getTimeDetail()
        this.getTimeLine()
      },
      selectRow(record, index) {
        const self = this
        self.rowClassName = () => {}
        const {
          name = ''
        } = record
        self.url = name
        self.isSpinShowDetail = true
        self.isSpinShowWaterfall = true
        self.getTimeDetail()
        self.getTimeLine()
      },
      itemFormatter(e) {
        let attrs = e.tooltip._attrs
        if (e.items) {
          const items = e.items[0].value.split('-')
          let range = items[1] - items[0]
          attrs.itemTpl = `<ul class="g2-tooltip-list-item"> <li data-v-gtlv >{name}：${range}` + `ms</li> </ul>`
        }
      },
      visible() {
        this.isShow = true
      },
      invisible() {
        this.isShow = false
      },
      waterPullVisible() {
        this.isShow1 = true
      },
      waterPullInvisible() {
        this.isShow1 = false
      },
      rowClassName(row,index){
        if (index === 0) {
          return 'demo-table-info-row'
        }
        return ''
      }

    },
    mounted() {
      this.resize()
      this.getUrlList()
    }
  }
</script>

<style lang="less" scoped>
.container {
  display: flex;
  flex-direction: row;
  height: calc(100%);
}

.url-list {
  width: 420px;
  height: 100%;
  overflow: auto;
}

.g2-tooltip-list-item {
  list-style: none;
}

.demo-spin-col {
  height: 100px;
  position: relative;
  border: 1px solid #eee;
}

.demo-spin-icon-load {
  animation: ani-demo-spin 1s linear infinite;
}
.ivu-table .demo-table-info-row td {
  background-color: #ebf7ff;
}
</style>

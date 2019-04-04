<template>
  <!--错误面板-->
  <div class="container-d85ac9">
    <div class="control-panel-header">
      <div class="date-selector">
        <Card
          shadow
          style="width:100%"
        >
          <Row>
            <Col
              span="6"
              style="width:310px"
            >
            <span>选择时间范围:</span>
            <div style="display:inline-block;width:200px">
              <DatePicker
                type="daterange"
                size="large"
                placement="bottom-start"
                format="yyyy-MM-dd"
                placeholder="请选择时间范围"
                style="width: 100%"
                @on-change="handleDateChange"
                :value="status.selectDate"
                :options="{disabledDate:isDateDisabled}"
              />
            </div>
            </Col>
            <Select
              v-model="selectedPrefix"
              style="width:400px;position:absolute;right:5px"
              size="large"
              filterable
              clearable
              placeholder='请输入报警名称进行模糊匹配'
              transfer
              @on-change="handlePrefixChange"
            >
              <Option
                v-for="item in database.prefixList"
                :value="item"
                :key="item"
              >{{ item }}</Option>
            </Select>
          </Row>
        </Card>
      </div>

      <div
        class="error-distribution-summary"
        style="position:relative"
      >
        <Row>
          <Col span="24">
          <Loading :isSpinShow="this.status.loading.errorDistributionSummary"></Loading>
          <Card
            shadow
            style="width:100%"
          >
            <div solt="title">
              <span>错误类型</span>
              <Poptip
                trigger="hover"
                content="默认展示按照数量排序前十的错误类型, 其他错误类型请自行选择"
                placement="left-start"
              >
                <Icon type="md-help-circle" />
              </Poptip>
            </div>
            <Select
              v-model="status.selectedErrorNameList"
              filterable
              multiple
              size="large"
              @on-change="handleSelectErrorNameChange"
            >
              <Option
                v-for="item in database.errorDistributionList"
                :value="item.error_name"
                :key="item.error_name"
              >
                ({{ item.error_count }}) {{ item.error_name.slice(0, 30) }}
              </Option>
            </Select>
          </Card>
          </Col>
        </Row>
      </div>
    </div>

    <div class="control-panel-body">
      <Row>
        <Col span="8">
        <div class="url-list">
          <Card shadow>
            <Poptip
              v-model="status.isShowTip"
              style="position:absolute;z-index:1000;left:167px;"
              placement="right"
              width="200"
            >
              <div class="poptip-content" slot="content">
                <p>单击URL, 可以查看该URL对应的数据哦!</p>
                <a @click="status.isShowTip = false">关闭</a>
              </div>
            </Poptip>
            <Table
              ref="urlListTable"
              :highlight-row='true'
              :columns='componentConfig.urlColumnConfig'
              :data='database.urlList'
              @on-row-click="handleSelectUrl"
              :loading="status.loading.urlList"
              :height="638"
            />
          </Card>
        </div>
        </Col>
        <Col span="16">
        <Card shadow>
          <p slot="title">
            <Icon type="md-analytics" />
            监控视图
          </p>
          <the-body-chart
            :stackAreaRecordList='database.stackAreaRecordList'
            :stackAreaScale='componentConfig.stackAreaScale'
            :isSpinShowStack='status.loading.stackAreaChart'
            :pieChartDistribution='database.pieChartDistribution'
            :isSpinShowPie='status.loading.pieChart'
            :isSpinShowMap='status.loading.geographyChart'
            :geographyChartDistributionRecord='geographyChartDistributionRecord'
            :Mapcolumns='componentConfig.cityColumnsConfig'
            :mapTableData='database.provinceDistributionList'
            :tableLoading="status.loading.geographyChart"
            v-on:listenHandleFilterChange='handleFilterChange'
          ></the-body-chart>
        </Card>
        </Col>
      </Row>
      <Row>
        <Col span="24">
        <div class="dashboard-log">
          <div class="error-log-detail">
            <Card shadow>
              <Icon
                type="ios-arrow-forward"
                class='icon-position'
                v-if='componentConfig.isExpand'
                @click="handleExtraExpand"
              />
              <Icon
                type="ios-arrow-down"
                class='icon-position'
                v-if='!componentConfig.isExpand'
                @click="handleExtraExpand"
              />
              <Table
                :columns='componentConfig.errorLogColumnsConfig'
                :data='database.errorLog.recordList'
                :loading="status.loading.errorLogChart"
              />
              <Page
                @on-change="handlePageChange"
                :current="database.errorLog.pager.currentPage"
                :total="database.errorLog.pager.total"
                :page-size="database.errorLog.pager.pageSize"
                show-total
                class="the-page_position"
              />
            </Card>
          </div>
        </div>
        </Col>
      </Row>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import moment from 'moment'
  import { Page } from 'iview'
  import * as ErrorApi from 'src/api/error'
  import DATE_FORMAT from 'src/constants/date_format'
  import Loading from 'src/view/components/loading/loading.vue'
  import DataSet from '@antv/data-set'
  import TheBodyChart from './components/the-body-chart'

  let urlColumnConfig = [
    {
      title: '数量',
      key: 'value',
      width: 100
    },
    {
      title: 'URL',
      key: 'name'
    }
  ]
  let cityColumnsConfig = [
    {
      title: '数量',
      key: 'value'
    },
    {
      title: '省份',
      key: 'name'
    }
  ]
  let errorLogColumnsConfig = [
    {
      title: '时间',
      width: 150,
      key: 'date',
      align: 'center',
      render: (h, params) => {
        const {row} = params
        return h('div', moment.unix(row.log_at).format(DATE_FORMAT.DISPLAY_BY_SECOND))
      }
    },
    {
      title: 'error_name',
      key: 'error_name',
      align: 'center',
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
    },
    {
      key: 'status',
      type: 'expand',
      title: '扩展信息',
      align: 'center',
      width: 100,
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

        return (
          <div class='error-dashboard-jsx-root'>
            <div class='ext-json'>
              <pre>
                {JSON.stringify(formatExt, null, 4)}
              </pre>
            </div>
          </div>
        )
      }
    }
  ]

  let stackAreaScale = [
    {
      dataKey: 'value',
      sync: true,
      alias: '次',
      formatter: (value) => value + ' 次'
    },
    {
      dataKey: 'index',
      // formatter: (indexAt) => { return moment.unix(indexAt).format('HH:00')},
      // alias: '时间',
      // type: 'time', // 声明该数据的类型
      tickCount: 10 // 共显示多少个横坐标,默认五个  文档地址 => https://antvis.github.io/g2/doc/tutorial/start/axis.html
      // range: [0.02, 0.98], // 控制横轴两边的留白
    }
  ]

  export default {
    name: 'home',
    components: {
      Page,
      TheBodyChart,
      Loading
    },
    data () {
      return {
        // 常量
        selectedPrefix: '',
        CONSTANT: {
          // 日期常量, 包括单位/常用日期格式化字符串, 自constants中导入
          DATE_FORMAT
        },
        // 页面状态
        status: {
          filter: 'hour',
          selectDate: [moment().startOf('day').toDate(), moment().toDate()],
          selectedErrorNameList: [],
          selectedUrl: '',
          loading: {
            errorDistributionSummary: true,
            urlList: true,
            stackAreaChart: true,
            pieChart: true,
            geographyChart: true,
            errorLogChart: true
          },
          isShowTip: false
        },
        // 表格配置项
        componentConfig: {
          urlChartHeight: 1430,     // 强行hack, 使之略大于右侧三个表格总高度, 保证页面样式
          defaultChartHeight: 400,  // 图表chart高度
          urlColumnConfig,
          stackAreaScale,
          cityColumnsConfig,
          errorLogColumnsConfig,
          isExpand: true
        },
        // 数据
        // 错误分布
        database: {
          prefixList: [],
          urlList: [],
          errorDistributionList: [],
          stackAreaRecordList: [],
          pieChartDistribution: [],
          provinceDistributionList: [],
          errorLog: {
            recordList: [],
            pager: {
              currentPage: 1,
              pageSize: 10,
              total: 0
            }
          }
        }

      }
    },
    async mounted () {
      if (localStorage.getItem('fee_error_dashboard_is_show_tip') === null) {
        this.status.isShowTip = true
        localStorage.setItem('fee_error_dashboard_is_show_tip', 1)
      }
      await this.fetchErrorDistributionList()
      await this.updateRecord(true)
    },
    methods: {
      handleFilterChange (filter) {
        this.status.filter = filter
        this.fetchStackAreaRecordList()
      },
      async fetchErrorDistributionList () {
        // 启动&关闭 loading
        this.status.loading.errorDistributionSummary = true
        let response = await ErrorApi.fetchErrorDistributionList(this.startAt, this.endAt)
        this.status.loading.errorDistributionSummary = false

        let errorDistributionList = _.get(response, ['data'], [])
        this.database.errorDistributionList = errorDistributionList
        // 获取前缀
        let prefixSet = new Set()
        for (let errorDistrubution of errorDistributionList) {
          let errorName = _.get(errorDistrubution, ['error_name'], '')
          if (errorName === '') continue
          let prefix = errorName.split('_')
          if (prefix.length === 1) continue
          prefixSet.add(prefix[0] + '_')
        }
        this.database.prefixList = [...prefixSet]
        // 默认选择前10个
        let defaultErrorDistributionList = errorDistributionList.slice(0, 10)
        let defaultErrorNameList = []
        for (let defaultErrorDistribution of defaultErrorDistributionList) {
          let errorName = _.get(defaultErrorDistribution, ['error_name'], '')
          if (errorName.length > 0) {
            defaultErrorNameList.push(errorName)
          }
        }
        this.status.selectedErrorNameList = defaultErrorNameList
      },
      // 更新函数添加600ms延迟, 避免由于用户快速录入内容导致频繁发送请求
      updateRecord: _.debounce(async function (reloadUrlList = false) {
        this.resetCommonStatus()
        let fetchUrlListPromise
        if (reloadUrlList) {
          this.resetSelectUrl()
          fetchUrlListPromise = this.fetchUrlList()
        }
        // 并发执行请求
        let fetchStackAreaRecordPromise = this.fetchStackAreaRecordList()
        let fetchPieChartDistributionPromise = this.fetchPieChartDistribution()
        let fetchGeographyDistributionRecordPromise = this.fetchGeographyDistributionRecord()
        let fetchErrorLogPromise = this.fetchErrorLog()
        await Promise.all([
          fetchUrlListPromise,
          fetchStackAreaRecordPromise,
          fetchPieChartDistributionPromise,
          fetchGeographyDistributionRecordPromise,
          fetchErrorLogPromise
        ])
      }, 600),
      resetCommonStatus () {
        // 重置通用属性
        this.database.errorLog.pager.currentPage = 1
      },
      resetSelectUrl () {
        // 重置url
        this.status.selectedUrl = ''
        this.$refs.urlListTable.clearCurrentRow()
      },
      async fetchUrlList () {
        this.status.loading.urlList = true
        let response = await ErrorApi.fetchUrlList(this.startAt, this.endAt, this.status.selectedErrorNameList)
        this.status.loading.urlList = false
        this.database.urlList = _.get(response, ['data'], [])
      },
      async fetchStackAreaRecordList () {
        this.status.loading.stackAreaChart = true
        let response = await ErrorApi.fetchStackAreaRecordList(this.status.filter, this.startAt, this.endAt, this.status.selectedErrorNameList, this.status.selectedUrl)
        this.status.loading.stackAreaChart = false
        let rawStackAreaRecordList = _.get(response, ['data'], [])
        let stackAreaRecordList = []
        // 组件使用index字段作为纵轴
        for (let rawStackAreaRecord of rawStackAreaRecordList) {
          stackAreaRecordList.push({
            ...rawStackAreaRecord,
            index: rawStackAreaRecord['index_display']
          })
        }
        this.database.stackAreaRecordList = stackAreaRecordList
      },
      async fetchPieChartDistribution () {
        this.status.loading.pieChart = true
        let response = await ErrorApi.fetchErrorNameDistribution(this.startAt, this.endAt, this.status.selectedErrorNameList, this.status.selectedUrl)
        this.status.loading.pieChart = false
        let distributionList = response.data
        let dataSetView = new DataSet.View().source(distributionList)
        dataSetView.transform({
          type: 'percent',
          field: 'value',
          dimension: 'name',
          as: 'percent'
        })
        this.database.pieChartDistribution = dataSetView.rows
      },
      async fetchGeographyDistributionRecord () {
        this.status.loading.geographyChart = true
        let response = await ErrorApi.fetchGeographyDistribution(this.startAt, this.endAt, this.status.selectedErrorNameList, this.status.selectedUrl)
        this.status.loading.geographyChart = false
        this.database.provinceDistributionList = response.data
      },
      async fetchErrorLog () {
        let currentPage = _.get(this.database, ['errorLog', 'pager', 'currentPage'], 1)
        this.status.loading.errorLogChart = true
        let response = await ErrorApi.fetchErrorLog(this.startAt, this.endAt, currentPage, this.status.selectedErrorNameList, this.status.selectedUrl)
        this.status.loading.errorLogChart = false
        let rawRecordList = _.get(response, ['data', 'list'], [])
        let recordList = []
        for (let rawRecord of rawRecordList) {
          let record = {
            ...rawRecord,
            _expanded: false // 自动展开
          }
          recordList.push(record)
        }
        currentPage = _.get(response, ['data', 'pager', 'current_page'], 1)
        currentPage = parseInt(currentPage)
        let total = _.get(response, ['data', 'pager', 'total'], 0)
        let pageSize = _.get(response, ['data', 'pager', 'page_size'], 10)
        this.database.errorLog = {
          pager: {
            currentPage,
            pageSize,
            total
          },
          recordList
        }
      },

      async handleDateChange (selectDateRange) {
        let startTime = moment(selectDateRange[0]).format('YYYY-MM-DD 00:00:00')
        let endTime = moment(selectDateRange[1]).format('YYYY-MM-DD 23:59:59')
        this.status.selectDate = [startTime, endTime]
        // 日期范围更新后重选数据
        await this.fetchErrorDistributionList()
        await this.updateRecord(true)
      },
      async handleSelectUrl (record, index) {
        let url = _.get(record, ['name'], '')
        if (url === this.status.selectedUrl) {
          // 重复点击时应取消选择
          this.$refs.urlListTable.clearCurrentRow()
          this.status.selectedUrl = ''
        } else {
          this.status.selectedUrl = url
        }
        // 选择url后重新获取数据
        await this.updateRecord()
      },
      async handleSelectErrorNameChange () {
        // 重新选择错误名称列表后重取数据
        await this.updateRecord(true)
      },
      async handlePageChange (newPageNo) {
        this.database.errorLog.pager.currentPage = newPageNo
        await this.fetchErrorLog()
      },

      isDateDisabled (testDate) {
        let testAt = moment(testDate).startOf(this.CONSTANT.DATE_FORMAT.UNIT.DAY).unix()
        let nowAt = moment().startOf(this.CONSTANT.DATE_FORMAT.UNIT.DAY).unix()
        // 只能查看最近7天的数据
        let isSelectable = (nowAt - 86400 * 7) <= testAt && testAt <= nowAt
        return isSelectable === false
      },
      handlePrefixChange (value) {
        if (value) {
          let reg = new RegExp('^' + value)
          let filterErrorNameList = []
          for (let errorDistribution of this.database.errorDistributionList) {
            if (reg.test(errorDistribution['error_name'])) {
              filterErrorNameList.push(errorDistribution['error_name'])
            }
          }
          this.status.selectedErrorNameList = filterErrorNameList
        }
      },
      // 扩展信息所有展开
      handleExtraExpand () {
        this.componentConfig.isExpand = !this.componentConfig.isExpand
        let oldRecordList = this.database.errorLog.recordList
        let recordList = []
        for (let oldRecord of oldRecordList) {
          let record = oldRecord
          record._expanded = !record._expanded
          recordList.push(record)
        }
      }
    },
    computed: {
      startAt () {
        let startAtDate = _.get(this, ['status', 'selectDate', '0'], new Date())
        let startAt = moment(startAtDate).unix()
        return startAt
      },
      endAt () {
        let endAtDate = _.get(this, ['status', 'selectDate', '1'], new Date())
        let endAt = moment(endAtDate).unix()
        return endAt
      },
      // 该值可由省份分布直接推算出来, 所以不需要在data中单起变量了
      geographyChartDistributionRecord () {
        let recordList = []
        for (let provinceDistribution of this.database.provinceDistributionList) {
          let place = _.get(provinceDistribution, ['name'], '')
          let timeCount = _.get(provinceDistribution, ['value'], 0)
          let record = {
            '位置': place,
            '次数': timeCount
          }
          recordList.push(record)
        }

        let finialRecordConfig = {
          columns: ['位置', '次数'],
          rows: recordList
        }
        return finialRecordConfig
      }
    }
  }
</script>

<style lang="less" scoped>
.message {
  font-size: 1vw;
}

.date-selector,
.error-distribution-summary {
  width: 100%;
}

.dashboard {
  height: 100%;
  overflow: auto;
}

.url-list {
  height: 100%;
  overflow-y: auto;
}

.the-page_position {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  flex-direction: row;
  flex-wrap: wrap;
}
</style>

<style lang="less">
.container-d85ac9 {
// jsx中无法使用scope, 需要为jsx部分人工构建scope
  .error-dashboard-jsx-root {
    .ext-json pre {
      white-space: pre-wrap;
    }
  }
  .icon-position {
    position: absolute;
    right: 25px;
    z-index: 7;
    top: 30px;
  }
  .poptip-content {
    display: flex;
    p {
      white-space: normal;
    }
  }
}
</style>

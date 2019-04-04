<template>
  <!--错误面板-->
  <div class="container">

    <div class="control-panel-body">
          <div class="dashboard-chart">
            <div class="stack-area">
              <Card>
                <p slot="title">JS ERROR堆叠图</p>
                  <StackArea
                    :height="componentConfig.defaultChartHeight"
                    :data="database.stackAreaRecordList"
                    :scale="componentConfig.stackAreaScale"
                    :isSpinShow="status.loading.stackAreaChart"
                  >
                  </StackArea>
              </Card>
            </div>
            <div class="pie">
              <Card>
                <p slot="title">错误分布</p>
                <div>
                  <ViserPie
                    :data="database.pieChartDistribution"
                    :height="componentConfig.defaultChartHeight"
                    :padding="[50, 50, 50, 50]"
                    :isSpinShow="status.loading.pieChart"
                  />
                </div>
              </Card>
            </div>
            <div class="geography">
                  <Card>
                    <p slot="title">地理分布</p>
                    <Loading :isSpinShow="status.loading.geographyChart"></Loading>
                    <ve-map :data="geographyChartDistributionRecord"
                            :height="componentConfig.defaultChartHeight + 'px'"/>
                  </Card>
                  <Card style="height:550px">
                    <p slot="title">排名</p>
                    <Table
                      size='small'
                      :columns='componentConfig.cityColumnsConfig'
                      :data='database.provinceDistributionList'
                      :loading="status.loading.geographyChart"
                      :height="componentConfig.defaultChartHeight"
                    />
                  </Card>
            </div>
          </div>
    </div>

  </div>
</template>

<script>
  import _ from 'lodash'
  import moment from 'moment'
  import { Page } from 'iview'
  import VeMap from 'v-charts/lib/map.common'
  import * as ErrorApi from 'src/api/error'
  import DATE_FORMAT from 'src/constants/date_format'
  import TimeBar from 'src/view/components/time-bar'
  import Loading from 'src/view/components/loading/loading.vue'
  import StackArea from 'src/view/components/viser-stack/viser-stack.vue'
  import ViserPie from 'src/view/components/viser-pie/viser-pie.vue'
  import DataSet from '@antv/data-set'

  let urlColumnConfig = [
    {
      title: '数量',
      key: 'value',
      width: 100
    },
    {
      title: 'URL',
      key: 'name',
      width: 400
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
      width: 200,
      key: 'date',
      render: (h, params) => {
        const {row} = params
        return h('div', moment.unix(row.log_at).format(DATE_FORMAT.DISPLAY_BY_SECOND))
      }
    },
    {
      title: 'error_name',
      key: 'error_name',
      width: 400
    },
    {
      title: 'URL',
      key: 'url',
      width: 500
    },
    {
      title: 'http_code',
      key: 'http_code',
      width: 100
    },
    {
      title: '扩展信息',
      align: 'center',
      type: 'expand',
      width: 300,
      render: (h, params) => {
        let ext = _.get(params, ['row', 'ext'], '')

        let formatExt = {}
        // 对ext 下的key进行二次解析, 方便查看
        for(let extKey of Object.keys(ext)){
            let valueJSON = ext[extKey]
            let value
            try{
              value = JSON.parse(valueJSON)
            }catch(e){
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
    },
    {
      title: '地域',
      key: 'position',
      render: (h, params) => {
        let province = _.get(params, ['row', 'province'], '')
        let city = _.get(params, ['row', 'city'], '')
        return h('div', `${province} ${city}`)
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
      formatter: (indexAt) => { return moment.unix(indexAt).format('HH:00')},
      alias: '时间',
      type: 'time', // 声明该数据的类型
      // tickCount: 30, // 共显示多少个横坐标,默认五个  文档地址 => https://antvis.github.io/g2/doc/tutorial/start/axis.html
      // range: [0.02, 0.98], // 控制横轴两边的留白
    }
  ]

  export default {
    name: 'home',
    components: {
      Page,
      VeMap,
      TimeBar,
      Loading,
      StackArea,
      ViserPie,
    },
    data () {
      return {
        // 常量
        CONSTANT: {
          // 日期常量, 包括单位/常用日期格式化字符串, 自constants中导入
          DATE_FORMAT,
        },
        // 页面状态
        status: {
          selectDate: moment().toDate(),
          selectedErrorNameList: [],
          selectedUrl: '',
          loading: {
            errorDistributionSummary: true,
            urlList: true,
            stackAreaChart: true,
            pieChart: true,
            geographyChart: true,
            errorLogChart: true,
          }
        },
        // 表格配置项
        componentConfig: {
          urlChartHeight: 1430,     // 强行hack, 使之略大于右侧三个表格总高度, 保证页面样式
          defaultChartHeight: 400,  // 图表chart高度
          urlColumnConfig,
          stackAreaScale,
          cityColumnsConfig,
          errorLogColumnsConfig,
        },
        // 数据
        // 错误分布
        database: {
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
              total: 0,
            }
          },
        },

      }
    },
    async mounted () {
      await this.fetchErrorDistributionList()
      await this.updateRecord(true)
    },
    methods: {
      async fetchErrorDistributionList () {
        // 启动&关闭 loading
        this.status.loading.errorDistributionSummary = true
        let response = await ErrorApi.fetchErrorDistributionList()
        this.status.loading.errorDistributionSummary = false

        let errorDistributionList = _.get(response, ['data'], [])
        this.database.errorDistributionList = errorDistributionList

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
      },
      async fetchUrlList () {
        this.status.loading.urlList = true
        let response = await ErrorApi.fetchUrlList(this.startAt, this.endAt, this.status.selectedErrorNameList)
        this.status.loading.urlList = false
        this.database.urlList = _.get(response, ['data'], [])
      },
      async fetchStackAreaRecordList () {
        this.status.loading.stackAreaChart = true
        let response = await ErrorApi.fetchStackAreaRecordList(this.CONSTANT.DATE_FORMAT.UNIT.HOUR, this.startAt, this.endAt, this.status.selectedErrorNameList, this.status.selectedUrl)
        this.status.loading.stackAreaChart = false
        let rawStackAreaRecordList = _.get(response, ['data'], [])
        let stackAreaRecordList = []
        // 组件使用index字段作为纵轴
        for (let rawStackAreaRecord of rawStackAreaRecordList) {
          stackAreaRecordList.push(rawStackAreaRecord)
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
            _expanded: true // 自动展开
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
            total,
          },
          recordList
        }
      },

      async handleDateChange (selectDateStr) {
        let selectDate = moment(selectDateStr, 'YYYY-MM-DD').clone().toDate()
        this.status.selectDate = selectDate
        // 日期范围更新后重选数据
        await this.updateRecord(true)
      },
      async handleSelectUrl (record, index) {
        let url = _.get(record, ['name'], '')
        if (url === this.status.selectedUrl) {
          // 重复点击时应取消选择
          this.status.selectedUrl = ''
          console.log('remove choose url =>', url)
        } else {
          console.log('choose url =>', url)
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
        console.log('换页, newPageNo=>', newPageNo)
        this.database.errorLog.pager.currentPage = newPageNo
        await this.fetchErrorLog()
      },

      isDateDisabled (testDate) {
        let testAt = moment(testDate).startOf(this.CONSTANT.DATE_FORMAT.UNIT.DAY).unix()
        let nowAt = moment().startOf(this.CONSTANT.DATE_FORMAT.UNIT.DAY).unix()
        // 只能查看最近7天的数据
        let isSelectable = (nowAt - 86400 * 7) <= testAt && testAt <= nowAt
        return isSelectable === false
      }
    },
    computed: {
      startAt () {
        let startAtDate = _.get(this, ['status', 'selectDate'], new Date())
        let startAt = moment(startAtDate).startOf(this.CONSTANT.DATE_FORMAT.UNIT.DAY).unix()
        return startAt
      },
      endAt () {
        let endAtDate = _.get(this, ['status', 'selectDate'], new Date())
        let endAt = moment(endAtDate).endOf(this.CONSTANT.DATE_FORMAT.UNIT.DAY).unix()
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
            '次数': timeCount,
          }
          recordList.push(record)
        }

        let finialRecordConfig = {
          columns: ['位置', '次数'],
          rows: recordList,
        }
        return finialRecordConfig
      }
    }
  }
</script>

<style lang="less" scoped>

  .message{
    font-size:1vw
  }

  .date-selector, .error-distribution-summary {
    width: 100%;
  }

  .dashboard {
    height: 100%;
    
  }

  .url-list {
    height: 100%;
    
  }

</style>

<style lang="less" >
  // jsx中无法使用scope, 需要为jsx部分人工构建scope
  .error-dashboard-jsx-root{
     .ext-json pre {
       white-space: pre-wrap;
     }
  }
</style>

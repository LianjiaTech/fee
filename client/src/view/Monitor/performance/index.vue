<!-- @format -->

<template>
  <div class="container">
    <div :data-response-data="`${watchSelectTimeRange}-${watchSelectUrl}`" />
    <el-container>
      <el-header direction="horizontal" style="text-align: right;padding:0">
        <div class="header">
          <!-- <Input  :on-search="fuzzySearch" v-model="allUrl" search enter-button placeholder="输入URL进行模糊匹配" style="width: 400px;margin-right:10px;" /> -->
          <Select
            transfer
            :value="allUrl.currentUrl"
            :placeholder="`输入${status.groupBy}进行查询`"
            style="width: 400px;margin-right:10px;"
            size="large"
            filterable
            clearable
            transfer-class-name="url-transfer-wrap"
            @on-change="handleSelectUrlChange"
          >
            <Icon type="md-radio-button-on" slot="prefix" size="20" />
            <Option v-for="(url, index) in allUrl[status.groupBy]" :value="url" :key="index">{{ url }}</Option>
          </Select>
          <div class="date-time-range-picker" style="margin-right:10px;">
            <DatetimeRangePicker :startAt.sync="status.startAt" :endAt.sync="status.endAt" :pickerOptions="constant.pickerOptions" />
          </div>
          <el-radio-group v-model="status.groupBy" @change="() => (this.allUrl.currentUrl = '')">
            <el-radio-button :label="constant.groupBy.pageType">按PageType归类</el-radio-button>
            <el-radio-button :label="constant.groupBy.url">按url归类</el-radio-button>
          </el-radio-group>
        </div>
      </el-header>
      <el-container>
        <el-container style="flex-grow:0;width: 34vw">
          <el-card style="width:100%">
            <el-aside style="width:100%">
              <el-card class="box-card" :body-style="{ padding: 0 }">
                <div class="url-list">
                  <el-table
                    ref="urlList"
                    show-summary
                    sum-text="汇总数据"
                    :summary-method="getSummaries"
                    v-loading="loading.urlList"
                    :data="database.urlList"
                    highlight-current-row
                    border
                    height="73vh"
                    max-height="73vh"
                    @current-change="handleCurrentChange"
                  >
                    <el-table-column prop="url" min-width="200" align="left" max-height="80vh">
                      <template slot="header" slot-scope="scope">
                        <span>页面</span>
                        <el-tooltip class="item" effect="dark" content="点击切换图表数据, 拖动边框调整列宽, 鼠标停留片刻可查看具体页面地址;此URL列表是最近10天的数据。" placement="right">
                          <i class="el-icon-info"></i>
                        </el-tooltip>
                      </template>
                      <template slot-scope="scope">
                        <el-popover placement="top" trigger="hover" :content="scope.row.url">
                          <span class="url-detail" slot="reference">{{ scope.row.url }}</span>
                        </el-popover>
                      </template>
                    </el-table-column>
                    <el-table-column prop="average_value" width="150" align="right">
                      <template slot="header" slot-scope="scope">
                        <el-tooltip class="item" effect="dark" content="平均页面完全加载时长(ms)" placement="right">
                          <span>加载时长/样本数</span>
                        </el-tooltip>
                      </template>
                      <template slot-scope="scope">
                        <span slot="reference">{{ scope.row.average_value }}ms/{{ scope.row.pv }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </el-aside>
          </el-card>
        </el-container>
        <el-container style="flex-grow:0;width: 66vw">
          <!-- <el-main> -->
          <el-card class="box-card" style="width:100%">
            <div class="dashboard">
              <el-tabs value="first" style="width:100%" @tab-click="handleTabClick">
                <el-tab-pane label="性能详情" name="first" lazy>
                  <el-card class="box-card" v-loading="loading.lineChart">
                    <div slot="header" class="clearfix">
                      <el-radio-group v-model="status.lineChart.indicatorType" size="small">
                        <el-radio-button :label="constant.lineChart.indicatorType.keyType">关键性能指标</el-radio-button>
                        <el-radio-button :label="constant.lineChart.indicatorType.rangeType">区间段耗时</el-radio-button>
                      </el-radio-group>
                    </div>
                    <div>
                      <ve-line
                        ref="lineChart"
                        :data="lineChartDataList"
                        :settings="lineChartSetting"
                        :legend="{
                          // 默认不展示样本数
                          selected: {
                            样本数: false
                          }
                        }"
                      ></ve-line>
                    </div>
                  </el-card>
                  <el-card class="box-card" v-loading="loading.indicatorDistribution">
                    <div slot="header" class="clearfix">
                      <el-select v-model="status.indicatorDistribution.indicator" placeholder="请选择">
                        <el-option-group key="区间段耗时" label="区间段耗时">
                          <el-option v-for="indicator in constant.indicator.RANGE_INDICATOR_TYPE_LIST" :key="indicator" :label="constant.indicator.INDICATOR_TYPE_MAP[indicator]" :value="indicator"></el-option>
                        </el-option-group>
                        <el-option-group key="关键性能指标" label="关键性能指标">
                          <el-option v-for="indicator in constant.indicator.KEY_INDICATOR_TYPE_LIST" :key="indicator" :label="constant.indicator.INDICATOR_TYPE_MAP[indicator]" :value="indicator"></el-option>
                        </el-option-group>
                      </el-select>
                    </div>
                    <div>
                      <ve-line ref="indicatorDistributionChart" :data="indicatorDictributionDataList" :settings="indicatorDictributionSetting"></ve-line>
                    </div>
                    <div>
                      <p>&nbsp</p>
                      <el-radio-group v-model="status.envBy">
                        <el-radio-button :label="constant.envBy.ENV_BY_PROVINCE">省份</el-radio-button>
                        <el-radio-button :label="constant.envBy.ENV_BY_OS">系统</el-radio-button>
                        <el-radio-button :label="constant.envBy.ENV_BY_BROWSER">浏览器</el-radio-button>
                        <el-radio-button :label="constant.envBy.ENV_BY_DEVICE">设备类型</el-radio-button>
                      </el-radio-group>
                      <p>&nbsp</p>
                      <el-table border ref="distributionDetail" v-loading="loading.distributionDetail[status.envBy]" :data="distributionDetail">
                        <el-table-column :label="constant.envBy.ENV_BY_MAP[status.envBy]" width="130" prop="version" align="left"></el-table-column>
                        <el-table-column label="样本数" prop="total" align="left"></el-table-column>
                        <el-table-column :label="`${constant.indicator.INDICATOR_TYPE_MAP[status.indicatorDistribution.indicator]}  指标分布区间(单位:ms)`" prop="during_ms_distribution_map" align="left">
                          <el-table-column label="<50" width="75">
                            <template slot-scope="scope">
                              <span>{{ scope.row.during_ms_distribution_map['50'] }}%</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="50~200">
                            <template slot-scope="scope">
                              <span>{{ scope.row.during_ms_distribution_map['200'] }}%</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="200~500">
                            <template slot-scope="scope">
                              <span>{{ scope.row.during_ms_distribution_map['500'] }}%</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="500~1000">
                            <template slot-scope="scope">
                              <span>{{ scope.row.during_ms_distribution_map['1000'] }}%</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="1000~2500">
                            <template slot-scope="scope">
                              <span>{{ scope.row.during_ms_distribution_map['2500'] }}%</span>
                            </template>
                          </el-table-column>
                          <el-table-column label=">2500">
                            <template slot-scope="scope">
                              <span>{{ scope.row.during_ms_distribution_map['>2500'] }}%</span>
                            </template>
                          </el-table-column>
                        </el-table-column>
                      </el-table>
                    </div>
                  </el-card>
                </el-tab-pane>
                <el-tab-pane label="性能概览" name="second" lazy>
                  <el-card class="box-card" v-loading="loading.overview">
                    <div slot="header" class="clearfix">
                      <div style="font-size:16px;font-weight:400;">
                        总体性能指标 (已选时间范围内)
                        <el-popover placement="top-start" title="性能指标计算方式" trigger="click">
                          <div>
                            <p>根据performance.timing对象中记录的页面性能, 计算下值</p>
                            <p>&nbsp;</p>
                            <p>关键性能指标:</p>
                            <p>&nbsp;</p>
                            <p>首次渲染: responseEnd - fetchStart</p>
                            <p>首屏时间: first meaningful paint</p>
                            <p>首次可交互: domInteractive - fetchStart</p>
                            <p>DOM Ready: domContentLoadEventEnd - fetchStart</p>
                            <p>页面完全加载: loadEventStart - fetchStart</p>
                            <p>&nbsp;</p>
                            <p>&nbsp;</p>
                            <p>区间段耗时:</p>
                            <p>&nbsp;</p>
                            <p>DNS查询: domainLookupEnd - domainLookupStart</p>
                            <p>TCP连接: connectEnd - connectStart</p>
                            <p>请求响应: responseStart - requestStart</p>
                            <p>内容传输: responseEnd - responseStart</p>
                            <p>DOM解析: domInteractive - responseEnd</p>
                            <p>资源加载: loadEventStart - domContentLoadedEventEnd</p>
                            <p>&nbsp;</p>
                            <p>&nbsp;</p>
                            <p>参考:</p>
                            <a href="https://help.aliyun.com/document_detail/60288.html?spm=arms_retcode.retcode_console.0.0.238433523EOTuo#%E8%AE%BF%E9%97%AE%E9%80%9F%E5%BA%A6" target="_blank">统计指标定义说明</a>
                          </div>
                          <i class="el-icon-question" slot="reference"></i>
                        </el-popover>
                      </div>
                    </div>
                    <div>
                      <!-- 没研究出来垂直瀑布图咋画的(echart&antV), 先用之前的顶上 -->
                      <v-chart :forceFit="true" :padding="[20, 80, 70, 110]" height="400" :data="overviewForAntv">
                        <v-coord type="rect" direction="LB" />
                        <v-tooltip data-key="profession*range" />
                        <v-legend />
                        <v-axis data-key="profession" :label="{ offset: 12 }" />
                        <v-bar position="profession*range" color="profession" />
                      </v-chart>
                    </div>
                  </el-card>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
          <!-- </el-main> -->
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script>
  /** @format */

  import moment from 'moment'
  import DATE_FORMAT from 'src/constants/date_format'
  import PerformanceApi from 'src/api/performance'
  import DatetimeRangePicker from 'src/components/datetime-range-picker.vue'
  import DataSet from '@antv/data-set'
  import _ from 'lodash'

  const INDICATOR_TYPE_DNS查询耗时 = 'dns_lookup_ms'
  const INDICATOR_TYPE_TCP连接耗时 = 'tcp_connect_ms'
  const INDICATOR_TYPE_请求响应耗时 = 'response_request_ms'
  const INDICATOR_TYPE_内容传输耗时 = 'response_transfer_ms'
  const INDICATOR_TYPE_DOM解析耗时 = 'dom_parse_ms'
  const INDICATOR_TYPE_资源加载耗时 = 'load_resource_ms'

  const INDICATOR_TYPE_首次渲染耗时 = 'first_render_ms'
  const INDICATOR_TYPE_首包时间耗时 = 'first_tcp_ms'
  const INDICATOR_TYPE_首次可交互耗时 = 'first_response_ms'
  const INDICATOR_TYPE_DOM_READY_耗时 = 'dom_ready_ms'
  const INDICATOR_TYPE_页面完全加载耗时 = 'load_complete_ms'
  const INDICATOR_TYPE_首屏加载耗时 = 'first_screen_ms'

  // 只能通过中括号形式设置key值
  const INDICATOR_TYPE_MAP = {}
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_DNS查询耗时] = 'DNS查询耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_TCP连接耗时] = 'TCP连接接耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_请求响应耗时] = '请求响应耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_内容传输耗时] = '内容传输耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_DOM解析耗时] = 'DOM解析耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_资源加载耗时] = '资源加载耗时'

  INDICATOR_TYPE_MAP[INDICATOR_TYPE_首包时间耗时] = '首包时间耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_首次渲染耗时] = '首次渲染耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_首次可交互耗时] = '首次可交互耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_DOM_READY_耗时] = 'DOM_READY_耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_页面完全加载耗时] = '页面完全加载耗时'
  INDICATOR_TYPE_MAP[INDICATOR_TYPE_首屏加载耗时] = '首屏加载耗时'

  const KEY_INDICATOR_TYPE_LIST = [INDICATOR_TYPE_DNS查询耗时, INDICATOR_TYPE_TCP连接耗时, INDICATOR_TYPE_请求响应耗时, INDICATOR_TYPE_内容传输耗时, INDICATOR_TYPE_DOM解析耗时, INDICATOR_TYPE_资源加载耗时]

  const RANGE_INDICATOR_TYPE_LIST = [INDICATOR_TYPE_首次渲染耗时, INDICATOR_TYPE_首包时间耗时, INDICATOR_TYPE_首次可交互耗时, INDICATOR_TYPE_DOM_READY_耗时, INDICATOR_TYPE_页面完全加载耗时, INDICATOR_TYPE_首屏加载耗时]

  const ALL_INDICATOR_TYPE_LIST = Object.keys(INDICATOR_TYPE_MAP)

  const ENV_BY_DEVICE = 'device'
  const ENV_BY_OS = 'os'
  const ENV_BY_BROWSER = 'browser'
  const ENV_BY_PROVINCE = 'province'

  const ENV_BY_MAP = {
    [ENV_BY_DEVICE]: '设备',
    [ENV_BY_OS]: '系统',
    [ENV_BY_BROWSER]: '浏览器',
    [ENV_BY_PROVINCE]: '省份'
  }

  export default {
    components: {
      DatetimeRangePicker
    },
    data() {
      return {
        constant: {
          pickerOptions: {
            disabledDate: (value) => {
              let now = new Date()
              if (value > now) return true
              if (now - value > 86400000 * 31) return true
              return false
            }
          },
          groupBy: {
            // 和后端保持一致
            pageType: 'pageType',
            url: 'url'
          },
          lineChart: {
            indicatorType: {
              // 和后端保持一致
              keyType: 'key',
              rangeType: 'range'
            }
          },
          indicator: {
            INDICATOR_TYPE_MAP,
            KEY_INDICATOR_TYPE_LIST,
            RANGE_INDICATOR_TYPE_LIST,
            ALL_INDICATOR_TYPE_LIST
          },
          envBy: {
            ENV_BY_DEVICE,
            ENV_BY_OS,
            ENV_BY_PROVINCE,
            ENV_BY_BROWSER,
            ENV_BY_MAP
          }
        },
        allUrl: {
          pageType: [],
          url: [],
          currentUrl: ''
        },
        status: {
          startAt: moment()
            .subtract(1, DATE_FORMAT.UNIT.DAY)
            .startOf(DATE_FORMAT.UNIT.DAY)
            .unix(),
          endAt: moment()
            .endOf(DATE_FORMAT.UNIT.MINUTE)
            .unix(),
          groupBy: 'pageType',
          selectUrl: '',
          envBy: ENV_BY_PROVINCE,
          lineChart: {
            indicatorType: 'key'
          },
          indicatorDistribution: {
            indicator: INDICATOR_TYPE_页面完全加载耗时
          }
        },
        loading: {
          urlList: false,
          lineChart: false,
          indicatorDistribution: false,
          overview: false,
          distributionDetail: {
            os: false,
            browser: false,
            province: false,
            device: false
          }
        },
        database: {
          urlList: [],
          lineChartDataList: [],
          indicatorDistribution: {},
          overview: {},
          distributionDetail: {
            os: [],
            browser: [],
            province: [],
            device: []
          }
        }
      }
    },
    methods: {
      async asyncGetUrlList(params = {}) {
        this.loading.urlList = true
        const response = await PerformanceApi.asyncGetUrlDictributionList(this.status.startAt, this.status.endAt, this.status.groupBy, _.get(params, ['urlList'], ''))
        this.loading.urlList = false
        let recordList = _.get(response, ['data'], []) || []
        // 对url除去query相同得部分进行合并
        const records = []
        for (const item of recordList) {
          let { url } = item
          //item.url = url.replace(/[\/].+$/, '')
          item.url = url.replace(/[\?\&].+$/, '')
          const record = records.find((record) => record.url === item.url)
          if (record) {
            let { average_value, pv } = record
            const { average_value: avg_value, pv: num, url } = item
            const total = average_value * pv + avg_value * num
            record.pv = pv + num
            record.average_value = parseInt(total / record.pv)
          } else {
            records.push(item)
          }
        }
        // 进行合并
        this.database.urlList = records
      },
      handleCurrentChange(currentRow) {
        if (!currentRow) return
        this.status.selectUrl = _.get(currentRow, 'url', '')
      },

      /**
       * 获取页面加载时长折线图数据
       */
      async asyncGetLineChartData() {
        this.loading.lineChart = true
        let countBy = DATE_FORMAT.UNIT.HOUR
        let duringS = this.status.endAt - this.status.startAt
        if (duringS < 86400) {
          countBy = DATE_FORMAT.UNIT.MINUTE
        } else {
          if (duringS < 86400 * 10) {
            countBy = DATE_FORMAT.UNIT.HOUR
          } else {
            countBy = DATE_FORMAT.UNIT.DAY
          }
        }

        let urlList = []
        if (this.status.selectUrl !== '') {
          urlList.push(this.status.selectUrl)
        }
        let response = await PerformanceApi.asyncGetLineChartDataList(this.status.startAt, this.status.endAt, urlList, this.status.groupBy, countBy)
        this.loading.lineChart = false
        let recordList = _.get(response, ['data'], [])
        this.database.lineChartDataList = recordList
        // 更新完数据后resize一下界面, 以便获取div宽度
        this.chartResize()
      },

      /**
       * 获取指标分布数据
       */
      async asyncGetIndicatorDictribution() {
        this.loading.indicatorDistribution = true
        let urlList = []
        if (this.status.selectUrl !== '') {
          urlList.push(this.status.selectUrl)
        }
        let response = await PerformanceApi.asyncGetIndicatorDictribution(this.status.startAt, this.status.endAt, urlList, this.status.groupBy)
        this.loading.indicatorDistribution = false
        let recordMap = _.get(response, ['data'], [])
        this.database.indicatorDistribution = recordMap
        // 更新完数据后resize一下界面, 以便获取div宽度
        this.chartResize()
      },

      /**
       * 获取总体指标数据
       */
      async asyncGetOverview() {
        this.loading.overview = true
        let urlList = []
        if (this.status.selectUrl !== '') {
          urlList.push(this.status.selectUrl)
        }
        let response = await PerformanceApi.asyncGetOverview(this.status.startAt, this.status.endAt, urlList, this.status.groupBy)
        this.loading.overview = false
        let overview = _.get(response, ['data'], [])
        this.database.overview = overview
        // 更新完数据后resize一下界面, 以便获取div宽度
        this.chartResize()
      },

      async asyncGetPercentLineByEnv(envBy = ENV_BY_OS) {
        let key = 'os'
        switch (envBy) {
          case ENV_BY_DEVICE:
            key = 'device'
            break
          case ENV_BY_BROWSER:
            key = 'browser'
            break
          case ENV_BY_PROVINCE:
            key = 'province'
            break
          case ENV_BY_OS:
          default:
            key = 'os'
        }
        this.loading.distributionDetail[key] = true
        let urlList = []
        if (this.status.selectUrl !== '') {
          urlList.push(this.status.selectUrl)
        }
        let response = await PerformanceApi.asyncGetPercentLineByEnv(this.status.startAt, this.status.endAt, urlList, this.status.groupBy, envBy)
        this.loading.distributionDetail[key] = false
        let detail = _.get(response, ['data'], {})
        this.database.distributionDetail[key] = detail
      },

      handleTabClick() {
        this.chartResize()
      },
      // 更新数据
      async asyncUpdateUrlList() {
        // 清空所选url
        this.status.selectUrl = ''
        await this.asyncGetUrlList()
        // 等待有数据之后， 默认选择第0行
        this.$refs.urlList.setCurrentRow(this.$refs.urlList.data[0] || '')
      },

      async chartResize() {
        this.$refs['lineChart'].echarts && this.$refs['lineChart'].echarts.resize()
        this.$refs['indicatorDistributionChart'].echarts && this.$refs['indicatorDistributionChart'].echarts.resize()
        // @todo(yaozeyuan) 一个诡异的方法, 暂时还没找到在哪儿定义的
        this.resize()
      },
      // 模糊搜索URL
      async fetchAllUrl() {
        let result = await PerformanceApi.fetchUrlList(this.status.startAt, this.status.endAt, 1000)
        let { urlList, pageTypeList } = _.get(result, ['data'], {})
        let pageType = (pageTypeList = pageTypeList.filter((item) => item !== ''))
        let url = urlList.filter((item) => item !== '')
        this.allUrl = {
          pageType,
          url,
          currentUrl: ''
        }
      },
      async handleSelectUrlChange(url) {
        if (!url) {
          this.allUrl.currentUrl = url
          this.status.selectUrl = _.get(this.database, ['urlList', 0], '')
          return
        }
        this.status.selectUrl = url
        this.allUrl.currentUrl = url
      },
      getSummaries(param) {
        const { columns, data } = param
        const sums = []
        columns.forEach((column, index) => {
          if (index === 0) {
            sums[index] = '汇总'
            return
          }
          const urlCount = data.length || 0
          const values = data.map((item) => Number(item[column.property]))
          if (!values.every((value) => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              } else {
                return prev
              }
            }, 0)
            sums[index] = `平均时长: ${Math.floor(sums[index] / urlCount)}ms;页面地址: ${urlCount}个`
          } else {
            sums[index] = 'N/A'
          }
        })
        return sums
      }
    },
    mounted() {
      this.asyncUpdateUrlList()
      this.fetchAllUrl()
    },
    computed: {
      watchSelectTimeRange() {
        // 每当时间范围变动, 主动触发一次url列表更新请求
        this.asyncUpdateUrlList()
        return `${this.status.startAt}-${this.status.endAt}-${this.status.groupBy}`
      },
      watchSelectUrl() {
        if (this.status.selectUrl === '') {
          // 等选择了url之后, 再去请求数据
          return ''
        }
        // 每当所选url变动, 主动触发一次报表更新请求
        this.asyncGetOverview()
        this.asyncGetLineChartData()
        this.asyncGetIndicatorDictribution()
        this.asyncGetPercentLineByEnv(ENV_BY_DEVICE)
        this.asyncGetPercentLineByEnv(ENV_BY_OS)
        this.asyncGetPercentLineByEnv(ENV_BY_BROWSER)
        this.asyncGetPercentLineByEnv(ENV_BY_PROVINCE)
        return `${this.status.selectUrl}-`
      },
      lineChartDataList() {
        let result = {}
        let columns = []
        let rows = []
        let indicatorTypeList = []

        if (this.status.lineChart.indicatorType === this.constant.lineChart.indicatorType.keyType) {
          // 关键性能指标
          indicatorTypeList = KEY_INDICATOR_TYPE_LIST
        } else {
          indicatorTypeList = RANGE_INDICATOR_TYPE_LIST
        }

        // 第一列数据是横轴
        columns.push('日期')
        for (let indicator of indicatorTypeList) {
          let name = INDICATOR_TYPE_MAP[indicator]
          columns.push(name)
        }
        columns.push('样本数')

        // 将旧key转换为新key
        for (let oldRecord of this.database.lineChartDataList) {
          let newRecord = {}
          for (let indicator of indicatorTypeList) {
            let key = INDICATOR_TYPE_MAP[indicator]
            let value = _.get(oldRecord, [indicator], 0)
            newRecord[key] = value
          }
          // 添加样本数
          let total = _.get(oldRecord, ['total'], 0)
          newRecord['样本数'] = total

          // 手工录入时间key
          let indexAt = oldRecord['index']
          let dateYmdHis = moment.unix(indexAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)
          newRecord['日期'] = dateYmdHis
          rows.push(newRecord)
        }
        result['columns'] = columns
        result['rows'] = rows

        return result
      },
      lineChartSetting() {
        let isArea = true
        let setting = {}

        if (this.status.lineChart.indicatorType === this.constant.lineChart.indicatorType.rangeType) {
          return setting
        }
        let stackList = []
        let indicatorTypeList = KEY_INDICATOR_TYPE_LIST
        // 关键性能指标
        isArea = true

        for (let indicator of indicatorTypeList) {
          let name = INDICATOR_TYPE_MAP[indicator]
          stackList.push(name)
        }
        setting['stack'] = { 汇总数据: stackList }
        setting['area'] = isArea

        return setting
      },
      indicatorDictributionDataList() {
        let indicator = this.status.indicatorDistribution.indicator
        let recordList = _.get(this.database, ['indicatorDistribution', indicator], [])
        let columns = ['响应时长', '区间样本数']
        let rows = []
        for (let record of recordList) {
          let duringMs = _.get(record, ['during_ms'], '')
          let itemCount = _.get(record, ['item_count'], 0)
          rows.push({
            响应时长: `${duringMs}ms`,
            区间样本数: itemCount
          })
        }
        let chartData = {
          columns,
          rows
        }
        return chartData
      },
      indicatorDictributionSetting() {
        return {
          // smooth: true
        }
      },
      overviewForAntv() {
        let { dns_lookup_ms = 0, tcp_connect_ms = 0, ssl_connect_ms = 0, response_request_ms = 0, dom_parse_ms = 0, response_transfer_ms = 0, load_resource_ms = 0 } = this.database.overview
        const sourceData = [
          {
            profession: 'DNS查询',
            highest: dns_lookup_ms,
            minimum: 0,
            mean: 56636
          },
          {
            profession: 'TCP连接',
            highest: dns_lookup_ms + tcp_connect_ms,
            minimum: dns_lookup_ms,
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
        return dv.rows
      },
      distributionDetail() {
        let distributiolList = _.get(this.database.distributionDetail, [this.status.envBy, this.status.indicatorDistribution.indicator], [])
        return distributiolList
      }
    }
  }
</script>

<style lang="less" scoped>
  /** @format */

  .header {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .url-list {
    .url-detail {
      overflow: hidden;
      word-break: normal;
    }
  }

  .el-tab-pane {
    transition: display 1s;
  }
</style>
<style>
  /** @format */

  .url-transfer-wrap {
    max-width: 300px;
  }
</style>

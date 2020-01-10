<!-- @format -->

<template>
  <div class="container-d85ac9">
    <div class="control-panel-header">
      <div class="date-selector">
        <Card shadow style="width:100%">
          <Row>
            <Col span="6" style="width:310px">
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
                  :options="{ disabledDate: isDateDisabled }"
                />
              </div>
            </Col>
            <Button @click="handleAutoFreshClick" size="large" class="error-dashboard-auto-fresh-button" style="height:100%">
              <i ref="auto_fresh_item"></i>
              {{ status.autoFresh.isOpen ? '关闭自动刷新' : '开启自动刷新' }}
              {{ status.autoFresh.timeCount }}
            </Button>
            <Select v-model="selectedPrefix" style="width:400px;position:absolute;right:5px" size="large" filterable clearable placeholder="请输入报警名称进行模糊匹配" transfer @on-change="handlePrefixChange">
              <Option v-for="item in database.prefixList" :value="item" :key="item">{{ item }}</Option>
            </Select>
          </Row>
        </Card>
      </div>

      <div class="error-distribution-summary" style="position:relative">
        <Row>
          <Col span="24">
            <Loading :isSpinShow="this.status.loading.errorDistributionSummary"></Loading>
            <Card shadow style="width:100%">
              <Tabs type="card" v-model="status.errorSearchType">
                <TabPane label="错误类型" name="errorNames">
                  <Row :gutter="10" type="flex" align="top">
                    <Col>
                      <h4>默认展示按照数量排序前十的错误类型, 其他错误类型请自行选择：</h4>
                    </Col>
                    <Col> <InputNumber style="width: 70px;" size="large" :min="1" v-model="status.errorNameTopCount" on-blur></InputNumber>&nbsp;条 </Col>
                  </Row>
                  <br />
                  <SelectWrap
                    :origin-selected-list="status.originSelectedErrorNameList"
                    :selected-list="status.selectedErrorNameList"
                    :selected-top-count="status.errorNameTopCount"
                    :options-list="database.errorDistributionList"
                    @change="handleSelectErrorNameChange"
                    @reset="handleSelectErrorNameReset"
                  />
                </TabPane>
                <TabPane label="错误详情" name="errorDetail" class="center-card-box">
                  <div class="item">
                    <h4>用错误详情(extra中的部分内容)进行查询：</h4>
                    <br />
                    <Input v-model="database.errorDetail" placeholder="错误详情进行查询" style="width: 100%">
                      <Button slot="append" icon="ios-search" @click="handleSearchErrorDetail"></Button>
                    </Input>
                  </div>
                </TabPane>
                <TabPane label="uuid查询" name="errorUuid" class="center-card-box">
                  <div class="item">
                    <h4>用uuid进行查询：</h4>
                    <br />
                    <Input v-model="database.errorUuid" placeholder="用uuid进行查询" style="width: 100%">
                      <Button slot="append" icon="ios-search" @click="handleSearchErrorDetail"></Button>
                    </Input>
                  </div>
                </TabPane>
                <TabPane label="ucid查询" name="errorUcid" class="center-card-box">
                  <div class="item">
                    <h4>用ucid进行查询：</h4>
                    <br />
                    <Input v-model="database.errorUcid" placeholder="用ucid进行查询" style="width: 100%">
                      <Button slot="append" icon="ios-search" @click="handleSearchErrorDetail"></Button>
                    </Input>
                  </div>
                </TabPane>
              </Tabs>
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
              <Tabs type="card">
                <TabPane label="url划分">
                  <Poptip v-model="status.isShowTip" style="position:absolute;z-index:1000;left:167px;" placement="right" width="200">
                    <div class="poptip-content" slot="content">
                      <p>单击URL, 可以查看该URL对应的数据哦!</p>
                      <a @click="status.isShowTip = false">关闭</a>
                    </div>
                  </Poptip>
                  <div style="padding: 10px">
                    前
                    <Select v-model="topCount" style="width:80px">
                      <Option v-for="item in [10, 100, 300, 500, 800, 1000]" :value="item" :key="item">{{ item }}</Option> </Select
                    >条
                  </div>
                  <Table ref="urlListTable" :highlight-row="true" :columns="componentConfig.urlColumnConfig" :data="database.urlList" @on-row-click="handleSelectUrl" :loading="status.loading.urlList" :height="590" />
                </TabPane>
                <TabPane label="错误详情划分">
                  <Poptip v-model="status.isShowTip" style="position:absolute;z-index:1000;left:167px;" placement="right" width="200">
                    <div class="poptip-content" slot="content">
                      <p>单击URL, 可以查看该URL对应的数据哦!</p>
                      <a @click="status.isShowTip = false">关闭</a>
                    </div>
                  </Poptip>
                  <div style="padding: 10px;">
                    前
                    <Select v-model="topCount" style="width:80px">
                      <Option v-for="item in [10, 100, 300, 500, 800, 1000]" :value="item" :key="item">{{ item }}</Option> </Select
                    >条
                  </div>
                  <Table ref="detailListTable" :highlight-row="true" :columns="componentConfig.detailColumnConfig" :data="database.detailList" @on-row-click="handleSelectUrl" :loading="status.loading.urlList" :height="590" />
                </TabPane>
              </Tabs>
            </Card>
          </div>
        </Col>
        <Col span="16">
          <Card shadow>
            <p slot="title"><Icon type="md-analytics" />监控视图</p>
            <the-body-chart
              :selectedErrorNameNum="status.selectedErrorNameList.length"
              :stackAreaRecordList="database.stackAreaRecordList"
              :isSpinShowStack="status.loading.stackAreaChart"
              :pieChartDistribution="database.pieChartDistribution"
              :isSpinShowPie="status.loading.pieChart"
              :isSpinShowMap="status.loading.geographyChart"
              :geographyChartDistributionRecord="geographyChartDistributionRecord"
              :Mapcolumns="componentConfig.cityColumnsConfig"
              :mapTableData="database.provinceDistributionList"
              :tableLoading="status.loading.geographyChart"
              v-on:listenHandleFilterChange="handleFilterChange"
            ></the-body-chart>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col span="24">
          <div class="dashboard-log">
            <div class="error-log-detail">
              <Card shadow>
                <Table :columns="componentConfig.errorLogColumnsConfig" :data="database.errorLog.recordList" :loading="status.loading.errorLogChart" @on-row-click="handleExtraExpand" />
                <Page @on-change="handlePageChange" :current="database.errorLog.pager.currentPage" :total="database.errorLog.pager.total" :page-size="database.errorLog.pager.pageSize" show-total show-elevator class="the-page_position" />
              </Card>
            </div>
          </div>
        </Col>
      </Row>
    </div>
    <Modal v-model="status.sourceMapModal" width="86%" @on-cancel="handleModalClose" class-name="info-modal_wrap">
      <p slot="header">
        <Icon type="ios-information-circle"></Icon>
        <span>日志详情</span>
      </p>
      <div class="modal-content">
        <Spin size="large" fix v-if="status.spinShow"></Spin>
        <Row :gutter="30">
          <Col span="16">
            <div class="divider">详情信息</div>
            <Poptip trigger="hover" content="全屏查看详情信息" placement="left-start" style="right:60px;position:absolute;">
              <Icon style="cursor: pointer" type="ios-expand" size="28" color="#2db7f5" @click.stop="toggleFullScreenView" />
            </Poptip>
            <Form :model="sourceInfo">
              <div class="error-extra_info">
                <pre v-html="sourceInfo.sourceData"></pre>
              </div>
              <div class="divider">映射源码</div>
              <Form-item>
                <Radio-group v-model="sourceInfo.getSourceMapType">
                  <Radio label="local">本地上传</Radio>
                  <Radio label="online">远程加载</Radio>
                  <div style="color: #ff3300">友情提示：慎将source map文件上传到公网地址，存在安全风险！</div>
                </Radio-group>
              </Form-item>
              <FormItem v-show="sourceInfo.getSourceMapType === 'local'">
                <Upload type="drag" :before-upload="beforeSourceMapUpload" action="/" style="width: 300px">
                  <div style="padding: 20px 0">
                    <Icon type="ios-cloud-upload" size="52" style="color: #3399ff"></Icon>
                    <p>点击或将sourceMap文件拖拽到这里上传</p>
                  </div>
                </Upload>
              </FormItem>
              <FormItem v-show="sourceInfo.getSourceMapType === 'online'">
                <Input v-model="sourceInfo.sourceMapUrl" placeholder="请输入远程map文件地址" style="width: 300px" />
              </FormItem>

              <div class="divider">自定义映射字段</div>
              <FormItem label="是否自定义">
                <i-switch v-model="sourceInfo.isCustom" size="large">
                  <span slot="open">是</span>
                  <span slot="close">否</span>
                </i-switch>
              </FormItem>
              <FormItem label="字段名称" v-show="sourceInfo.isCustom">
                <Input v-model="sourceInfo.fields" placeholder="extra下的字段，用点间隔" style="width: 200px">
                  <span slot="prepend">extra.</span>
                </Input>
              </FormItem>
              <FormItem>
                <Button type="primary" @click="() => handleTranslateSourceMap()">确定</Button>
              </FormItem>
            </Form>
          </Col>
          <Col span="8">
            <div class="divider">摘要信息</div>
            <Row>
              <Col span="6">生成时间：</Col>
              <Col span="18">{{ moment(tryGet(sourceInfo, ['sourceData', 'time_ms'], '')).format('YYYY-MM-DD HH:mm:ss') }}</Col>
            </Row>
            <Row>
              <Col span="6">上报时间：</Col>
              <Col span="18">{{ moment(tryGet(sourceInfo, ['sourceData', 'common', 'timestamp'], '')).format('YYYY-MM-DD HH:mm:ss') }}</Col>
            </Row>
            <Row>
              <Col span="6">前端版本：</Col>
              <Col span="18">{{ tryGet(sourceInfo, ['sourceData', 'common', 'runtime_version'], '') }}</Col>
            </Row>
            <Row>
              <Col span="6">SDK版本：</Col>
              <Col span="18">{{ tryGet(sourceInfo, ['sourceData', 'common', 'sdk_version'], '') }}</Col>
            </Row>
            <Row>
              <Col span="6">页面URL：</Col>
              <Col span="18">
                <a style="display: block;word-break: break-all;" target="_blank" :href="getUrl(tryGet(sourceInfo, ['sourceData', 'detail', 'url'], ''))">{{ tryGet(sourceInfo, ['sourceData', 'detail', 'url'], '') }}</a>
              </Col>
            </Row>
            <!-- 设备信息 -->
            <div class="divider">设备信息</div>
            <Row>
              <Col span="6">设备：</Col>
              <Col span="18">
                {{ tryGet(sourceInfo, ['sourceData', 'ua', 'device', 'vendor'], '-') }}
                {{ tryGet(sourceInfo, ['sourceData', 'ua', 'device', 'model'], '-') }}
              </Col>
            </Row>
            <Row>
              <Col span="6">操作系统：</Col>
              <Col span="18">
                {{ tryGet(sourceInfo, ['sourceData', 'ua', 'os', 'name'], '') }}
                {{ tryGet(sourceInfo, ['sourceData', 'ua', 'os', 'version'], '') }}
              </Col>
            </Row>
            <Row>
              <Col span="6">客户端：</Col>
              <Col span="18">
                {{ tryGet(sourceInfo, ['sourceData', 'ua', 'browser', 'name'], '') }}
                {{ tryGet(sourceInfo, ['sourceData', 'ua', 'browser', 'version'], '') }}
              </Col>
            </Row>
            <Row>
              <Col span="6">UA：</Col>
              <Col span="18">{{ tryGet(sourceInfo, ['sourceData', 'ua', 'ua'], '-') }}</Col>
            </Row>
            <!-- 其他 -->
            <div class="divider">其他</div>
            <Row>
              <Col span="6">用户ID：</Col>
              <Col span="18">{{ tryGet(sourceInfo, ['sourceData', 'common', 'ucid'], '-') }}</Col>
            </Row>
            <Row>
              <Col span="6">IP地址：</Col>
              <Col span="18">{{ tryGet(sourceInfo, ['sourceData', 'ip'], '-') }}</Col>
            </Row>
            <Row>
              <Col span="6">地域：</Col>
              <Col span="18">{{ tryGet(sourceInfo, ['sourceData', 'country'], '/') }}-{{ tryGet(sourceInfo, ['sourceData', 'province'], '/') }}-{{ tryGet(sourceInfo, ['sourceData', 'city'], '/') }}</Col>
            </Row>
          </Col>
        </Row>
      </div>
      <div slot="footer"></div>
    </Modal>
    <Modal
      v-model="sourceInfo.fullScreen"
      class-name="info_fullScreen"
      width="98%"
      @on-cancel="
        () => {
          this.sourceInfo.fullScreen = false
        }
      "
    >
      <p slot="header"></p>
      <div class="modal-content">
        <pre v-html="syntaxHighlight(JSON.stringify(sourceInfo.sourceData, null, 2))"></pre>
      </div>
      <div slot="footer"></div>
    </Modal>
  </div>
</template>

<script type="text/jsx">
  /** @format */

  import _ from 'lodash'
  import moment from 'moment'
  import { Icon, Poptip, Button, Page, Modal } from 'iview'
  import * as ErrorApi from 'src/api/error'
  import { getUserSearch } from 'src/api/user'
  import DATE_FORMAT from 'src/constants/date_format'
  import Loading from 'src/components/loading/loading.vue'
  import DataSet from '@antv/data-set'
  import TheBodyChart from './components/the-body-chart'
  import SelectWrap from './components/select-wrap'
  import { formatStack, getOnlineJsSourceMap } from 'src/libs/source_map'
  import { getProjectId, syntaxHighlight } from 'src/libs/util'
  import { errorLogColumnsConfig, urlColumnConfig, cityColumnsConfig } from './conf'
  import { isObject } from 'util'

  export default {
    name: 'home',
    components: {
      Page,
      TheBodyChart,
      Loading,
      SelectWrap
    },
    data() {
      return {
        topCount: 10,
        // 常量
        selectedPrefix: '',
        CONSTANT: {
          // 日期常量, 包括单位/常用日期格式化字符串, 自constants中导入
          DATE_FORMAT
        },
        // 页面状态
        status: {
          spinShow: false,
          lastSearchSetTimeoutId: undefined,
          errorSearchType: 'errorNames',
          sourceMapModal: false,
          autoFresh: {
            isOpen: false,
            interval: 10,
            percent: 0,
            timer: 0,
            timeCount: ''
          },
          filter: 'hour',
          errorNameTopCount: 10,
          selectDate: [
            moment()
              .startOf('day')
              .toDate(),
            moment().toDate()
          ],
          originSelectedErrorNameList: [],
          selectedErrorNameList: [],
          otherErrorNameList: [],
          selectedUrl: '',
          selectedDetail: '',
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
        // 源码映射表单
        sourceInfo: {
          rawData: {},
          sourceData: '',
          isCustom: false,
          fields: '',
          formatedStack: '',
          getSourceMapType: 'local',
          sourceMapUrl: '',
          sourceMapContent: '',
          fullScreen: false
        },
        // 表格配置项
        componentConfig: {
          urlChartHeight: 1430, // 强行hack, 使之略大于右侧三个表格总高度, 保证页面样式
          defaultChartHeight: 400, // 图表chart高度
          urlColumnConfig: [
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
          ],
          detailColumnConfig: [
            {
              title: '数量',
              key: 'value',
              width: 100,
              align: 'center'
            },
            {
              title: '错误详情',
              key: 'name',
              align: 'center'
            }
          ],
          cityColumnsConfig,
          errorLogColumnsConfig: errorLogColumnsConfig.call(this),
          isExpand: true
        },
        // 数据
        // 错误分布
        database: {
          prefixList: [],
          urlList: [],
          detailList: [],
          errorDistributionList: [],
          errorDetail: '',
          errorUuid: '',
          errorUcid: '',
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
    async mounted() {
      if (localStorage.getItem('fee_error_dashboard_is_show_tip') === null) {
        this.status.isShowTip = true
        localStorage.setItem('fee_error_dashboard_is_show_tip', 1)
      }
      let isOpen = localStorage.getItem('fee_error_dashboard_is_auto_fresh_open')
      if (isOpen !== null) {
        this.$set(this.status.autoFresh, 'isOpen', JSON.parse(isOpen))
      }
      await this.fetchErrorDistributionList()
      await this.updateRecord(true)
    },
    beforeDestroy() {
      this.unBindInterval()
    },
    watch: {
      topCount() {
        this.fetchUrlList()
      },
      'sourceInfo.getSourceMapType'() {
        this.sourceInfo.sourceMapContent = null
        this.sourceInfo.sourceMapUrl = ''
      },
      'status.autoFresh.isOpen'(newValue) {
        if (newValue) {
          this.bindFreshInterval()
        } else {
          this.unBindInterval()
        }
      },
      'database.errorDetail'() {
        this.updateSearchData()
      },
      'database.errorUuid'() {
        this.updateSearchData()
      },
      'database.errorUcid'() {
        this.updateSearchData()
      },
      'status.errorSearchType'() {
        this.updateSearchData()
      }
    },
    methods: {
      moment,
      tryGet: _.get,
      getUrl(url) {
        if (!/^https*:\/\//.test(url)) {
          return `http://${url}`
        }
        return url
      },
      syntaxHighlight(...args) {
        return syntaxHighlight(...args)
      },
      updateSearchData() {
        const { lastSearchSetTimeoutId } = this.status
        if (lastSearchSetTimeoutId !== undefined) {
          clearTimeout(lastSearchSetTimeoutId)
        }
        this.status.lastSearchSetTimeoutId = setTimeout(() => {
          this.updateRecord(true)
        }, 500)
      },
      bindFreshInterval() {
        this.$refs.auto_fresh_item.className = 'error-dashboard-auto-fresh-button-after'
        this.$refs.auto_fresh_item.addEventListener('animationiteration', this.handleInteration, false)
        this.status.autoFresh.timeCount = 10
        this.status.autoFresh.timer = setInterval(() => {
          this.status.autoFresh.timeCount--
          if (this.status.autoFresh.timeCount <= 0) {
            this.status.autoFresh.timeCount = 10
          }
        }, 1000)
      },
      unBindInterval() {
        this.$refs.auto_fresh_item.className = ''
        this.$refs.auto_fresh_item.removeEventListener('animationiteration', this.handleInteration)
        this.status.autoFresh.timeCount = ''
        clearInterval(this.status.autoFresh.timer)
      },
      handleSearchErrorDetail() {
        this.updateRecord(true)
      },
      handleAutoFreshClick() {
        let nowStatus = !this.status.autoFresh.isOpen
        this.$set(this.status.autoFresh, 'isOpen', nowStatus)
        localStorage.setItem('fee_error_dashboard_is_auto_fresh_open', nowStatus)
      },
      handleInteration() {
        this.updateRecord()
      },
      handleFilterChange(filter) {
        if (this.status.filter === filter) return
        this.status.filter = filter
        this.fetchStackAreaRecordList()
      },
      async fetchErrorDistributionList() {
        // 启动&关闭 loading
        this.status.loading.errorDistributionSummary = true
        const { startAt, endAt } = this
        let response = await ErrorApi.fetchErrorDistributionList({
          start_at: startAt,
          end_at: endAt
        })
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
        let otherErrorNameList = [...errorDistributionList]
        let defaultErrorDistributionList = otherErrorNameList.splice(0, 10)
        let otherCount = 0

        for (const { error_count: count } of otherErrorNameList) {
          otherCount += count
        }
        // const others = { error_name: '其他', error_count: otherCount, children: otherErrorNameList }
        // otherCount && defaultErrorDistributionList.push(others)
        // otherCount && errorDistributionList.push(others)
        let defaultErrorNameList = []
        for (let defaultErrorDistribution of defaultErrorDistributionList) {
          let errorName = _.get(defaultErrorDistribution, ['error_name'], '')
          if (errorName.length > 0) {
            defaultErrorNameList.push(errorName)
          }
        }
        this.status.originSelectedErrorNameList = _.cloneDeep(defaultErrorNameList)
        this.status.otherErrorNameList = errorDistributionList
        this.status.selectedErrorNameList = defaultErrorNameList
      },
      // 更新函数添加600ms延迟, 避免由于用户快速录入内容导致频繁发送请求
      updateRecord: _.debounce(async function(reloadUrlList = false) {
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
      resetCommonStatus() {
        // 重置通用属性
        this.database.errorLog.pager.currentPage = 1
      },
      resetSelectUrl() {
        // 重置url
        this.status.selectedUrl = ''
        this.status.selectedDetail = ''
        this.$refs.urlListTable.clearCurrentRow()
      },
      addOtherErrorName() {
        // 先判断是errorNames还是errorDetail 还是 error
        const { errorSearchType } = this.status
        if (errorSearchType !== 'errorNames' && this.database[errorSearchType]) {
          const key = errorSearchType.replace(/[A-Z]/g, (string) => `_${string.toLowerCase()}`)
          return { [key]: this.database[errorSearchType] }
        }
        const { selectedErrorNameList, otherErrorNameList } = this.status
        if (selectedErrorNameList.indexOf('其他') === -1) {
          return { error_name_list: selectedErrorNameList }
        }
        const otherList = otherErrorNameList.find((item) => item.error_name === '其他')
        let children = []
        if (otherList.children) {
          children = otherList.children
        }
        const errorNameList = [
          ...selectedErrorNameList,
          ...children.map(({ error_name: errorName }) => errorName)
        ].filter((errorName) => !/其他$/.test(errorName))
        return { error_name_list: errorNameList }
      },
      async fetchUrlList() {
        this.status.loading.urlList = true
        const { startAt, endAt } = this
        const fetchParams = {
          start_at: startAt,
          end_at: endAt,
          size: this.topCount,
          ...this.addOtherErrorName()
        }
        const [urlResponse, detailResponse] = await Promise.all([
          ErrorApi.fetchUrlList(fetchParams),
          ErrorApi.fetchErrorDetailDistribution(fetchParams)
        ])
        this.status.loading.urlList = false
        let urlList = _.get(urlResponse, ['data'], [])
        let totalCount = 0
        for (let urlItem of urlList) {
          urlItem.key = urlItem.name
          urlItem.type = 'url'
          totalCount += urlItem['value']
        }
        urlList.unshift({
          name: `*(前${this.topCount}条)`,
          type: 'url',
          value: totalCount,
          isAll: true,
          _highlight: true
        })
        this.database.urlList = urlList
        // 再来detailList
        let detailList = _.get(detailResponse, ['data'], [])
        let detailTotal = 0
        for (const detailItem of detailList) {
          detailItem.key = detailItem.name
          try {
            let extra = JSON.parse(detailItem.name)
            if ('string' === typeof extra) {
              extra = JSON.parse(extra)
            }
            detailItem.name = extra.desc
          } catch (error) {}
          detailTotal += detailItem['value']
        }
        detailList.unshift({
          name: `*(前${this.topCount}条)`,
          value: detailTotal,
          isAll: true,
          _highlight: true
        })
        this.database.detailList = detailList
      },
      async fetchStackAreaRecordList() {
        this.status.loading.stackAreaChart = true
        let response = await ErrorApi.fetchStackAreaRecordList({
          count_type: this.status.filter,
          start_at: this.startAt,
          end_at: this.endAt,
          url: this.status.selectedUrl,
          detail: this.status.selectedDetail,
          ...this.addOtherErrorName()
        })
        this.status.loading.stackAreaChart = false
        let rawStackAreaRecordList = _.get(response, ['data'], [])
        this.database.stackAreaRecordList = rawStackAreaRecordList
      },
      async fetchPieChartDistribution() {
        this.status.loading.pieChart = true
        const response = await ErrorApi.fetchErrorNameDistribution({
          start_at: this.startAt,
          end_at: this.endAt,
          url: this.status.selectedUrl,
          detail: this.status.selectedDetail,
          ...this.addOtherErrorName()
        })
        this.status.loading.pieChart = false
        this.database.pieChartDistribution = response.data
      },
      async fetchGeographyDistributionRecord() {
        this.status.loading.geographyChart = true
        let response = await ErrorApi.fetchGeographyDistribution({
          start_at: this.startAt,
          end_at: this.endAt,
          url: this.status.selectedUrl,
          detail: this.status.selectedDetail,
          ...this.addOtherErrorName()
        })
        this.status.loading.geographyChart = false
        this.database.provinceDistributionList = response.data
      },
      async fetchErrorLog() {
        let currentPage = _.get(this.database, ['errorLog', 'pager', 'currentPage'], 1)
        this.status.loading.errorLogChart = true
        let response = await ErrorApi.fetchErrorLog({
          start_at: this.startAt,
          end_at: this.endAt,
          current_page: currentPage,
          url: this.status.selectedUrl,
          detail: this.status.selectedDetail,
          ...this.addOtherErrorName()
        })
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
      async handleDateChange(selectDateRange) {
        // 如果endTime比startTime大7天以上，缩减到7天
        // 如果endTime到了下一个月，自动变成上个月的最后一天
        let [startTime, endTime] = selectDateRange
        // 先判断是否在7天以内
        if (moment(endTime).unix() - moment(startTime).unix() > 6 * 24 * 60 * 60) {
          endTime = moment(startTime)
            .add(6, this.CONSTANT.DATE_FORMAT.UNIT.DAY)
            .format('YYYY-MM-DD')
        }
        // 先判断是否在同一个月内
        if (moment(startTime).format('YYYY-MM') !== moment(endTime).format('YYYY-MM')) {
          //不在同一个月找出上个月的最后一天
          const startMonth = moment(startTime).format('YYYY-MM')
          while (moment(endTime).unix() > moment(startTime).unix()) {
            endTime = moment(endTime)
              .subtract(1, this.CONSTANT.DATE_FORMAT.UNIT.DAY)
              .format('YYYY-MM-DD')
            if (moment(endTime).format('YYYY-MM') === startMonth) {
              break
            }
          }
        }
        startTime = moment(startTime).format('YYYY-MM-DD 00:00:00')
        endTime = moment(endTime).format('YYYY-MM-DD 23:59:59')
        this.status.selectDate = [startTime, endTime]
        // 日期范围更新后重选数据
        await this.fetchErrorDistributionList()
        await this.updateRecord(true)
      },
      async handleSelectUrl(record, index) {
        const isAll = _.get(record, ['isAll'], false)
        const key = _.get(record, ['key'], '')
        const type = _.get(record, ['type'], '')
        let selectType
        if (type === 'url') {
          selectType = 'selectedUrl'
          this.status.selectedDetail = ''
        } else {
          selectType = 'selectedDetail'
          this.status.selectedUrl = ''
        }
        if (key === this.status[selectType] || (this.status[selectType] === '' && isAll)) {
          return
        }
        if (isAll) {
          this.status[selectType] = ''
        } else {
          this.status[selectType] = key
        }
        // 选择url后重新获取数据
        await this.updateRecord()
      },
      async handleSelectErrorNameChange(list) {
        if (list.length > 1) {
          this.status.filter = 'hour'
        }
        this.status.selectedErrorNameList = list
        // 重新选择错误名称列表后重取数据
        await this.updateRecord(true)
      },
      handleSelectErrorNameReset(list) {
        this.status.errorNameTopCount = 10
        this.handleSelectErrorNameChange(list)
      },
      async handlePageChange(newPageNo) {
        this.database.errorLog.pager.currentPage = newPageNo
        await this.fetchErrorLog()
      },
      isDateDisabled(testDate) {
        const nowTime = moment().unix()
        const testTime = moment(testDate).unix()
        return testTime > nowTime
      },
      handlePrefixChange(value) {
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
      async handleExtraExpand(params) {
        this.status.spinShow = true
        this.status.sourceMapModal = true
        let ext = _.get(params, ['ext'], '')
        const timeLinkUrl = _.get(params, ['timeLinkUrl'])
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
        // 保留原始信息
        this.sourceInfo.rawData = params
        this.sourceInfo.sourceData = formatExt
        this.status.spinShow = false
      },
      // 手动映射源代码
      async handleTranslateSourceMap() {
        let { isCustom, fields, getSourceMapType, sourceMapUrl, sourceMapContent } = this.sourceInfo
        // 如果是本地上传
        if (getSourceMapType === 'local') {
          if (!sourceMapContent) return this.$Message.error('获取sourceMap内容失败！')
        }
        // 如果是远程加载
        if (getSourceMapType === 'online') {
          if (!sourceMapUrl) return this.$Message.error('请填写文件地址！')
          this.status.spinShow = true
          sourceMapContent = await getOnlineJsSourceMap(sourceMapUrl).catch((e) => {
            this.$Message.error(e.message)
            return null
          })
        }
        this.status.spinShow = true
        this.sourceInfo.sourceMapContent = sourceMapContent

        const rawData = this.sourceInfo.rawData
        const extra = _.get(rawData, ['ext', 'extra'], {})
        const pid = _.get(rawData, ['ext', 'project_name'], '')
        let { stack } = extra

        // 自定义字段映射源码
        if (isCustom) {
          if (!fields) this.$Message.error('请填写字段名称！')
          fields = fields.split('.')
          let _ext = extra
          stack = fields.reduce((pre, cur) => {
            let tmp = void 0
            try {
              tmp = JSON.parse(pre[cur])
            } catch (e) {
              tmp = pre[cur]
            }
            return tmp
          }, _ext)
        }

        let _stack = await formatStack(stack, sourceMapContent).catch((e) => {
          this.$Message.error(`映射源代码失败！${e.message}`)
          return null
        })
        if (_stack) {
          isCustom
            ? _.set(this.sourceInfo, ['sourceData', 'extra'].concat(fields), _stack)
            : _.set(this.sourceInfo, ['sourceData', 'extra', 'stack'], _stack)
        }

        this.status.spinShow = false
      },
      // 弹层关闭回调
      handleModalClose() {
        this.sourceInfo = {
          sourceData: '',
          isCustom: false,
          fields: '',
          formatedStack: '',
          getSourceMapType: 'local',
          sourceMapUrl: '',
          sourceMapContent: '',
          fullScreen: false
        }
      },
      // 获取上传文件内容
      beforeSourceMapUpload(file) {
        let fileReader = new FileReader()
        fileReader.readAsText(file)
        fileReader.addEventListener('load', (e) => {
          let {
            target: { result }
          } = e
          try {
            result = JSON.parse(result)
          } catch (error) {
            this.$Message.error('sourceMap文件解析出错！')
            result = ''
          }
          this.sourceInfo.sourceMapContent = result
        })
        return false
      },
      // 打开时光机链接
      handleTimeLinkUrlOpen() {
        let url = _.get(this.sourceInfo, ['rawData', 'timeLinkUrl'], '')
        url && window.open(url)
      },
      // 全屏查看
      toggleFullScreenView() {
        let fullScreen = this.sourceInfo.fullScreen
        this.sourceInfo.fullScreen = !fullScreen
      }
    },
    computed: {
      startAt() {
        let startAtDate = _.get(this, ['status', 'selectDate', '0'], new Date())
        let startAt = moment(startAtDate).unix()
        return startAt
      },
      endAt() {
        let endAtDate = _.get(this, ['status', 'selectDate', '1'], new Date())
        let endAt = moment(endAtDate).unix()
        return endAt
      },
      // 该值可由省份分布直接推算出来, 所以不需要在data中单起变量了
      geographyChartDistributionRecord() {
        let recordList = []
        let provinceList = _.get(this.database, ['provinceDistributionList'], [])
        for (let provinceDistribution of provinceList) {
          let place = _.get(provinceDistribution, ['name'], '')
          let timeCount = _.get(provinceDistribution, ['value'], 0)
          let record = {
            位置: place,
            次数: timeCount
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
  /** @format */

  .message {
    font-size: 1vw;
  }
  .divider {
    padding-bottom: 5px;
    margin-bottom: 10px;
    font-weight: 500;
    border-bottom: 1px dashed #aaa;
    &:not(:first-child) {
      margin-top: 20px;
    }
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

  .center-card-box {
    display: flex;
    align-items: center;
    justify-content: center;
    .item {
      width: 96%;
    }
  }

  .the-page_position {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .error-dashboard-auto-fresh-button {
    position: relative;
  }

  .error-dashboard-auto-fresh-button-after {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 0%;
    height: 100%;
    background-color: #478be9;
    opacity: 0.5;
    border-radius: 3px;
    animation: autoFresh 10s linear infinite;
  }

  @keyframes autoFresh {
    0% {
      width: 0%;
    }
    80% {
      background-color: #478be9;
    }
    90% {
      width: 100%;
      background-color: rgb(4, 247, 4);
    }
    100% {
      width: 100%;
      background-color: rgb(4, 247, 4);
    }
  }
</style>

<style lang="less">
  /** @format */

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
    // tooltip不消失的问题
    .ivu-card-body .g2-tooltip {
      max-width: 450px;
      max-height: 400px;
      overflow-y: auto;
      overflow-x: hidden;
    }
  }
  .info-modal_wrap,
  .info_fullScreen {
    .ivu-modal-content {
      height: 100%;
    }
    pre {
      padding: 10px;
      margin: 5px;
      white-space: pre-wrap;
      word-break: break-all;
      .string {
        color: green;
      }
      .number {
        color: darkorange;
      }
      .boolean {
        color: blue;
      }
      .null {
        color: magenta;
      }
      .key {
        color: red;
      }
    }
  }
  .info-modal_wrap {
    .error-extra_info {
      max-height: 250px;
      overflow-y: auto;
      background: #eff0f1;
      border-radius: 3px;
      margin: 5px 0;
    }
    .ivu-modal {
      height: 90%;
      top: 5%;
    }
    .ivu-modal-body {
      overflow: scroll;
      height: 90%;
    }
  }
  .info_fullScreen {
    .ivu-modal {
      height: 96%;
      top: 2%;
    }
    .ivu-modal-body {
      overflow: scroll;
      height: 89%;
    }
  }
  .modal-content {
    .ivu-col.ivu-col-span-18 {
      word-break: break-all;
    }
  }
</style>

<template>
  <Row :gutter="20">
    <Col span="24">
      <Card shadow
        >选择日期：
        <DatePicker :value="selectMonth" placeholder="选择月份" style="width: 200px" @on-change="dateChange" :options="options3" :clearable="false" />
      </Card>
      <Card shadow>
        <Tabs type="card" name="tab-1">
          <TabPane label="系统分布" tab="tab-1" name="tab-2_1">
            <the-tab-pie
              tab="tab-2_1"
              :innerData="systemRows"
              :outerData="systemOutRows"
              :innerToolTip="sysTooltip"
              :outerToolTip="sysOutTooltip"
              :tableData="table.data.OS"
              :tableColumns="table.config.OSTableColumns"
              :isSpinShow="isSysShow"
            ></the-tab-pie>
          </TabPane>
          <TabPane label="浏览器分布" tab="tab-1" name="tab-2_2">
            <the-tab-pie
              tab="tab-2_2"
              :innerData="browserData"
              :outerData="browserOutData"
              :tableData="table.data.browser"
              :innerToolTip="browserTooltip"
              :outerToolTip="browserOutTooltip"
              :tableColumns="table.config.browserTableColumns"
              :isSpinShow="isBrowserShow"
            ></the-tab-pie>
          </TabPane>
          <TabPane label="设备分布" tab="tab-1" name="tab-2_3">
            <the-tab-pie
              tab="tab-2_3"
              :innerData="deviceRows"
              :outerData="deviceOutRows"
              :tableData="table.data.device"
              :innerToolTip="deviceTooltip"
              :outerToolTip="deviceOutTooltip"
              :tableColumns="table.config.deviceTableColumns"
              :isSpinShow="isDeviceShow"
            ></the-tab-pie>
          </TabPane>
          <TabPane label="应用版本分布" tab="tab-1" name="tab-2_4">
            <the-tab-pie tab="tab-2_4" :pieData="runtimeVersionPieData" :tableData="table.data.runtimeVersion" :tableColumns="table.config.runtimeVersionTableColumns"></the-tab-pie>
          </TabPane>
        </Tabs>
      </Card>
    </Col>
  </Row>
</template>
<script>
  import moment from 'moment'
  import * as ApiInfo from 'src/api/info/'
  import DataSet from '@antv/data-set'
  import TheTabPie from './components/the-tab-pie'

  let OSTableColumns = [
    {
      title: ' ',
      type: 'index'
    },
    {
      title: '系统',
      key: 'type'
    },
    {
      title: '版本',
      key: 'key'
    },
    {
      title: '个数',
      key: 'value',
      sortable: true
    }
  ]
  let browserTableColumns = [
    {
      title: '浏览器',
      key: 'browser'
    },
    {
      title: '版本',
      key: 'version'
    },
    {
      title: '个数',
      key: 'total_count',
      sortable: true
    }
  ]
  let deviceTableColumns = [
    {
      title: '设备类型',
      key: 'type'
    },
    {
      title: '设备详情',
      key: 'key'
    },
    {
      title: '个数',
      key: 'value',
      sortable: true
    }
  ]
  const runtimeVersionTableColumns = [
    {
      title: '应用版本',
      key: 'type'
    },
    {
      title: '数量',
      key: 'value'
    }
  ]
  let sysOutTooltip = [
    'key*value*percent',
    (item, value, percent) => {
      percent = (percent * 100).toFixed(2) + '%'
      return {
        name: item,
        value: percent + '&nbsp;&nbsp;&nbsp;&nbsp;数量：' + value
      }
    }
  ]
  let sysTooltip = [
    'type*value*percent',
    (item, value, percent) => {
      percent = (percent * 100).toFixed(2) + '%'
      return {
        name: item,
        value: percent + '&nbsp;&nbsp;&nbsp;&nbsp;数量：' + value
        // value: '数量：' + count
      }
    }
  ]
  let deviceTooltip = [
    'type*value*percent',
    (item, value, percent) => {
      percent = (percent * 100).toFixed(2) + '%'
      return {
        name: item,
        value: percent + '&nbsp;&nbsp;&nbsp;&nbsp;数量：' + value
      }
    }
  ]
  let deviceOutTooltip = [
    'key*value*percent',
    (item, count, percent) => {
      percent = (percent * 100).toFixed(2) + '%'
      return {
        name: item,
        value: percent + '&nbsp;&nbsp;&nbsp;&nbsp;数量：' + count
      }
    }
  ]
  let browserTooltip = [
    'type*total_count*percent',
    (item, count, percent) => {
      percent = (percent * 100).toFixed(2) + '%'
      return {
        name: item,
        value: percent + '&nbsp;&nbsp;&nbsp;&nbsp;数量：' + count
      }
    }
  ]
  let browserOutTooltip = [
    'key*total_count*percent',
    (item, count, percent) => {
      percent = (percent * 100).toFixed(2) + '%'
      return {
        name: item,
        value: percent + '&nbsp;&nbsp;&nbsp;&nbsp;数量：' + count
      }
    }
  ]

  export default {
    components: {
      TheTabPie
    },
    data() {
      return {
        loading: true,
        loadingTxt: '加载中。。。',
        table: {
          config: {
            OSTableColumns,
            browserTableColumns,
            deviceTableColumns,
            runtimeVersionTableColumns
          },
          data: {
            OS: [],
            browser: [],
            runtimeVersion: [],
            device: []
          }
        },
        dataEmpty: true,
        // 时间选择器
        selectMonth: moment().format('YYYY-MM-DD'),
        options3: {
          disabledDate(date) {
            return date && date.valueOf() > Date.now()
          }
        },
        // 系统图数据
        sysOutTooltip,
        sysTooltip,
        systemRows: [],
        systemOutRows: [],
        deviceTooltip,
        deviceOutTooltip,
        deviceRows: [],
        deviceOutRows: [],
        // 浏览器图数据
        browserData: [],
        browserOutData: [],
        browserTooltip,
        browserOutTooltip,
        // 应用版本数据
        runtimeVersionPieData: {},
        isDeviceShow: true,
        isSysShow: true,
        isBrowserShow: true
      }
    },
    mounted() {
      this.getData()
    },
    methods: {
      dateChange(val) {
        this.selectMonth = val
        this.getData()
      },
      getViewData(skey, svalue, data = []) {
        var ret = {
          columns: [skey, svalue],
          rows: []
        }
        data.forEach(({ key, value }) => {
          ret.rows.push({
            [skey]: key,
            [svalue]: value
          })
        })
        return ret
      },
      async getData() {
        this.loading = true
        let sysDevice = this.getSysDevice()
        let sysCount = this.getSysCount()
        let browser = this.getChromeCount()
        let runtimeVersion = this.getSysRuntimeVersion()
        return Promise.all([sysDevice, sysCount, browser, runtimeVersion]).finally((res) => (this.loading = false))
      },
      async getSysDevice() {
        const { data } = await ApiInfo.getClientDistribution({
          month: this.selectMonth,
          type: ApiInfo.TYPE.DEVICE
        })
        this.table.data.device = data.sort((a, b) => b['value'] - a['value'])
        let res = data.map((item) => {
          return {
            ...item
          }
        })
        const deviceDv = new DataSet.View().source(res)
        deviceDv.transform({
          type: 'percent',
          field: 'value',
          dimension: 'type',
          as: 'percent'
        })
        this.deviceRows = deviceDv.rows
        const deviceOutDv = new DataSet.View().source(res)
        deviceOutDv.transform({
          type: 'percent',
          field: 'value',
          dimension: 'key',
          as: 'percent'
        })
        this.deviceOutRows = deviceOutDv.rows
        if (this.deviceRows && this.deviceOutRows) {
          this.isDeviceShow = false
        }
        this.resize()
      },
      async getSysCount() {
        const { data } = await ApiInfo.getClientDistribution({
          month: this.selectMonth,
          type: ApiInfo.TYPE.SYSTEM
        })
        this.table.data.OS = data.sort((a, b) => b['value'] - a['value'])
        let res = data.map((item) => {
          return {
            ...item,
            key: item['type'] + '_' + item['key']
          }
        })
        const sysDv = new DataSet.View().source(res)
        sysDv.transform({
          type: 'percent',
          field: 'value',
          dimension: 'type',
          as: 'percent'
        })
        this.systemRows = sysDv.rows
        const sysOutDv = new DataSet.View().source(res)
        sysOutDv.transform({
          type: 'percent',
          field: 'value',
          dimension: 'key',
          as: 'percent'
        })
        this.systemOutRows = sysOutDv.rows
        if (this.systemRows && this.systemOutRows) {
          this.isSysShow = false
        }
        this.resize()
      },
      async getSysRuntimeVersion() {
        const { data } = await ApiInfo.getClientDistribution({
          month: this.selectMonth,
          type: ApiInfo.TYPE.RUNTIMEVERSION
        })
        this.table.data.runtimeVersion = data.sort((a, b) => b.vaule - a.vaule)
        this.runtimeVersionPieData = {
          columns: ['type', 'value'],
          rows: data.map(({ type, value }) => ({ type: `V${type}`, value }))
        }
        this.resize()
      },
      async getChromeCount() {
        const res2 = await ApiInfo.getClientDistribution({
          q: 'chrome',
          month: this.selectMonth,
          type: ApiInfo.TYPE.BROWSER
        })
        this.table.data.browser = res2.data.sort((a, b) => b['total_count'] - a['total_count'])
        const chromeData = []
        res2.data.forEach((item) => {
          chromeData.push({
            type: item['browser'],
            key: item['version'],
            total_count: item['total_count']
          })
        })
        const dv = new DataSet.View().source(chromeData)
        dv.transform({
          type: 'percent',
          field: 'total_count',
          dimension: 'type',
          as: 'percent'
        })
        this.browserData = dv.rows
        const viewDv = new DataSet.View().source(chromeData)
        viewDv.transform({
          type: 'percent',
          field: 'total_count',
          dimension: 'key',
          as: 'percent'
        })

        this.browserOutData = viewDv.rows
        if (this.browserData && this.browserOutData) {
          this.isBrowserShow = false
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  .demo-spin-icon-load {
    animation: ani-demo-spin 1s linear infinite;
  }
  @keyframes ani-demo-spin {
    from {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(180deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .demo-spin-col {
    height: 100px;
    position: relative;
    border: 1px solid #eee;
  }
</style>

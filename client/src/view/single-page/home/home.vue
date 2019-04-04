<template>
  <div>
    <!-- <div>
    <v-chart :forceFit="true" :height="height" :data="data" :scale="scale">
      <v-tooltip :showTitle="false" dataKey="item*percent" />
      <v-axis />
      <v-legend dataKey="item" />
      <v-pie position="percent" color="item" :v-style="pieStyle" :label="labelConfig" />
      <v-coord type="theta" />
    </v-chart>
  </div> -->
    <Row :gutter="20">
      <i-col span="12">
        <Card shadow>
          <div slot="title"
               style="display:flex;align-items: center;justify-content: space-between;">
            <b>系统分布</b>
            <DatePicker :value="sysMonth"
                        :data-empty="dataEmpty"
                        type="month"
                        placeholder="选择月份"
                        style="width: 200px"
                        @on-change="sysDateChange"
                        :clearable="false" />
          </div>
          <div>
            <!-- <v-chart :forceFit="true" :height="height" :data="data" :scale="scale">
              <v-tooltip :showTitle="false" dataKey="item*percent" />
              <v-axis />
              <v-legend dataKey="item" />
              <v-pie
                position="percent"
                color="item"
                :vStyle="pieStyle"
                :label="labelConfig"
              />
              <v-coord type="theta" />
            </v-chart> -->
          </div>
          <ve-pie ref="barEl"
                  :data="systemtData"
                  :extend="systemPieExtend">
          </ve-pie>
        </Card>
      </i-col>
      <i-col span="12">
        <Card shadow>
          <div slot="title"
               style="display:flex;align-items: center;justify-content: space-between;">
            <b>Chrome分布</b>
            <DatePicker :value="chromeMonth"
                        type="month"
                        placeholder="选择月份"
                        style="width: 200px"
                        @on-change="chromeDateChange"
                        :clearable="false" />
          </div>
          <!-- <ve-pie
            :data="chromeData"
            :extend="chromePieExtend"
          ></ve-pie> -->
          <div>
            <v-chart :forceFit="true"
                     :height="height"
                     :data="rows"
                     :scale="scale">
              <v-tooltip :showTitle="false"
                         :itemTpl="itemTpl" />
              <v-coord type="theta"
                       :radius="0.5" />
              <v-pie position="percent"
                     :label="browser"
                     color="browser"
                     :select="false"
                     :vStyle="style"
                     :tooltip="tooltip" />
              <v-view :data="viewData"
                      :scale="scale">
                <v-coord type="theta"
                         :radius="0.75"
                         :innerRadius="0.5 / 0.75" />
                <v-pie position="percent"
                       label="version"
                       color="version"
                       :select="false"
                       :vStyle="style"
                       :tooltip="tooltip1" />
              </v-view>
            </v-chart>
          </div>
        </Card>
      </i-col>
    </Row>
    <online-time style="margin-top: 20px;"></online-time>
    <menu-count></menu-count>
  </div>
</template>
<script>
import moment from 'moment'
import InforCard from '_c/info-card'
import CountTo from '_c/count-to'
import { ChartBar, ChartPie } from '_c/charts'
import VePie from 'v-charts/lib/pie.common'
import Example from './example.vue'
import { getChromeCount, getSysCount } from '@/api/info'
import MenuCount from '@/view/menu-count/menu-count.vue'
import OnlineTime from '@/view/online-time/online-time.vue'
// import 'v-charts/lib/style.css'
import DataSet from '@antv/data-set'
// import axios from '@/libs/api.request'

// axios.setProject('project12')

export default {
  name: 'home',
  components: {
    InforCard,
    CountTo,
    ChartPie,
    ChartBar,
    Example,
    VePie,
    MenuCount,
    OnlineTime
  },
  data () {
    this.systemPieExtend = {
      // title: {
      //   show: true,
      //   text: '系统分布'
      // },
      legend: {
        bottom: 0
      }
    }
    this.chromePieExtend = {
      // title: {
      //   show: true,
      //   text: 'Chrome分布'
      // },
      legend: {
        bottom: 0
      }
    }
    return {
      //  data,
      height: 400,
      pieStyle: {
        stroke: '#fff',
        lineWidth: 1
      },
      labelConfig: ['percent', {
        formatter: (val, item) => {
          return item.point.item
        }
      }],
      dataEmpty: true,
      sysMonth: moment().format('YYYY-MM'),
      chromeMonth: moment().format('YYYY-MM'),
      systemtData: {},
      chromeData: [],
      rows: [],
      viewData: [],
      itemTpl: '',
      tooltip: [],
      tooltip1: [],
      browser: [],
      style: {
        lineWidth: 1,
        stroke: '#fff'
      },
      scale: {
        dataType: 'percent',
        formatter: '.2%'
      }
    }
  },
  async mounted () {
    this.getSysCount()
    this.getChromeCount()
  },
  methods: {
    sysDateChange (val) {
      this.sysMonth = val
      this.getSysCount()
    },
    chromeDateChange (val) {
      this.chromeMonth = val
      this.getChromeCount()
    },

    getViewData (skey, svalue, data = []) {
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
    async getSysCount () {
      const res = await getSysCount({
        month: this.sysMonth
      })
      const arr = []
      const systems = Object.keys(res.data)
      systems.forEach(system => {
        const versons = res.data[system] || {}
        if (system === 'Mac OS') {
          let macSum = 0
          for (let v in versons) {
            const value = versons[v]
            macSum += value
          }
          arr.push({
            key: 'Mac OS',
            value: macSum
          })
        } else {
          for (let v in versons) {
            const value = versons[v]
            arr.push({
              key: `${system}_${v}`,
              value
            })
          }
        }
      })

      this.systemtData = this.getViewData('系统', '访问用户', arr)
      this.resize()
    },
    async getChromeCount () {
      const res2 = await getChromeCount({
        q: 'chrome',
        month: this.chromeMonth
      })
      // this.chromeData = this.getViewData(res2.data)
      this.chromeData = res2.data
      const dv = new DataSet.View().source(this.chromeData)
      dv.transform({
        type: 'percent',
        field: 'total_count',
        dimension: 'browser',
        as: 'percent'
      })
      this.rows = dv.rows
      const viewDv = new DataSet.View().source(this.chromeData)
      viewDv.transform({
        type: 'percent',
        field: 'total_count',
        dimension: 'version',
        as: 'percent'
      })
      this.viewData = viewDv.rows
      this.itemTpl = '<li><span class="g2-tooltip-marker"></span>{name}: {value}</li>'
      this.browser = ['browser', { offset: -45 }]
      this.tooltip = [
        'browser*percent', (item, percent) => {
          percent = (percent * 100).toFixed(2) + '%'
          return {
            name: item,
            value: percent
          }
        }
      ]
      this.tooltip1 = [
        'version*percent', (item, percent) => {
          percent = (percent * 100).toFixed(2) + '%'
          return {
            name: item,
            value: percent
          }
        }
      ]
    }
  }
}
</script>

<style lang="less" scoped>
.count-style {
  font-size: 50px;
}
</style>

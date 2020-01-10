<!-- @format -->

<template>
  <div class="pg-dashboard">
    <Card style="width:220px;box-shadow: -5px 5px 10px;border-radius: 3px;">
      <div>
        <img src="~/src/assets/images/logo-min.jpg" width="70px" />
        <div>
          <div>
            今日UV：<strong
              ><countTo separator="," :startVal="oldUV" :endVal="UV" :duration="2000"></countTo
            ></strong>
          </div>
          <div>
            灯塔累计接入项目数：<strong>{{ logDataView.project }}</strong>
          </div>
        </div>
      </div>
    </Card>
    <Divider dashed>今日数据统计</Divider>
    <Row :gutter="10">
      <Col span="6" v-for="(item, index) in overview" :key="index">
        <i-circle
          :dashboard="!index"
          :size="180"
          :trail-width="4"
          :stroke-width="5"
          :percent="getPercent(logDataView.current[item.key], logDataView.count[item.key])"
          stroke-linecap="square"
          :stroke-color="item.color"
        >
          <div class="circle-custom">
            <h3>
              <countTo
                separator=","
                :startVal="logDataView.old[item.key]"
                :endVal="logDataView.count[item.key]"
                :duration="2000"
              ></countTo>
            </h3>
            <p>今日{{ item.name }}总数</p>
            <span
              >当前项目占比<i
                >{{ getPercent(logDataView.current[item.key], logDataView.count[item.key]) }}%</i
              ></span
            >
          </div>
        </i-circle>
      </Col>
    </Row>
    <Divider dashed>数据总量排行</Divider>
    <div ref="data-total-line" class="data-rank-line"></div>
    <Divider dashed>错误总量排行</Divider>
    <Row :gutter="16">
      <Col span="24">
        <div ref="data-error-line" class="data-rank-line"></div>
      </Col>
    </Row>
    <Divider dashed>性能排行</Divider>
    <Row :gutter="16">
      <Col span="12">
        <!-- 首次渲染耗时 -->
        <div ref="data-perf-fpt-line" class="data-rank-line"></div>
      </Col>
      <Col span="12">
        <!-- 首次可交互耗时 -->
        <div ref="data-perf-tti-line" class="data-rank-line"></div>
      </Col>
    </Row>
    <Row :gutter="16">
      <Col span="12">
        <!-- 首包时间 -->
        <div ref="data-perf-ftcp-line" class="data-rank-line"></div>
      </Col>
    </Row>
  </div>
</template>
<script>
  import _ from 'lodash'
  import echart from 'echarts'
  import countTo from 'vue-count-to'
  import { dotDataLineOptions } from './conf'
  import { getProjectUV, getProjectLog, getPerfLog } from 'src/api/dashboard'

  const defautColor = '#43a3fb'
  const errorColor = '#ed4014'
  const perfColor = '#19be6b'
  const productColor = '#ff9900'

  export default {
    components: {
      countTo
    },
    data() {
      return {
        timer: null,
        UV: 0,
        oldUV: 0,
        overview: [
          {
            name: '数据',
            key: 'total',
            color: defautColor
          },
          {
            name: 'error',
            key: 'error',
            color: errorColor
          },
          {
            name: 'perf',
            key: 'perf',
            color: perfColor
          },
          {
            name: 'product',
            key: 'product',
            color: productColor
          }
        ],
        perfData: {
          current: {},
          list: []
        },
        logDataView: {
          old: {
            error: 0,
            perf: 0,
            product: 0,
            total: 0
          },
          count: {
            error: 0,
            perf: 0,
            product: 0,
            total: 0
          },
          current: {
            error: 0,
            perf: 0,
            product: 0,
            total: 0,
            name: '',
            errorRadio: ''
          },
          list: [],
          project: 0
        },
        stackAreaPic1: null,
        stackAreaPic2: null,
        stackAreaPic3: null,
        stackAreaPic4: null,
        stackAreaPic5: null
      }
    },
    async mounted() {
      this.stackAreaPic1 = echart.init(this.$refs['data-total-line'])
      this.stackAreaPic2 = echart.init(this.$refs['data-error-line'])
      this.stackAreaPic3 = echart.init(this.$refs['data-perf-fpt-line'])
      this.stackAreaPic4 = echart.init(this.$refs['data-perf-tti-line'])
      this.stackAreaPic5 = echart.init(this.$refs['data-perf-ftcp-line'])
      await this.getData()
      this.drawLine()
      this.timer = setInterval(async () => {
        await this.getData()
        this.drawLine()
      }, 10000)
    },
    beforeDestroy() {
      this.timer && clearInterval(this.timer)
    },
    methods: {
      drawLine() {
        const { current } = this.logDataView
        this.stackAreaPic1.setOption(dotDataLineOptions(this.getStackAreaData('total')), true)
        this.stackAreaPic2.setOption(dotDataLineOptions(this.getStackAreaData('error')), true)
        this.stackAreaPic3.setOption(dotDataLineOptions(this.getStackAreaData('fpt')), true)
        this.stackAreaPic4.setOption(dotDataLineOptions(this.getStackAreaData('tti')), true)
        this.stackAreaPic5.setOption(dotDataLineOptions(this.getStackAreaData('ftcp')), true)
      },
      async getData() {
        await this.getLogData()
        await this.getPerfData()
        await this.getUV()
      },
      // 获取UV数据
      async getUV() {
        let data = await getProjectUV()
        this.oldUV = this.UV
        this.UV = _.get(data, ['data'], 0)
      },
      // 获取今日日志数量
      async getLogData() {
        let data = await getProjectLog()
        let res = _.get(data, 'data', {
          count: {},
          current: {},
          list: [],
          project: 0
        })
        this.logDataView = {
          ...res,
          old: _.get(this.logDataView, ['count'], {})
        }
      },
      // 获取性能排行数据
      async getPerfData() {
        let data = await getPerfLog()
        this.perfData = _.get(data, 'data', {
          current: {},
          list: []
        })
      },
      // 格式化图表数据
      getStackAreaData(type) {
        let { current, list, count } = this.logDataView
        let title = ''
        let subtext = ''
        let series = []
        let color = ['#61a0a8', '#2f4554', '#c23531']
        let legend = {
          show: true,
          data: []
        }
        let tooltip = {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        }
        let xAxis = {
          type: 'category',
          axisLabel: {
            rotate: 60
          },
          data: ['SAAS', '房源', '灯塔']
        }

        // 数据总量排行
        if (type === 'total') {
          title = '数据总量Top10'
          let rank = _.findIndex(list, (item) => item.id === current.id) + 1
          let rankData = _.find(list, (item) => item.id === current.id)
          let top10 = _.slice(list, 0, 10)
          subtext = `${current.name || '未知'}：第${rank}位`
          if (rank > 10) {
            top10.push(rankData)
          }
          _.set(legend, ['data'], ['product', 'perf', 'error'])
          _.set(legend, ['selected', 'product'], false)
          _.set(
            xAxis,
            ['data'],
            top10.map((item) => item.name)
          )

          series = _.get(legend, 'data', []).map((type) => {
            let data = {
              name: type,
              type: 'bar',
              stack: '总量',
              label: {
                normal: {
                  show: true,
                  position: 'insideRight',
                  rotate: -30
                }
              },
              data: top10.map((item) => item[type])
            }
            return data
          })
        }
        // 错误总数排行
        if (type === 'error') {
          color = [errorColor]
          title = '错误总量Top10'
          list = list.sort((a, b) => b.error - a.error)
          let rank = _.findIndex(list, (item) => item.id === current.id) + 1
          let rankData = _.find(list, (item) => item.id === current.id)
          let top10 = _.slice(list, 0, 10)
          subtext = `${current.name || '未知'}：第${rank}位`
          if (rank > 10) {
            top10.push(rankData)
          }
          _.set(legend, ['data'], ['error'])
          _.set(legend, ['show'], false)
          _.set(
            xAxis,
            ['data'],
            top10.map((item) => item.name)
          )

          series = _.get(legend, 'data', []).map((type) => {
            let data = {
              name: type,
              type: 'bar',
              stack: '总量',
              label: {
                normal: {
                  show: false,
                  position: 'insideRight'
                }
              },
              data: top10.map((item) => item[type])
            }
            return data
          })

          let tooltipFormatter = (params) => {
            const { value, name, dataIndex } = _.get(params, [0], {})
            let str = `<div>
            <p>占错误总量比：${this.getPercent(value, count.error)}%</p>
            <p>占自身数据总量比：${this.getPercent(value, _.get(top10, [dataIndex, 'total'], 1))}%</p>
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#c23531;"></span>${this.toThousands(
              value
            )}
          </div>`
            return str
          }
          _.set(tooltip, ['formatter'], tooltipFormatter)
        }
        // 性能首次渲染时间排行
        if (type === 'fpt') {
          list = _.get(this.perfData, 'list', [])
          current = _.get(this.perfData, 'current', [])
          color = [perfColor]
          title = `首次渲染耗时：Bottom10`
          list = list.sort((a, b) => b.fpt - a.fpt)

          let rank = _.findIndex(list, (item) => item.id === current.id) + 1
          let rankData = _.find(list, (item) => item.id === current.id)
          let top10 = _.slice(list, 0, 10)

          subtext = `第${rank}位`
          if (rank > 10) {
            top10.push(rankData)
          }
          _.set(legend, ['data'], ['fpt'])
          _.set(legend, ['show'], false)
          _.set(
            xAxis,
            ['data'],
            top10.map((item) => item.name)
          )

          series = _.get(legend, 'data', []).map((type) => {
            let data = {
              name: type,
              type: 'bar',
              stack: '总量',
              label: {
                normal: {
                  show: false,
                  position: 'insideRight'
                }
              },
              data: top10.map((item) => item[type])
            }
            return data
          })

          let tooltipFormatter = (params) => {
            const { value, name, dataIndex } = _.get(params, [0], {})
            let str = `<div>
            <p>${name}</p>
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#c23531;"></span>${value.toFixed(
              2
            )}ms
          </div>`
            return str
          }
          _.set(tooltip, ['formatter'], tooltipFormatter)
        }
        // 性能首次可交互时间排行
        if (type === 'tti') {
          list = _.get(this.perfData, 'list', [])
          current = _.get(this.perfData, 'current', [])

          color = [perfColor]
          title = `首次可交互耗时：Bottom10`
          list = list.sort((a, b) => b.tti - a.tti)

          let rank = _.findIndex(list, (item) => item.id === current.id) + 1
          let rankData = _.find(list, (item) => item.id === current.id)
          let top10 = _.slice(list, 0, 10)

          subtext = `第${rank}位`
          if (rank > 10) {
            top10.push(rankData)
          }
          _.set(legend, ['data'], ['tti'])
          _.set(legend, ['show'], false)
          _.set(
            xAxis,
            ['data'],
            top10.map((item) => item.name)
          )

          series = _.get(legend, 'data', []).map((type) => {
            let data = {
              name: type,
              type: 'bar',
              stack: '总量',
              label: {
                normal: {
                  show: false,
                  position: 'insideRight'
                }
              },
              data: top10.map((item) => item[type])
            }
            return data
          })

          let tooltipFormatter = (params) => {
            const { value, name, dataIndex } = _.get(params, [0], {})
            let str = `<div>
            <p>${name}</p>
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#c23531;"></span>${value.toFixed(
              2
            )}ms
          </div>`
            return str
          }
          _.set(tooltip, ['formatter'], tooltipFormatter)
        }
        // 性能首包时间排行
        if (type === 'ftcp') {
          list = _.get(this.perfData, 'list', [])
          current = _.get(this.perfData, 'current', [])

          color = [perfColor]
          title = `首包时间：Bottom10 `
          list = list.sort((a, b) => b.ftcp - a.ftcp)

          let rank = _.findIndex(list, (item) => item.id === current.id) + 1
          let rankData = _.find(list, (item) => item.id === current.id)
          let top10 = _.slice(list, 0, 10)

          subtext = `第${rank}位`
          if (rank > 10) {
            top10.push(rankData)
          }
          _.set(legend, ['data'], ['ftcp'])
          _.set(legend, ['show'], false)
          _.set(
            xAxis,
            ['data'],
            top10.map((item) => item.name)
          )

          series = _.get(legend, 'data', []).map((type) => {
            let data = {
              name: type,
              type: 'bar',
              stack: '总量',
              label: {
                normal: {
                  show: false,
                  position: 'insideRight'
                }
              },
              data: top10.map((item) => item[type])
            }
            return data
          })

          let tooltipFormatter = (params) => {
            const { value, name, dataIndex } = _.get(params, [0], {})
            let str = `<div>
            <p>${name}</p>
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#c23531;"></span>${value.toFixed(
              2
            )}ms
          </div>`
            return str
          }
          _.set(tooltip, ['formatter'], tooltipFormatter)
        }
        return {
          title,
          subtext,
          color,
          legend,
          xAxis,
          series,
          tooltip
        }
      },
      // 转化为百分数，保留两位小数
      getPercent(num, total) {
        if (!num || !total) return 0
        return Math.round((num / total) * 10000) / 100.0
      },
      // 千分位表示
      toThousands(num) {
        return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
      }
    }
  }
</script>
<style lang="less">
  .ivu-table td.table-error-col {
    background-color: red;
    color: #fff;
  }
  .data-rank-line {
    height: 400px;
    width: 80%;
  }
  .circle-custom {
    & h3 {
      color: #3f414d;
      font-size: 24px;
      font-weight: normal;
    }
    & p {
      color: #657180;
      font-size: 12px;
      margin: 10px 0 15px;
    }
    & > span {
      display: block;
      padding-top: 15px;
      color: #657180;
      font-size: 12px;
      &:before {
        content: '';
        display: block;
        width: 50px;
        height: 1px;
        margin: 0 auto;
        background: #e0e3e6;
        position: relative;
        top: -15px;
      }
    }
    & span i {
      font-style: normal;
      color: #3f414d;
    }
  }
</style>

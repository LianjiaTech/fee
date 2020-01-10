<template>
  <Card shadow>
    <div style="height:450px">
      <div style="height:450px;width:100%;" ref="charts"></div>
    </div>
    <Row>
      <Col span="12">
        记忆衰减率：<Slider v-model="forgetRate" :tip-format="format" style="width:200px;"></Slider>
      </Col>
    </Row>
    <Row>
      <Col span="12">
        滑动窗口大小： <Slider v-model="size" :step="1" show-stops style="width:200px;"></Slider>
      </Col>
    </Row>
    <Row>
      <Col span="12">
        预计报警次数 <Input disabled :value="alarmCount" />
      </Col>
    </Row>
    <Row>
      <Col span="12">
        RMSE <Input disabled :value="RMSE" />
      </Col>
    </Row>
  </Card>
</template>
<script>
  import echart from 'echarts'
  import Loading from 'src/components/loading/loading.vue'
  import VeMap from 'v-charts/lib/map.common'
import moment from 'moment'

const stackAreaOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: [],
      tooltip: {
        show: true
      }
    },
    dataZoom: {
      type: 'slider',
      start: 0,
      end: 100
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: [],
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: []
}

  export default {
    name: 'TheBodyChart',
    components: {
      Loading,
      VeMap
    },
    props: {
      stackAreaRecordList: {
        type: Array,
        default: []
      },
      isSpinShowStack: {
        type: Boolean,
        default: false
      },
    },
    watch: {
      stackAreaRecordList () {
        this.draw()
      },
      isSpinShowStack () {
        if (this.isSpinShowStack) {
          this.charts.showLoading()
        } else {
          this.charts.hideLoading()
        }
      },
      forgetRate() {
        this.draw()
      },
      size() {
        this.draw()
      },
    },
    data () {
      return {
        forgetRate: 10,
        size: 5,
        alarmCount: 0,
        RMSE: 0
      }
    },
    mounted () {
      this.charts = echart.init(this.$refs.charts)
      this.draw()
      let data = this.generateData()
      this.getGuessData1(data)
      this.getGuessData2(data)
    },
    methods: {
      format (val) {
        return val + '%'
      },
      draw () {
        this.drawStackArea()
      },
      generateData() {
        // var data = [253993,289665,341785,384763,428964,470614,530217,620206,688212,746422,809592,791376,772682,806048,860855,996630,1092883,1172596,1245356,1326094,1378717,1394413,1478573,1534122,1608150]
        var data = new Array(10).fill(1).map((item, index) => 2**index)
        console.log(data)
        // var data = [253993,289665,341785]
        let res = data.map((item, index)=> {
          return {
            index: 1978 + index,
            name: '原始值',
            value: item,
            index_display: `${1978 + index}年`
          }
        })
        return res
      },
      drawStackArea () {
        let nameMap = {}
        let legend = new Set()
        let axis = new Set()
        // let data = this.stackAreaRecordList.slice()
        let data = this.generateData()
        let guessData1 = this.getGuessData1(data)
        let guessData2 = this.getGuessData2(data)
        
        this.alarmCount = this.getAlarmCount(data, guessData2)
        this.RMSE = this.getRMSE(data, guessData2)
        // guessData2.pop()
        // guessData2.shift()

        // data = data.concat(guessData1)
        data = data.concat(guessData2)

        data.forEach(record => {
          let {name} = record
          legend.add(name)
          if (nameMap[name] === undefined) {
            nameMap[name] = [record]
          } else {
            nameMap[name].push(record)
          }
        })
        legend = [...legend]
        let series = []
        legend.forEach((name, index) => {
          let recordList = nameMap[name]
          let data = []
          recordList.sort((a, b) => a.index - b.index)
          recordList.forEach(record => {
            const {value, index_display: display} = record
            data.push(value)
            axis.add(display)
          })
          series.push({
            name,
            data,
            type: 'line',
            stack: `总量${index}`,
            smooth: true
          })
        })
        axis = [...axis]
        stackAreaOption.legend.data = legend
        stackAreaOption.xAxis[0].data = axis
        stackAreaOption.series = series
        this.charts.setOption(stackAreaOption, true)
        this.$nextTick(() => {
          this.charts.resize()
        })
      },
      // 指数平滑
      exponentialSmoothing(series, alpha){
        let res = [series[0]]
        for(let i = 1; i < series.length; i++){
          let value = alpha * series[i] + (1 - alpha) * res[i-1]
          res.push(+value.toFixed(2))
        }
        return res
      },
      getGuessData1(record) {
        let { size, forgetRate } = this
        let list = _.cloneDeep(record)
        let data = list.map(item => item.value)
        let len = list.length
        
        // 滑动窗口版本
        // let res = list.slice(0, size)
        // res.forEach(item => item.name = 'test')
        // for(let i = size; i < len; i++){
        //   let item = {
        //     index: _.get(list, [i, 'index'], ''),
        //     name: "test",
        //     value: Math.ceil(this.exponentialSmoothing(data.slice(i - size, i), forgetRate/100)[size-1]),
        //     index_display: _.get(list, [i, 'index_display'], '')
        //   }
        //   res.push(item)
        // }
        // 去掉滑动窗口
        let res = []
        let guessRes = this.exponentialSmoothing(data, forgetRate/100)
        for(let i = 0; i < len; i++){
          let item = {
            index: _.get(list, [i, 'index'], ''),
            name: "单次指数平滑",
            value: i == 0 ? data[0] : guessRes[i-1],
            index_display: _.get(list, [i, 'index_display'], '')
          }
          res.push(item)
        }
        console.log(res)
        return res
      },
      getGuessData2(record) {
        let { size, forgetRate } = this
        let list = _.cloneDeep(record)
        let data = list.map(item => item.value)
        
        let S1 = this.exponentialSmoothing(data, forgetRate/100)
        S1.unshift(data[0])
        let S2 = this.exponentialSmoothing(S1, forgetRate/100)
        
        let A = S1.map((item, index)=>{
          return +(2*item-S2[index])
        })
        
        let B = S1.map((item, index)=>{
          let rate = forgetRate/100
          return +((rate/(1-rate))*(item - S2[index]))
        })
        // console.log(S1, S2, A, B)

        // 滑动窗口版本
        // let res = list.slice(0, size)
        // res.forEach(item => item.name = 'test')
        // for(let i = size; i < len; i++){
        //   let item = {
        //     index: _.get(list, [i, 'index'], ''),
        //     name: "test",
        //     value: Math.ceil(this.exponentialSmoothing(data.slice(i - size, i), forgetRate/100)[size-1]),
        //     index_display: _.get(list, [i, 'index_display'], '')
        //   }
        //   res.push(item)
        // }
        // 去掉滑动窗口
        let res = []
        let len = B.length
        for(let i = 0; i < len; i++){
          let item = {
            index: _.get(list, [i, 'index'], _.get(list, [i-1, 'index']) + 60),
            name: "二次指数平滑",
            value: i == 0 ? data[0].toFixed(2) : (A[i]+B[i]).toFixed(2),
            // value: A[i+1]+B[i+1],
            index_display: _.get(list, [i, 'index_display'], moment(_.get(list, [i-1, 'index']) + 60).format('MM  HH'))
          }
          res.push(item)
        }
        return res
      },
      getAlarmCount(real = [], guest = []) {
        return real.filter((item, index)=> item.value > guest[index].value).length
      },
      getRMSE(real = [], guest = []) {
        let len = real.length || 1
        let res = real.reduce((pre, cur, index)=> {
          let diff = pre + (cur.value - guest[index+1].value)**2
          return diff
        }, 0)
        return Math.floor(Math.sqrt(res/len))
      }
    }
  }
</script>

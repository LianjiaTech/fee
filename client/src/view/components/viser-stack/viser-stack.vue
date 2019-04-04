<template>
  <div>
    <Loading :isSpinShow="isSpinShow"></Loading>
    <v-chart
      :forceFit="forceFit"
      :height="height"
      :data="dv"
      :scale="scale"
      :padding='padding'
    >
      <v-tooltip/>
      <v-axis/>
      <v-line
        position="index*value"
        :size="2"
        color="name"
        adjust="stack"
        v-if="hasLine"
      />
      <v-legend
        dataKey="name"
        position="bottom"
      />
      <v-stack-area
        position="index*value"
        color="name"
      />
    </v-chart>
    <v-plugin v-if="showScroll&&start&&end">
      <v-slider
        width="auto"
        height="26"
        :start="start"
        :end="end"
        xAxis="index"
        yAxis="value"
        :scale="scale"
        :data="data"
        :backgroundChart="{type:'line'}"
        :onChange="onChange"
      ></v-slider>
    </v-plugin>
  </div>
</template>

<script>
  import Loading from '@/view/components/loading/loading.vue'
  import DataSet from '@antv/data-set'

  export default {
    name: 'StackArea',
    data () {
      return {
        start: '',
        end: '',
        dv: []
      }
    },
    components: {
      Loading
    },
    props: {
      height: Number,
      data: Array,
      scale: Array,
      showScroll: {
        type: Boolean,
        default: false
      },
      colorName: {
        type: String,
        default: 'name'
      },
      isSpinShow: {
        type: Boolean,
        default: false
      },
      hasLine: {
        type: Boolean,
        default: true
      },
      forceFit: {
        type: Boolean,
        default: true
      },
      padding: {
        type: Array,
        default: () => [50, 50, 150, 50]
      }
    },
    mounted () {
    },
    watch: {
      data (curVal) {
        if (this.showScroll) {
          const startItem = curVal[0]
          let endItem
          const countArray = []
          for (const item of curVal) {
            if (countArray.length >= 50) {
              endItem = item
              break
            }
            const { index } = item
            if (!countArray.some(t => t === index)) {
              countArray.push(index)
            }
          }
          if (!endItem) {
            endItem = curVal[curVal.length - 1]
          }
          if (startItem && endItem) {
            this.start = startItem.index
            this.end = endItem.index
            this.dv = this.getData()
            return
          }
        }
        this.start = undefined
        this.end = undefined
        this.dv = curVal
      }
    },
    methods: {
      getData () {
        const { data, start, end } = this
        const startIndex = data.findIndex(obj => obj.index === start)
        const endIndex = data.findIndex(obj => obj.index === end)
        return data.slice(startIndex,endIndex)
      },
      onChange (_ref) {
        const startValue = _ref.startValue,
          endValue = _ref.endValue
        this.start = startValue
        this.end = endValue
        this.dv = this.getData()
      }
    }
  }
</script>

<style lang="less" scoped>
</style>

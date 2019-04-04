<template>
  <div >
    <Loading :isSpinShow="isSpinShow"></Loading>
    <v-chart :forceFit="true" :height="height" :data="multiData" :scale="pieScale">
      <v-tooltip :showTitle="false"/>
      <v-coord type="theta" :radius="0.5"/>
      <v-pie position="percent" :label="type" :color="typeColor" :select="false" :vStyle="pieStyle" :tooltip="tooltip"/>
      <v-view :data="multiOutData" :scale="pieScale">
        <v-coord type="theta" :radius="0.75" :innerRadius="0.5 / 0.75"/>
        <v-pie position="percent" label="key" color="key" :select="false" :vStyle="pieStyle" :tooltip="tooltipOut"/>
      </v-view>
    </v-chart>
  </div>
</template>

<script>
import Loading from '@/view/components/loading/loading.vue'
export default {
  name: 'multiPie',
  components: {
    Loading
  },
  data () {
    return {
      pieScale: [{
        dataKey: 'percent',
        min: 0,
        formatter: '.2%'
      }],
      pieStyle: {
        stroke: '#fff',
        lineWidth: 1
      },
      type: ['type', {
        offset: -10
      }]
    }
  },
  props: {
    height: Number,
    multiData: Array,
    padding: Array,
    tooltip: Array,
    tooltipOut: Array,
    multiOutData: Array,
    typeColor: Array,
    isSpinShow: Boolean
  },
  mounted () {

  },
  methods: {}
}
</script>

<style lang="less" scoped>

</style>

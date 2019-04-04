<template>
  <div>
    <Loading :isSpinShow="isSpinShow"></Loading>
    <v-chart
      :forceFit="true"
      :height="height"
      :data="data"
      :scale="pieScale"
      :padding="padding"
      :onClick="eventChange"
    >
      <v-tooltip
        :showTitle="false"
        dataKey="name*percent"
      />
      <v-axis />
      <!--<v-legend dataKey="name" position="bottom" />-->
      <v-pie
        position="percent"
        color="name"
        :v-style="pieStyle"
        :label="labelConfig"
      />
      <v-coord type="theta" />
    </v-chart>
  </div>
</template>

<script>
import Loading from '@/view/components/loading/loading.vue'
export default {
  name: 'ViserPie',
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
      labelConfig: ['percent', {
        formatter: (val, item) => {
          return item.point.name
        }
      }]
    }
  },
  props: {
    height: Number,
    data: Array,
    padding: Array,
    isSpinShow: Boolean
  },
  mounted () {

  },
  methods: {
    eventChange (ev) {
      this.$emit('pieChange', ev)
    }

  }
}
</script>

<style lang="less" scoped>
</style>

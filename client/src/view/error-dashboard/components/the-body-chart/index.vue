<template>
  <Tabs>
    <TabPane label="堆叠图"
             icon="md-pulse">
      <Card shadow>
        <RadioGroup v-model="filter"
                    type="button"
                    @on-change="handleFilterChange"
                    size="large">
          <Radio label="hour">小时</Radio>
          <Radio label="minute">分钟</Radio>
        </RadioGroup>
        <div style='height:450px'>
          <StackArea :height="450"
                     :showScroll="filter==='minute'"
                     :data="stackAreaRecordList"
                     :scale="stackAreaScale"
                     :isSpinShow="isSpinShowStack"
                     :padding='[50, 30, 180, 70]'>
          </StackArea>
        </div>
      </Card>
    </TabPane>
    <TabPane label="扇形图"
             icon="md-pie">
      <Card shadow>
        <div style='height:450px'>
          <ViserPie :data="pieChartDistribution"
                    :height="450"
                    :padding="[50, 50, 50, 50]"
                    :isSpinShow="isSpinShowPie"/>
        </div>
      </Card>
    </TabPane>
    <TabPane label="地图"
             icon="md-map">
      <Col span="16">
        <Card shadow>
          <Loading :isSpinShow="isSpinShowMap"></Loading>
          <ve-map :data="geographyChartDistributionRecord"
                  :height="400+'px'"/>
        </Card>
      </Col>
      <Col span="8">
        <Card shadow>
          <p slot="title">排名</p>
          <Table size='small'
                 :columns='Mapcolumns'
                 :data='mapTableData'
                 :loading="tableLoading"
                 :height="450"/>
        </Card>
      </Col>
    </TabPane>
  </Tabs>
  </Card>
  </Row>
</template>
<script>
  import Loading from 'src/view/components/loading/loading.vue'
  import StackArea from 'src/view/components/viser-stack/viser-stack.vue'
  import ViserPie from 'src/view/components/viser-pie/viser-pie.vue'
  import VeMap from 'v-charts/lib/map.common'

  export default {
    name: 'TheBodyChart',
    components: {
      Loading,
      StackArea,
      ViserPie,
      VeMap
    },
    props: {
      stackAreaRecordList: {
        type: Array,
        default: []
      },
      stackAreaScale: {
        type: Array,
        default: []
      },
      isSpinShowStack: {
        type: Boolean,
        default: false
      },
      pieChartDistribution: {
        type: Array,
        default: []
      },
      isSpinShowPie: {
        type: Boolean,
        default: false
      },
      isSpinShowMap: {
        type: Boolean,
        default: false
      },
      geographyChartDistributionRecord: {
        type: Object,
        default: {}
      },
      Mapcolumns: {
        type: Array,
        default: []
      },
      mapTableData: {
        type: Array,
        default: []
      },
      tableLoading: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return {
        filter: 'hour'
      }
    },
    mounted () { },
    methods: {
      handleFilterChange (filter) {
        this.filter = filter
        this.$emit('listenHandleFilterChange', filter)
      }
    }
  }
</script>

<style lang="less" scoped>
</style>

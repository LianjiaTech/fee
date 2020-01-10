<template>
  <div class="cmp-dot-data-filter">
    <Form :label-width="70">
      <FormItem label="时间范围">
        <DatePicker
          :value="timeRange"
          format="yyyy-MM-dd"
          type="daterange"
          placement="bottom-start"
          placeholder="请选择时间"
          style="width: 180px"
          :options="{
            disabledDate: (date) => date && date.valueOf() > Date.now()
          }"
          @on-change="onTimeRangeChange"
        />
        <Select v-model="count_type" prefix="md-locate" style="width:150px" @on-change="handleConditionChange">
          <Option value="hour">按小时</Option>
          <Option value="day">按天</Option>
        </Select>
      </FormItem>
      <FormItem label="事件">
        <Select v-model="event" prefix="md-locate" style="width:150px" @on-change="handleConditionChange">
          <Option v-for="item in eventsConfig" :value="item.event_name" :key="item.id">{{ item.event_display_name }}</Option>
        </Select>
        <strong class="filter-keyword">的</strong>
        <!-- <Select v-model="measures.aggregator" style="width:150px" @on-change="handleConditionChange">
          <Option v-for="item in measuresConfig" :value="item.value" :key="item.value">{{ item.name }}</Option>
        </Select> -->
        <Cascader transfer v-model="measures" trigger="hover" :data="measuresConfig" style="display: inline-block; width:150px" @on-change="handleConditionChange" :render-format="format" />
      </FormItem>
      <FormItem label="按">
        <Select v-model="by_fields" prefix="ios-options" style="width:150px" @on-change="handleConditionChange">
          <Option v-for="item in by_fieldsConfig" :value="item.props_name" :key="item.id">{{ item.props_display_name }}</Option>
        </Select>
        <strong class="filter-keyword">查看</strong>
      </FormItem>
    </Form>
    <section class="filter-contions">
      <div class="filter-group-control">
        <div class="filter-group-relation" v-if="conditionsCache.length > 1">
          <div class="relation-topline"></div>
          <RadioGroup v-model="filter.relation" type="button" @on-change="handleConditionChange">
            <Radio label="or" v-show="filter.relation === 'and'">且</Radio>
            <Radio label="and" v-show="filter.relation === 'or'">或</Radio>
          </RadioGroup>
          <div class="relation-bottomline"></div>
        </div>
        <div class="filter-contain">
          <div class="filter-item" v-for="(item, index) in conditionsCache" :key="index">
            <Select v-model="conditionsCache[index].field" style="width:150px" @on-change="(val) => handlePropsChange(index, val)">
              <Option v-for="prop in propsConfig" :value="prop.props_name" :key="prop.id">{{ prop.props_display_name }}</Option>
            </Select>
            <Select v-model="conditionsCache[index].function" style="width:100px" @on-change="handleConditionChange">
              <Option v-for="(item, index) in getFunctions(conditionsCache[index].field)" :value="item.value" :key="index">{{ item.name }}</Option>
            </Select>
            <!-- props_data_type -->
            <Input type="number" style="width: 200px" placeholder="请输入数字" v-if="conditionsCache[index].type === 'number'" v-model="conditionsCache[index].params" @on-blur="handleConditionChange" />
            <Input autofocus style="width: 200px" placeholder="请输入" v-if="conditionsCache[index].type === 'string'" v-model="conditionsCache[index].params" @on-blur="handleConditionChange" />
            <RadioGroup @on-change="handleConditionChange" v-if="conditionsCache[index].type === 'boolean'" v-model="conditionsCache[index].params">
              <Radio :label="true">是</Radio>
              <Radio :label="false">否</Radio>
            </RadioGroup>
            <Icon type="md-remove-circle" @click="handleDelConditions(index)" size="24" color="red" style="cursor: pointer;" />
          </div>
        </div>
      </div>
    </section>
    <section class="filter-add">
      <a href="javascript:void 0;" @click="handleAddConditions"> <Icon type="md-add" size="18" />筛选条件 </a>
    </section>
  </div>
</template>
<script>
  import _ from 'lodash'
  import moment from 'moment'
  import * as ApiDot from 'src/api/dot'
  import { getMeasuresConfig, functionsConfig } from '../../conf.js'

  const START = moment()
    .subtract(7, 'days')
    .format('YYYY-MM-DD')
  const END = moment().format('YYYY-MM-DD')

  export default {
    props: {},
    data() {
      return {
        timeRange: [START, END],
        count_type: 'day',
        by_fields: '',
        conditionsCache: [],
        filter: {
          conditions: [],
          relation: 'and'
        },
        event: '',
        measures: [],
        typesMap: new Map(),
        propsConfig: [],
        by_fieldsConfig: [],
        eventsConfig: [],
        measuresConfig: []
      }
    },
    computed: {},
    async mounted() {
      await this.getAllEvents()
      this.handleConditionChange()
    },
    methods: {
      // 根据属性的类型获取查询方法
      getFunctions(props) {
        let config = _.find(this.propsConfig, { props_name: props })
        let type = _.get(config, ['props_data_type'], '')
        return functionsConfig(type)
      },
      // 获取所有打点事件的配置
      async getAllEvents() {
        await ApiDot.query().then((res) => {
          if (res.code == 0) {
            let rawConfig = _.map(_.get(res, ['data'], []), (item) => {
              let props = _.get(item, ['properties'], [])
              item.properties = _.filter(props, (prop) => prop.is_visible)
              return item
            })
            this.eventsConfig = _.filter(rawConfig, (item) => item.is_visible)
            this.event = _.get(this.eventsConfig, [0, 'event_name'], '')
          }
        })
      },
      // 属性变化
      handlePropsChange(index, value) {
        this.conditionsCache[index].field = value
        this.conditionsCache[index].type = this.typesMap.get(value)
        this.handleConditionChange()
      },
      // 添加筛选条件
      handleAddConditions() {
        let defaultField = _.get(this.propsConfig, [0, 'props_name'], '')
        let condition = {
          field: defaultField,
          function: _.get(this.getFunctions(defaultField), [0, 'value'], ''),
          type: this.typesMap.get(defaultField),
          params: ''
        }
        this.conditionsCache.push(condition)
      },
      // 删除筛选条件
      handleDelConditions(index) {
        this.conditionsCache.splice(index, 1)
        this.handleConditionChange()
      },
      // 起始时间发生变化
      onTimeRangeChange(time) {
        this.timeRange = time
        this.handleConditionChange()
      },
      // 筛选条件发生变化
      handleConditionChange: _.debounce(function() {
        let formatConditons = (conditions) => {
          conditions.forEach((condition) => {
            let type = condition.type
            let value = condition.params
            switch (type) {
              case 'number':
                condition.params = +value
                break
              case 'boolean':
                condition.params = !!value
                break
              default:
                condition.params = value += ''
                break
            }
          })
          return conditions
        }
        let params = {
          count_type: this.count_type,
          by_fields: this.by_fields,
          start_date: _.get(this.timeRange, [0], START),
          end_date: _.get(this.timeRange, [1], END),
          filter: {
            relation: _.get(this.filter, ['relation'], ''),
            conditions: formatConditons(_.filter(this.conditionsCache, (c) => c.params !== ''))
          },
          measures: {
            event: this.event,
            field: _.get(this.measures, [0], ''),
            aggregator: _.get(this.measures, [1], 'Count')
          }
        }
        this.$emit('on-change', params)
        this.$bus.$emit('dot-filter-change', {
          byFields: _.get(params, 'by_fields', ''),
          name: _.get(
            this.eventsConfig.find((item) => item.event_name === this.event),
            'event_display_name',
            ''
          ),
          propName: _.get(
            this.propsConfig.find((item) => item.props_name === _.get(params, ['measures', 'field'], '')),
            'props_display_name',
            '总次数'
          ),
          func: _.get(params, ['measures', 'aggregator'], '')
        })
      }, 200),
      format(labels, selectedData) {
        return labels.join('的')
      }
    },
    watch: {
      event: function(val) {
        let event = _.find(this.eventsConfig, (config) => {
          return config.event_name === val
        })
        this.propsConfig = _.get(event, ['properties'], [])
        this.by_fieldsConfig = [{ props_display_name: '总体', props_name: 'total' }, ...this.propsConfig]
        this.by_fields = _.get(this.by_fieldsConfig, [0, 'props_name'], '')
        this.typesMap = this.propsConfig.reduce((pre, cur) => {
          pre.set(cur.props_name, cur.props_data_type)
          return pre
        }, new Map())
        this.measuresConfig = getMeasuresConfig(this.propsConfig)
        this.measures = [_.get(this.measuresConfig, [0, 'label'], ''), 'Count']
      }
    }
  }
</script>
<style lang="less" scoped>
  .cmp-dot-data-filter {
    background: #fff;
    padding: 10px 0 10px 20px;
    border-bottom: 1px solid #ddd;
    .filter-keyword {
      padding: 0 5px;
      color: #333;
    }
    .filter-contions {
      padding: 5px 0;
      &:hover {
        background: #559ff00f;
      }
      .filter-group-control {
        align-items: center;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        position: relative;
        margin-left: 10px;
        padding-left: 12px;
        border-left: 2px #6fd3b3 solid;
      }
      .filter-contain {
        width: 94%;
        padding-left: 41px;
        .filter-item {
          margin: 6px 8px;
        }
      }
      .filter-group-relation {
        width: 30px;
        position: absolute;
        // calc(100% - 10px)的写法，less会把它当表达式计算
        height: calc(~'100% - 10px');
        .relation-topline {
          margin: 15px 0 0 20px;
          border-left: 1px solid #ccc;
          border-top: 1px solid #ccc;
          width: 100%;
          height: calc(~'50% - 32px');
        }
        .relation-bottomline {
          margin: 0 0 15px 20px;
          border-left: 1px solid #ccc;
          border-bottom: 1px solid #ccc;
          width: 100%;
          height: calc(~'50% - 32px');
        }
        .btn {
          background: #f6f8fa;
          border: 1px solid #a8b7c8;
          padding: 6px 0;
          display: inline-block;
          width: 30px;
          transition: background 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
      }
    }
    .filter-add {
      padding-top: 10px;
      padding-left: 10px;
      font-size: 14px;
    }
    .ivu-form-item {
      margin-bottom: 0px;
      padding: 10px 0;
      border-bottom: 1px solid #efefef;
      &:hover {
        background: #559ff00f;
      }
    }
  }
</style>

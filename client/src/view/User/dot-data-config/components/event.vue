<template lang="html">
  <Modal
    class-name="pg-dot_modal"
    :title="isEdit ? '编辑事件属性' : '新增事件'"
    v-model="showModal"
    :closable="false"
    @on-visible-change="handleVisibleChange">
    <Form ref="eventItem" :model="eventItem" :label-width="80">
      <section class="modal-event-info">
        <FormItem label="事件名" prop="event_name" :rules="{required: true, message: '不能为空', trigger: 'blur'}">
          <Input type="text" v-model="eventItem.event_name" :disabled="isEdit" placeholder="字母、数字、下划线组合"/>
        </FormItem>
        <FormItem label="显示名" prop="event_display_name" :rules="{required: true, message: '不能为空', trigger: 'blur'}">
          <Input type="text" v-model="eventItem.event_display_name" placeholder="最好为中文，便于查看"/>
        </FormItem>
        <FormItem label="标签">
          <Poptip trigger="click" title="新增标签" placement="bottom">
            <Tag :color="item.color" v-for="(item, index) in tagArr" :key="index">{{item.name}}</Tag>
            <Button icon="ios-add" type="dashed" size="small">添加标签</Button>
            <Select @on-change="handleTagsChange" :max-tag-count="1" multiple v-model="eventItem.event_tag_ids" filterable slot="content" transfer>
              <Option v-for="(tag, index) in tags" :value="tag.id" :key="index">{{ tag.name }}</Option>
            </Select>
          </Poptip>
        </FormItem>
        <FormItem label="备注">
          <Input :rows="2" type="textarea" v-model="eventItem.event_desc" :maxlength="200"/>
        </FormItem>
      </section>
      <div style="margin: 10px 0;">
        <strong>自定义属性</strong>
        <Icon type="md-add-circle" size="24" style="cursor: pointer;" @click="addProp"/>
      </div>
      <section class="modal-event-properties">
        <Table :columns="columns$2" :data="eventItem.properties">
          <template slot-scope="{ row, index }" slot="props_name">
            <FormItem :label-width="0" :prop="'properties.' + index + '.props_name'" 
              :rules="{required: true, message: '不能为空', trigger: 'blur'}">
              <Input type="text" v-model="eventItem.properties[index].props_name" :disabled="isEdit && !!data['properties'][index]"/>
            </FormItem>
          </template>
          <template slot-scope="{ row, index }" slot="props_display_name">
            <FormItem :label-width="0" :prop="'properties.' + index + '.props_display_name'"
            :rules="{required: true, message: '不能为空', trigger: 'blur'}">
              <Input type="text" v-model="eventItem.properties[index].props_display_name" />
            </FormItem>
          </template>
          <template slot-scope="{ row, index }" slot="props_data_type">
            <FormItem :label-width="0" :prop="'properties.' + index + '.props_data_type'"
              :rules="{required: true, message: '不能为空', trigger: 'blur'}">
              <Select 
                transfer
                :disabled="isEdit && !!data['properties'][index]"
                v-model="eventItem.properties[index].props_data_type">
                <Option value="string">文本</Option>
                <Option value="boolean">逻辑</Option>
                <Option value="number">数值</Option>
              </Select>
            </FormItem>
          </template>
          <template slot-scope="{ row, index }" slot="action">
            <i-switch size="small" :true-value="1" :false-value="0" v-model="eventItem.properties[index].is_visible"></i-switch>
          </template>
        </Table>
      </section>
    </Form>
    <section slot="footer">
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" @click="handleSubmit('eventItem')">确定</Button>
    </section>
  </Modal>
</template>
<script>
import { columns2 } from '../conf.js'
export default {
  props: {
    tags: {
      type: Array,
      default: []
    },
    data: {
      type: Object,
      default: {
        event_name: '',
        event_display_name: '',
        event_desc: '',
        event_tag_name: [],
				event_tag_ids: [],
				properties: []
      }
    },
    show: {
      type: Boolean,
      value: false
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tagArr: [],
      // 属性缓存
      properties: [],
      // 被删除属性缓存
      delArr: [],
      eventItem: {
        event_name: '',
        event_display_name: '',
        event_desc: '',
        event_tag_name: [],
				event_tag_ids: [],
				properties: []
      },
      showModal: false,
      columns$2: columns2(this),
    }
  },
  methods: {
    handleTagsChange(val) {
      this.eventItem.event_tag_ids = val
      this.tagArr = _.filter(this.tags, (tag)=> val.indexOf(tag.id) > -1)
    },
		addProp() {
		  this.eventItem.properties.push({
				props_name: '',
				props_display_name: '',
        props_data_type: '',
        is_delete: 0,
        is_visible: 1
			})
		},
		removeProp(data) {
      let propId = _.get(data, ['row', 'id'], '')
      if(propId){
        this.delArr.push(propId)
        this.delArr = Array.from(new Set(this.delArr))
      }
      this.eventItem.properties.splice(data.index, 1)
    },
    handlePropVisibleChange(isVisible){

    },
    handleSubmit(name) {
      this.$refs[name].validate((valid) => {
        if (!valid) return this.$Message.error('校验失败!')
        if(this.delArr.length > 0){
          this.properties.map(prop=> {
            if(_.includes(this.delArr, prop.id)){
              prop.is_delete = 1
            }
            return prop
          })
          this.eventItem.properties = this.properties
        }
        console.log(this.eventItem)
        this.$emit('on-submit', this.eventItem)
			})
    },
    handleCancel() {
      this.$emit('on-cancel')
    },
    handleVisibleChange(val) {
      // resetFields会重置表单值为空
      if(!val) {
        this.$refs['eventItem'].resetFields()
        this.delArr = []
      }
      this.$emit('on-visible-change', val)
    }
  },
  watch: {
    show(val) {
      this.eventItem = _.cloneDeep(this.data)
      let tags = _.get(this.data, ['event_tag_name'], [])
      let ids = tags.map(tag => tag.id)
      this.eventItem.event_tag_ids = ids
      this.properties = _.cloneDeep(this.eventItem.properties)
      this.tagArr = _.filter(this.tags, function(tag){
        return ids.indexOf(tag.id) > -1
      })
      this.showModal = val
    }
  }
}
</script>

<style lang="less">
  .ivu-table-cell {
    .ivu-form-item{
      margin-bottom: 0;
    }
  }
</style>



<template>
	<div class="pg-dot-config">
		<div style="margin-bottom: 20px;">
			<Button type="primary" icon="md-add" @click="handleModalShow(false)">新增事件</Button>
			<TagMange :tags="tags" @on-ok="getTags"/>
		</div>
		<Table border :columns="columns$1" :data="events" :loading="loading">
			<template slot-scope="{ row, index }" slot="event_tag_name">
				<Tag v-for="(tag, index) in row.event_tag_name" :key="index" :color="tag.color">{{tag.name}}</Tag>
			</template>
			<template slot-scope="{ row, index }" slot="action">
				<Icon type="ios-create" size="24" color="#2d8cf0" style="cursor:pointer;" @click="handleModalShow(true, row)"></Icon>
				<i-switch size="large" @on-change="(val)=>handleVisibleChange(row,val)" :value="!!row.is_visible">
					<span slot="open">可见</span>
					<span slot="close">不可</span>
				</i-switch>
			</template>
		</Table>
		<EventMange 
			:tags="tags"
			:data="eventItem" 
			:show="showPanel" 
			:isEdit="isEdit" 
			@on-submit="onSubmit" 
			@on-cancel="onCancel"
			@on-visible-change="onVisibleChange" />
		<Modal
			v-model="delConfirm"
			title="删除"
			:loading="loading"
			@on-ok="removeEvent">
			<strong style="color: red; font-size: 14px;">删除之后，之前的数据将一并删除！确定要删除吗？</strong>
    </Modal>
	</div>
</template>

<script>
import * as ApiDot from 'src/api/dot'
import { columns1, optCol } from './conf'
import EventMange from './components/event'
import TagMange from './components/tag'

const EVENT = {
	event_name: '',
	event_display_name: '',
	event_tag_name: [],
	properties: []
}
export default {
	name: 'dot-data-config',
	components: {
		EventMange,
		TagMange
	},
	data () {
		return {
			loading: true,
			visible: false,
			isEdit: false,
			showPanel: false,
			delConfirm: false,
			eventId: 0,
			columns$1: columns1(this),
			tags: [],
			events: [],
			eventItem: {}
		}
	},
	mounted() {
		this.getList()
		this.getTags()
	},	
	methods: {
		async getTags() {
      let res = await ApiDot.queryTags()
      this.tags = _.get(res, ['data'], [])
		},
		// 获取事件list
		getList() {
			ApiDot.query().then(res=> {
				this.events = res.data
				this.loading = false
			})
		},
		// 删除事件
		async removeEvent() {
			this.loading = true
			await this.onUpdate({ id: this.eventId, is_delete: 1 })
			this.loading = false
			this.getList()
		},
		// 切换事件的可见性
		handleVisibleChange(row, val) {
			if(!row.id) return 
			this.onUpdate({ id: row.id, is_visible: +val })
		},
		// 编辑|| 新增事件弹窗
		handleModalShow(isEdit, rowData = EVENT) {
			this.isEdit = isEdit
			this.eventItem = rowData 
			this.onVisibleChange(true)
		},
		// 编辑 | 新增事件提交
		async onSubmit(data) {
			this.isEdit ? await this.onUpdate(data)	: await this.onAdd(data)	
			this.onVisibleChange(false)
			this.getList()
		},
		// onAdd
		onAdd(data) {
			return ApiDot.add(data).then(res=> {
				if(res.code === 0) this.$Message.success('创建成功!')
			})
		},
		// 事件更新 || 删除
		onUpdate(data) {
			return ApiDot.update(data).then(res => {
				if(res.code === 0) this.$Message.success('更新成功!')
			}) 
		},
		// 取消
		onCancel () {
			this.onVisibleChange(false)
		},
		onVisibleChange(val) {
			this.showPanel = val
		}
	}
}
</script>

<style lang="less">
	.pg-dot_modal{
		.modal-event-info{
			padding: 20px 20px 10px 0;
			background: #ddd;
		}
	}
</style>



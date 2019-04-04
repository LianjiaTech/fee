<template>
  <div>
    <col span="8">
    <Card :bordered="false"
          shadow
          class="info-card-wrapper">
      <p slot="title">
        成员管理
        <AddUser v-on:listenAdd="addNew"></AddUser>
      </p>
      <Table ref="selection"
             :columns='columns'
             :data='list'></Table>
    </Card>
    </col>
    <Modal v-model="isEdit"
           title="成员角色编辑"
           @on-ok="saveEdit"
           @on-cancel="cancelEdit">
      <Form :model="editParam"
            label-position="left"
            :label-width="100">
        <FormItem label="账号">
          <Input style="width:300px"
                 disabled
                 :value="editIndex.ucid || ''" />
        </FormItem>
        <FormItem label="名字">
          <Input style="width:300px"
                 disabled
                 :value="editIndex.nickname || ''" />
        </FormItem>
        <FormItem label="角色">
          <Select style="width:300px"
                  v-model="editParam.role"
                  :placeholder='editIndex.role'>
            <Option v-for="item in roleList"
                    :value="item.value"
                    :key="item.value">{{ item.label }}</Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
    </col>
  </div>
</template>
<script>
import AddUser from './components/addUser/index.vue'
import { getMemberDel, getMemberInfo, getMemberUpdate } from '@/api/member'

export default {
  components: {
    AddUser
  },
  data () {
    return {
      columns: [{
        title: '用户id',
        key: 'ucid',
        align: 'center'
      }, {
        title: '用户昵称',
        key: 'nickname',
        align: 'center'
      }, {
        title: '用户角色',
        key: 'role',
        align: 'center'
      }, {
        title: '报警',
        key: '',
        align: 'center',
        width: 100,
        render: (h, params) => {
          return h('div', [
            h('iSwitch', {
              props: {
                value: params.row.need_alarm === 1
              },
              on: {
                'on-change': (status) => {
                  this.toggle(status, params)
                }
              }
            })
          ])
        }
      }, {
        title: '操作',
        key: 'action',
        width: 200,
        align: 'center',
        render: (h, params) => {
          return h('div', [
            h(
              'icon',
              {
                props: {
                  type: 'ios-create',
                  size: '24',
                  color: '#2db7f5'
                },
                on: {
                  click: () => {
                    this.edit(params)
                  }
                }
              }
            ),
            h(
              'icon',
              {
                props: {
                  type: 'md-close',
                  size: '24',
                  color: '#dd5a43'
                },
                on: {
                  click: () => {
                    this.$Modal.confirm({
                      title: '确认删除?',
                      onOk: () => {
                        this.remove(params)
                      }
                    })
                  }
                }
              }
            )
          ])
        }
      }],
      list: [],
      isEdit: false,
      roleList: [
        {
          value: 'dev',
          label: 'dev'
        },
        {
          value: 'owner',
          label: 'owner'
        }
      ],
      editIndex: {},
      editParam: {},
      delMsg: '',
      editMsg: ''
    }
  },
  mounted () {
    this.getMemberInfo()
  },
  methods: {
    // 用户列表
    async getMemberInfo () {
      const res = await getMemberInfo()
      this.list = res.data
    },
    // 新增一行
    addNew () {
      this.getMemberInfo()
    },
    // 删除用户
    async remove (params) {
      await this.getMemberDel(params.row.id)
      this.$Message.info(this.delMsg)
      this.getMemberInfo()
    },
    // 删除用户数据
    async getMemberDel (id) {
      const res = await getMemberDel({
        id: id
      })
      this.delMsg = res.msg
    },
    // 编辑某一行，弹窗显示并传值
    edit (param) {
      this.isEdit = true
      this.editIndex = param.row
    },
    // 用户更新
    async getMemberUpdate (params = {}) {
      const res = await getMemberUpdate({
        id: params.id,
        role: params.role,
        need_alarm: params.need_alarm
      })
      this.editMsg = res.msg
    },
    // 保存编辑用户内容，并刷新用户列表
    async saveEdit () {
      this.editParam.id = this.editIndex.id
      await this.getMemberUpdate(this.editParam)
      this.$Message.info(this.editMsg)
      this.getMemberInfo()
      this.editParam = {}
    },
    // 取消编辑
    cancelEdit () {
      this.$Message.info('取消编辑')
      this.editParam = {}
    },
    async toggle (status, params) {
      let row = params.row
      if (status) {
        row['need_alarm'] = 1
      } else {
        row['need_alarm'] = 0
      }
      await this.getMemberUpdate(row)
      this.getMemberInfo()
    }
  }

}
</script>

<style lang="less" scoped>
</style>

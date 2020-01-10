<!-- @format -->

<template>
  <div>
    <Card :bordered="false" shadow class="info-card-wrapper">
      <Card>
        <Table :loading="pageState.loading" :data="list" :columns="columns" stripe></Table>
      </Card>
      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page
            :total="pageState.total"
            :current="current"
            :page-size="pageState.limit"
            @on-change="changePage"
          ></Page>
        </div>
      </div>
    </Card>

    <Modal v-model="pageState.modalShow" width="800">
      <p slot="header" style="text-align:center">
        <Icon type="ios-information-circle"></Icon>
        <span>接入审核</span>
      </p>
      <div style="text-align:center">
        <Form ref="formValidate" :model="formValidate" :rules="ruleValidate" :label-width="80">
          <FormItem label="项目名称" prop="display_name">
            <Input
              v-model="formValidate.display_name"
              :disabled="formValidate.status !== 0"
              placeholder="请输入接入项目名称"
            ></Input>
          </FormItem>

          <FormItem label="项目pid" prop="project_name">
            <Input
              v-model="formValidate.project_name"
              :disabled="formValidate.status !== 0"
              placeholder="请输入接入项目名称"
            ></Input>
          </FormItem>

          <Row>
            <Col span="8">
              <FormItem label="申请人" prop="apply_nick_name">
                <Input
                  v-model="formValidate.apply_nick_name"
                  placeholder="申请人邮箱"
                  :disabled="true"
                  style="width:200px"
                ></Input>
              </FormItem>
            </Col>
            <Col span="4"> </Col>
            <Col span="8">
              <FormItem label="邮箱" prop="apply_mail">
                <Input
                  v-model="formValidate.apply_mail"
                  placeholder="项目负责人邮箱"
                  :disabled="true"
                  style="width:200px"
                ></Input>
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span="8">
              <FormItem label="姓名" prop="c_desc">
                <Input
                  v-model="formValidate.c_desc"
                  placeholder="项目负责人姓名"
                  :disabled="true"
                  style="width:200px"
                ></Input>
              </FormItem>
            </Col>
            <Col span="4"> </Col>
            <Col span="8">
              <FormItem label="邮箱" prop="mail">
                <Input
                  v-model="formValidate.mail"
                  placeholder="项目负责人邮箱"
                  :disabled="true"
                  style="width:200px"
                ></Input>
              </FormItem>
            </Col>
          </Row>
          <FormItem label="抽样比" prop="rate">
            <Input
              v-model="proxyRate"
              :disabled="formValidate.status !== 0"
              placeholder="请输入抽样比"
            ></Input>
          </FormItem>

          <FormItem label="每日pv" prop="pv">
            <Input
              v-model="formValidate.pv"
              :disabled="true"
              placeholder="请输入每日得pv数量"
            ></Input>
          </FormItem>

          <FormItem label="首页" prop="home_page">
            <Input
              v-model="formValidate.home_page"
              placeholder="请输入项目首页地址"
              :disabled="true"
            ></Input>
          </FormItem>

          <FormItem label="申请备注" prop="apply_desc">
            <Input
              v-model="formValidate.apply_desc"
              type="textarea"
              :disabled="true"
              :autosize="{ minRows: 2, maxRows: 5 }"
              placeholder="填写备注"
            ></Input>
          </FormItem>

          <FormItem label="审核备注">
            <Input
              v-model="formValidate.review_desc"
              type="textarea"
              :disabled="formValidate.status !== 0"
              :autosize="{ minRows: 2, maxRows: 5 }"
              placeholder="审核备注会显示在邮件上，至少5个字符"
            ></Input>
          </FormItem>
        </Form>
      </div>
      <div slot="footer" v-show="formValidate.status === 0">
        <Button
          type="success"
          :loading="pageState.modalLoading"
          @click="handleSubmit('formValidate', 1)"
          >通过</Button
        >
        <Button
          type="error"
          :loading="pageState.modalLoading"
          @click="handleSubmit('formValidate', 2)"
          >驳回</Button
        >
      </div>
      <div slot="footer" v-show="formValidate.status !== 0">
        <Button :loading="pageState.modalLoading" @click="pageState.modalShow = false">关闭</Button>
      </div>
    </Modal>
  </div>
</template>
<script type="text/jsx">
  import moment from 'moment'
  import _ from 'lodash-es'
  import { projectApplylist, projectApplyUpdate } from 'src/api/project_apply'
  //   display_name: '',  //项目名称
  //   project_name: '',  //项目Pid
  //   c_desc: '', //备注  会被转化为负责人姓名
  //   mail: '', //负责人邮箱 会被自动转化
  //   rate: 10000, //数据抽样比
  //   pv: '',  // PV数据
  //   home_page: '', // 项目首页地址
  //   ucid: '',   // ucid
  //   apply_desc: '' // 申请备注
  //   status:0  //  pending 待审核， pass 通过  refused 拒绝
  //   review_desc:''
  //   apply_ucid: '',//申请人的ucid
  //   apply_nick_name: '',//申请人的名字
  //   apply_mail: '' //申请人的邮箱
  //   review_ucid:'', //审核人ucid
  //   review_nick_name:'',//审核人名字
  const statusMap = {
    0: { title: '待审核', color: 'primary' },
    1: { title: '通过', color: 'success' },
    2: { title: '驳回', color: 'error' }
  }

  export default {
    data () {
      return {
        pageState: {
          loading: false,
          modalShow: false,
          modalLoading: false,
          total: 0,
          limit: 10,
          offset: 0
        },
        list: [],
        columns: [
          {
            title: '项目名称',
            key: 'display_name'
          },
          {
            title: 'pid',
            key: 'project_name'
          },
          {
            title: '申请人',
            key: 'apply_nick_name'
          },
          {
            title: '项目负责人',
            key: 'c_desc'
          },
          {
            title: '状态',
            key: 'status',
            render: (h, params) => {
              const { status } = params.row
              const statusData = statusMap[status]
              const { title, color } = statusData
              return h('Tag', {
                props: {
                  type: 'dot',
                  color: color
                }
              }, title)
            }
          },
          {
            title: '提交时间',
            key: 'create_time',
            render: (h, params) => {
              const { create_time } = params.row
              return <span>{moment.unix(create_time).format('YYYY-MM-DD HH:mm')}</span>
            }
          },
          {
            title: '审核时间',
            key: 'update_time',
            render: (h, params) => {
              const { update_time } = params.row
              return <span>{moment.unix(update_time).format('YYYY-MM-DD HH:mm')}</span>
            }
          },
          {
            title: '审核人',
            key: 'review_nick_name'
          },
          {
            title: '操作',
            render: (h, params) => {
              const { status } = params.row
              if (status === 0) {
                return h('Button', {
                  props: {
                    type: 'primary',
                    size: 'small'
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: () => {
                      this.openForm(params.row)
                    }
                  }
                }, '审核')
              } else {
                return h('Button', {
                  props: {
                    size: 'small'
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: () => {
                      this.openForm(params.row)
                    }
                  }
                }, '查看')
              }
            }
          }
        ],
        formValidate: {},
        ruleValidate: {
          display_name: [
            { required: true, message: '项目名称不能为空', trigger: 'blur' }
          ],
          project_name: [
            { required: true, message: '项目pid不能为空', trigger: 'blur' },
            { validator: this.validatorPid, trigger: 'blur' }
          ],
          pv: [
            { required: true, validator: this.validatorNumber, trigger: 'blur' }

          ],
          rate: [
            { required: true, validator: this.validatorRate, trigger: 'blur' }

          ],
          home_page: [
            { required: true, message: '必须填写项目主页', trigger: 'blur' },
          ],
          c_desc: [
            { required: true, message: '负责人姓名不能为空', trigger: 'blur' },
          ],
          mail: [
            { required: true, message: '邮箱不能为空', trigger: 'blur' },
            { type: 'email', message: '邮箱地址必须符合邮箱格式', trigger: 'blur' }
          ],
          apply_nick_name: [
            { required: true, message: '申请人姓名不能为空', trigger: 'blur' },
          ],
          apply_mail: [
            { required: true, message: '邮箱不能为空', trigger: 'blur' },
            { type: 'email', message: '邮箱地址必须符合邮箱格式', trigger: 'blur' }
          ],
        }
      }
    },
    computed: {
      proxyRate: {
        set (val) {
          //保留两位小数
          val = val.toString().replace(/[\D\.]/, '')
          const num = Number(val)
          this.formValidate.rate = num.toFixed(2) * 100
        },
        get () {
          const num = Number(this.formValidate.rate) || 0

          return `${(num / 100).toFixed(2)}%`
        }
      },
      current: {
        set (val) {
          val = val - 1
          if (val < 0) {
            val = 0
          }
          const { limit } = this.pageState
          this.pageState.offset = val * limit
        },
        get () {
          const { limit, offset } = this.pageState
          return Math.floor(offset / limit) + 1
        }
      }
    },
    async mounted () {
      await this.getList()
    },
    methods: {
      async getList () {
        const { limit, offset } = this.pageState
        const query = {
          limit,
          offset
        }
        this.pageState.loading = true
        const result = await projectApplylist(query)
        this.pageState.loading = false
        if (result) {
          const {
            data: {
              limit,
              list,
              offset,
              total
            }
          } = result
          this.pageState.limit = limit
          this.pageState.offset = offset
          this.pageState.total = total
          this.list = list
        }
      },
      async handleSubmit (name, status) {
        const valid = await  new Promise(resolve => this.$refs[name].validate((valid) => resolve(valid)))
        if (!valid) {
          return this.$Message.error('申请表单校验出错')
        }
        if (status === 2 && (!this.formValidate.review_desc || this.formValidate.review_desc.length < 5)) {
          return this.$Message.error('驳回申请必须给出充分驳回理由')
        }
        this.pageState.modalLoading = true
        //
        const userData = _.get(this.$store.state, ['user'], {})
        const { ucid: review_ucid, userName: review_nick_name } = userData
        const uploadData = {
          ...this.formValidate,
          status,
          review_ucid,
          review_nick_name
        }
        const result = await  projectApplyUpdate(uploadData)
        if (result) {
          this.$Message.success('审核成功')
        }
        this.pageState.modalLoading = false
        this.pageState.modalShow = false
        this.getList()
      },
      openForm (data) {
        this.pageState.modalShow = true
        this.formValidate = data
      },
      changePage (page) {
        this.current = page
        this.getList()
      },
      validatorNumber (rule, value, callback) {
        if (!/^\d+$/.test(value)) {
          callback(new Error('必须是一个数字'))
        }
        callback()
      },
      validatorRate (rule, value, callback) {
        if (!_.isNumber(this.formValidate.rate)) {
          callback(new Error('抽样比必须是一个数字'))
        }
        callback()
      },
      validatorPid (rule, value, callback) {
        // 校验pid是否重复
        // 专门出个接口校验pid 是否存在

        callback()
      },
    }
  }
</script>
<style lang="less" scoped></style>

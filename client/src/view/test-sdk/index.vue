<template>
  <Row style="flex:1">
    <Col span="12">
    <Card
      :bordered="false"
      dis-hover
    >
      <div slot="title">SDK埋点测试</div>
      <Form
        :model="formTest"
        :label-width="80"
        style=""
      >
        <FormItem label="埋点指标">
          <RadioGroup
            v-model='formTest.type'
            type="button"
          >
            <Radio label="error">error</Radio>
            <Radio label="product">product</Radio>
            <Radio
              label="info"
              disabled
            >info</Radio>
          </RadioGroup>
        </FormItem>
        <Card dis-hover>
          <p slot="title">Common</p>
          <FormItem label="pid">
            <Input
              v-model='formTest.common.pid'
              placeholder="Please input pid"
            ></Input>
          </FormItem>
          <formItem>
            <Col span="6">
            <Button
              type="dashed"
              long
              @click="commonHandleAdd"
              icon="md-add"
            >Add key</Button>
            </Col>
          </formItem>
          <FormItem
            v-for="(item, index) in formTest.common.items"
            :key="index"
            v-if="item.status"
          >
            <Row>
              <Col span="8">
              <Input
                type="text"
                v-model="item.key"
                placeholder="Enter key"
              ></Input>
              </Col>
              <Col span="8">
              <Input
                type="text"
                v-model="item.value"
                placeholder="Enter value"
              ></Input>
              </Col>
              <Col
                span="4"
                offset="1"
              >
              <Button
                type="dashed"
                @click="commonHandleRemove(index)"
              >Delete</Button>
              </Col>
            </Row>
          </FormItem>
        </Card>
        <FormItem
          label="Code"
          style='margin-top:20px'
        >
          <InputNumber
            v-model='formTest.code'
            placeholder="Please input code"
          ></InputNumber>
        </FormItem>
        <Card dis-hover>
          <p slot="title"> detail
          </p>
          <formItem>
            <Col span="6">
            <Button
              type="dashed"
              long
              @click="handleAdd"
              icon="md-add"
            >Add key</Button>
            </Col>
          </formItem>
          <FormItem
            v-for="(item, index) in formTest.detail.items"
            :key="index"
            v-if="item.status"
          >
            <Row>
              <Col span="8">
              <Input
                type="text"
                v-model="item.key"
                placeholder="Enter key"
              ></Input>
              </Col>
              <Col span="8">
              <Input
                type="text"
                v-model="item.value"
                placeholder="Enter value"
              ></Input>
              </Col>
              <Col
                span="4"
                offset="1"
              >
              <Button
                type="dashed"
                @click="handleRemove(index)"
              >Delete</Button>
              </Col>
            </Row>
          </FormItem>
        </Card>
        <Card dis-hover>
          <p slot="title"> extra</p>
          <formItem>
            <Col span="6">
            <Button
              type="dashed"
              long
              @click="extraHandleAdd"
              icon="md-add"
            >Add key</Button>
            </Col>
          </formItem>
          <FormItem
            v-for="(item, index) in formTest.extra.items"
            :key="index"
            v-if="item.status"
          >
            <Row>
              <Col span="8">
              <Input
                type="text"
                v-model="item.key"
                placeholder="Enter key"
              ></Input>
              </Col>
              <Col span="8">
              <Input
                type="text"
                v-model="item.value"
                placeholder="Enter value"
              ></Input>
              </Col>
              <Col
                span="4"
                offset="1"
              >
              <Button
                type="dashed"
                @click="extraHandleRemove(index)"
              >Delete</Button>
              </Col>
            </Row>
          </FormItem>
        </Card>
      </Form>
      <div style='display:flex;flex-direction: row;flex-wrap: wrap;justify-content:flex-end;margin-top:10px'>
        <Button
          type="primary"
          style='margin-right:10px'
        >发送</Button>
        <Button type="error">清除</Button>
      </div>

    </Card>
    </Col>
    <Col span="12">
    <Card
      :bordered="false"
      dis-hover
    >
      <div slot="title">埋点查询
        <span style='padding-left:10px'>仅显示近5分钟的埋点数据</span>
        <i-Switch
          size="large"
          v-model="switch1"
          @on-change="autoRefreshLog"
          style="position: absolute;top: 10px;"
        >
          <span slot="open">刷新</span>
          <span slot="close">停止</span>
        </i-Switch>
        <Button
          type="primary"
          icon="md-refresh-circle"
          @click='refreshLog'
          style="position:absolute;top:5px;right:10px;"
        >刷新
        </Button>
      </div>
      <Table
        :columns='columns'
        :data='list'
        height='830'
      ></Table>
    </Card>
    </Col>
  </Row>
</template>

<script>
  import moment from 'moment'
  import { getTestInfo } from '@/api/info'
  import { clearInterval, setInterval } from 'timers'

  export default {
    components: {},
    data () {
      return {
        index: 1,
        formTest: {
          type: 'error',
          code: 1,
          detail: {
            items: [{
              value: '',
              key: '',
              status: 1
            }]
          },
          extra: {
            items: [{
              value: '',
              key: '',
              status: 1
            }]
          },
          common: {
            pid: '',
            items: [{
              value: '',
              key: '',
              status: 1
            }]
          }

        },
        columns: [{
          title: '日志',
          key: 'name'
        },
        {
          title: '时间',
          key: 'timestamp',
          render: (h, params) => {
            const {
                row
              } = params
            return h('div', moment(row.timestamp).format('YYYY/MM/DD HH:mm:ss'))
          }
        }
        ],
        list: [],
        st: Date.now() - 5 * 60 * 1000,
        et: Date.now(),
        switch1: false
      }
    },
    async mounted () {
      this.getTestInfo()
    },
    methods: {
      commonHandleRemove (index) {
        this.formTest.common.items[index].status = 0
        this.formTest.common.items[index] = []
      },
      commonHandleAdd () {
        this.formTest.common.items.push({
          key: '',
          value: '',
          status: 1
        })
      },
      handleAdd () {
        this.formTest.detail.items.push({
          key: '',
          value: '',
          status: 1
        })
      },
      handleRemove (index) {
        this.formTest.detail.items[index].status = 0
        this.formTest.detail.items[index] = []
      },
      extraHandleAdd () {
        this.formTest.extra.items.push({
          key: '',
          value: '',
          status: 1
        })
      },
      extraHandleRemove (index) {
        this.formTest.extra.items[index].status = 0
        this.formTest.extra.items[index] = []
      },
      cancelAll () {
        this.formTest = {
          type: 'error',
          code: 1,
          detail: {
            items: [{
              value: '',
              key: '',
              status: 1
            }]
          },
          extra: {
            items: [{
              value: '',
              key: '',
              status: 1
            }]
          },
          common: {
            pid: '',
            items: [{
              value: '',
              key: '',
              status: 1
            }]
          }
        }
      },
      submitAll () {
        const {
          detail,
          extra,
          type,
          code,
          common
        } = this.formTest
        const items = detail.items
        const itemsExtra = extra.items
        const commonItem = common.items
        const detailMap = {}
        const extraMap = {}
        const commonMap = {}

        commonItem.map(item => {
          if (!commonMap[item.key] && item.key && item.value) {
            commonMap[item.key] = item.value
          }
        })

        items.map(item => {
          if (!detailMap[item.key] && item.key && item.value) {
            detailMap[item.key] = item.value
          }
        })

        itemsExtra.map(item => {
          if (!extraMap[item.key] && item.key && item.value) {
            extraMap[item.key] = item.value
          }
        })
      
        
      },
      refreshLog () {
        this.et = Date.now()
        this.st = Date.now() - 300000
        this.list = []
        this.getTestInfo()
      },
      autoRefreshLog () {
        let timer = null
        if (this.switch1) {
          timer = setInterval(this.getTestInfo, 10000)
        } else {
          clearInterval(timer)
        }
      },
      async getTestInfo () {
        const res = await getTestInfo({
          st: this.st,
          et: this.et
        })
        if (res.data) {
          const dataList = res.data.split('\n').filter(item => !!item)
          this.list = dataList.map(item => {
            const spaceList = item.split('\t')
            const digUrl = decodeURIComponent(spaceList[15])
            const ret = digUrl.match('d=(.+)')
            if (ret && ret[1]) {
              const digObj = JSON.parse(ret[1])
              const {
                common
              } = digObj
              const timestamp = common.timestamp
              return {
                name: decodeURIComponent(spaceList[15]),
                timestamp
              }
            } else {
              return {
                name: decodeURIComponent(spaceList[15]),
                timestamp: Date.now()
              }
            }
          }).reverse()
        }
      }
    }
  }
</script>

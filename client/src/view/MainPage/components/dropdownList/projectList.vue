<!-- @format -->

<template>
  <div style="margin-right:10px" class="pg-main">
    <span>
      抽样比率:
      <span style="color:red">{{ rate }}%</span> </span
    >&nbsp;&nbsp;
    <Dropdown trigger="click">
      <a href="javascript:void(0)">
        {{ projectName }}
        <Icon type="ios-arrow-down"></Icon>
      </a>
      <DropdownMenu slot="list">
        <DropdownItem>
          <Table
            stripe
            size="small"
            :columns="columns"
            :data="projectList"
            width="350"
            height="338"
            :show-header="false"
            @on-row-click="handleRowClick"
          ></Table>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  </div>
</template>

<script>
  // import { getProjectList } from 'src/api/project'
  import _ from 'lodash'
  import { mapActions } from 'vuex'
  import { getProjectId } from 'src/libs/util'

  let columns = [
    {
      title: '项目名',
      key: 'display_name',
      align: 'center'
    },
    {
      title: '备注',
      key: 'c_desc',
      align: 'center',
      tooltip: false
    }
  ]
  export default {
    name: 'dropdownList',
    data() {
      return {
        projectName: '',
        projectList: [],
        projectMap: {},
        columns,
        rate: 100
      }
    },
    mounted() {
      this.getProList()
    },
    methods: {
      ...mapActions(['getProjectList']),
      handleRowClick(row, index) {
        const { id } = row
        this.changeMenu(id)
      },
      async getProList() {
        const res = await this.getProjectList()
        this.projectList = res.data
        let map = {}

        this.projectList.map((element) => {
          if (!this.projectMap[element.id]) {
            this.projectMap[element.id] = element
          }
        })
        this.projectName = _.get(this.projectMap, [getProjectId(), 'display_name'], '^_^')
        this.rate = (_.get(this.projectMap, [getProjectId(), 'rate'], 10000) / 10000) * 100

        if (_.get(this.projectMap, [getProjectId(), 'role'], '') === 'owner') {
          this.$store.commit('setAccess', ['owner'])
        } else {
          this.$store.commit('setAccess', ['dev'])
        }
        this.$common.projectInfoList = this.$store.state.app.projectList
      },
      // 修改路由
      changeMenu(id) {
        // 更新对外显示的数据: 项目名/抽样比例
        this.projectName = _.get(this.projectMap, [id, 'display_name'], '^_^')
        this.rate = (_.get(this.projectMap, [id, 'rate'], 10000) / 10000) * 100

        if (this.projectMap[id].role === 'owner') {
          this.$store.commit('setAccess', ['owner'])
        } else {
          this.$store.commit('setAccess', ['dev'])
        }
        // 跳转到url更新后的新页面
        let pathItemList = window.location.pathname.split('/')
        pathItemList[2] = id
        let newUrl = pathItemList.join('/')
        // location.href = newUrl
        this.$router.push({
          path: newUrl
        })

        // 强制刷新界面
        this.$bus.$emit('render', false)
        this.$nextTick(() => {
          this.$bus.$emit('render', true)
        })
      }
    }
  }
</script>

<style lang="less">
  .pg-main {
    .ivu-select-dropdown .ivu-table-body {
      overflow-x: hidden !important;
      table {
        width: 350px !important;
      }
    }
  }
</style>

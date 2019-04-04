<template>
  <div style='margin-right:10px'>
    <span>抽样比率: <span style="color:red">{{rate}}%</span></span>&nbsp;&nbsp;
    <Dropdown
      trigger="click"
    >
      <a href="javascript:void(0)">
        {{projectName}}
        <Icon type="ios-arrow-down"></Icon>
      </a>
      <DropdownMenu
        slot="list"
      >
        <DropdownItem>
          <Table :columns="columns" :data="projectList" width="350" height="338" :show-header="false" @on-row-click="handleRowClick"></Table>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  </div>
</template>

<script>
  import { getProjectList } from '@/api/project'
  import { getProjectId } from '@/libs/util'
  import _ from 'lodash'

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
      tooltip: true
    }
  ]
  export default {
    name: 'dropdownList',
    data () {
      return {
        projectName: '',
        projectList: [],
        projectMap: {},
        columns,
        rate: 100
      }
    },
    mounted () {
      this.getProjectList()
    },
    methods: {
      handleRowClick(row, index){
        const { id } = row
        this.changeMenu(id)
      },
      async getProjectList () {
        const res = await getProjectList()
        this.projectList = res.data
        this.projectList.map(element => {
          if (!this.projectMap[element.id]) {
            this.projectMap[element.id] = element
          }
        })
        this.projectName = _.get(this.projectMap, [getProjectId(), 'display_name'], '^_^')
        this.rate = _.get(this.projectMap, [getProjectId(), 'rate'], 10000) / 10000 * 100
      },
      changeMenu (id) {
        this.projectName = _.get(this.projectMap, [id, 'display_name'], '^_^')
        this.rate = _.get(this.projectMap, [id, 'rate'], 10000) / 10000 * 100
        if (this.projectMap[id].role === 'owner') { this.$store.commit('setAccess', ['owner']) } else {
          this.$store.commit('setAccess', ['dev'])
        }
        this.$router.push(
          {
            name: 'home',
            params: {
              id
            }
          }
        )
        this.$bus.$emit('render', false)
        this.$nextTick(() => {
          this.$bus.$emit('render', true)
        })
      }
    }
  }
</script>

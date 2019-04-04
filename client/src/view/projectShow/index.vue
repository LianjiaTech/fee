<template>
  <div>
    <div v-if="projectList.length!=0" class='tab_list' v-for="(item, index) in projectList" :key="index">
      <div class='tab_item' @click='changeMenu(item.id)'>
        <h6>{{item.id}} {{item.display_name}}</h6>
      </div>
    </div>
    <div v-if="projectList.length==0" class='tab_Unshow'>
      <div class='tab_word'>抱歉，您目前没有权限浏览项目，您可以联系上级协助完成</div>
    </div>
  </div>
</template>

<script>
  import { getProjectList } from '@/api/project'

  export default {
    name: 'projectList',
    data () {
      return {
        projectList: []
      }
    },
    mounted () {
      this.getProjectList()
    },
    methods: {
      async getProjectList () {
        const res = await getProjectList()
        this.projectList = res.data
      },
      changeMenu (id) {
        this.$router.push({
          name: 'home',
          params: {
            id: id
          }
        })
        // this.$store.commit('setAccess', ['admin'])
      }
    }
  }
</script>

<style lang='less'>
  .tab_list {
    display: inline-flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .tab_item {
    background: rgba(9, 45, 66, .08);
    color: #6b808c;
    width: 200px;
    height: 200px;
    font-weight: 400;
    text-align: center;
    font-size: 28px;
    line-height: 200px;
    margin-left: 20px;
    margin-top: 20px;
  }

  .tab_Unshow {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .tab_word {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
    text-align: center;
    line-height: 500px;
    font-weight: 400;
    font-size: 28px;
  }
</style>

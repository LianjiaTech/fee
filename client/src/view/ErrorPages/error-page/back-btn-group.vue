<!-- @format -->

<template>
  <div>
    <Button size="large" type="text" @click="backHome">返回首页</Button>
    <Button size="large" type="text" @click="backPrev">返回上一页</Button>
  </div>
</template>

<script>
  import './error.less'

  export default {
    name: 'backBtnGroup',
    data() {
      return {}
    },
    methods: {
      backHome() {
        const project = _.get(this.$store, ['state', 'app', 'projectList', 0], {})
        this.$router.replace({
          name: 'home',
          params: {
            id: _.get(project, ['id'], 3)
          }
        })
      },
      backPrev() {
        this.$router.go(-1)
      }
    }
  }
</script>

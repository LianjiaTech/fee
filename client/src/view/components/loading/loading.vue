<template>
  <div v-if="isSpinShow" style="z-index:1000;">
    <spin fix>
      <icon type="ios-loading" size=18 class="demo-spin-icon-load"></icon>
      <div>Loading</div>
    </spin>
  </div>
</template>

<script>
  export default {
    name: 'loading',
    data () {
      return {
      }
    },
    props: {
      isSpinShow: Boolean
    },
    methods: {
  
    }
  }
</script>

<style lang="less" scoped>

</style>

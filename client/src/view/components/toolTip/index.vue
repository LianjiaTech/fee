<template>
  <Tooltip class="tooltip-44be87d3228dc57" :content="content" :style="{position: position}" placement="top"
           max-width='200'>
    <Icon :type="type"></Icon>
  </Tooltip>
</template>
<script>
  export default {
    name: 'toolTip',
    props: {
      'content': {},
      'type': {},
      'position': {
        type: String,
        default: 'relative'
      }
    }
  }
</script>
<style lang='less'>
  .tooltip-44be87d3228dc57 {
    .ivu-tooltip-content .ivu-tooltip-inner {
      width: 200px
    }
  }
</style>

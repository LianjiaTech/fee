<template>
  <div class="no-data-msg">
    <h5>{{title}}</h5>
    <p>{{desc}}</p>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: '没有查询到相关数据'
    },
    desc: {
      type: String,
      default: '请尝试调整筛选条件再查询'
    }
  }
}
</script>

<style>
  .no-data-msg{
    margin: 0 auto;
    width: 300px;
    min-height: 112px;
    border: 1px solid #C5C7E5;
    border-radius: 4px;
    padding: 26px 20px 20px 100px;
    background: url("~src/assets/images/no-data.png") 20px center no-repeat;
    background-color: #eff0f8;
  }
</style>
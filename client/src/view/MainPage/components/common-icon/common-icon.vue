<template>
  <!-- Vue提供了component，来展示对应名称的组件 -->
  <!-- component是一个占位符，:is 属性，可以用来指定要展示的组件名称 -->
  <component :is="iconType" :type="iconName" :color="iconColor" :size="iconSize"/>
</template>

<script>
  import Icons from '../icons/icons.vue'

  export default {
    name: 'CommonIcon',
    components: {Icons},
    props: {
      type: {
        type: String,
        required: true
      },
      color: String,
      size: Number
    },
    computed: {
      iconType () {
        return this.type.indexOf('_') === 0 ? 'Icons' : 'Icon'
      },
      iconName () {
        return this.iconType === 'Icons' ? this.getCustomIconName(this.type) : this.type
      },
      iconSize () {
        return this.size || (this.iconType === 'Icons' ? 12 : undefined)
      },
      iconColor () {
        return this.color || ''
      }
    },
    methods: {
      getCustomIconName (iconName) {
        return iconName.slice(1)
      }
    }
  }
</script>

<style>
</style>

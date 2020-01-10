<template>
  <div class="custom-bread-crumb">
    <Breadcrumb :style="{fontSize: `${fontSize}px`}">
      <BreadcrumbItem
        v-for="(item, index) in list"
        :to="{path:`/project/${getProjectId()}/home`}"
        :key="`bread-crumb-${item.name}_${index}`"
      >
        <common-icon style="margin-right: 4px;" :type="item.icon || ''"/>
        {{ showTitle(item) }}
      </BreadcrumbItem>
    </Breadcrumb>
  </div>
</template>
<script>
  import { getProjectId } from 'src/libs/util'
  import CommonIcon from '../../common-icon/common-icon.vue'
  import './custom-bread-crumb.less'

  export default {
    name: 'customBreadCrumb',
    components: {
      CommonIcon
    },
    props: {
      list: {
        type: Array,
        default: () => []
      },
      fontSize: {
        type: Number,
        default: 14
      },
      showIcon: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      showTitle (item) {
        return this.$config.useI18n ? this.$t(item.name) : ((item.meta && item.meta.title) || item.name)
      },
      isCustomIcon (iconName) {
        return iconName.indexOf('_') === 0
      },
      getCustomIconName (iconName) {
        return iconName.slice(1)
      },
      getProjectId
    }
  }
</script>

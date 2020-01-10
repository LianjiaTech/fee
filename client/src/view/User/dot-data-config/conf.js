export const columns1 = ctx => [
  {
    title: '事件名',
    key: 'event_name',
    width: 150,
    render: (h, params) => {
      return h('div', [
        h('Icon', {
          props: {
            type: 'person'
          }
        }),
        h('strong', params.row.event_name)
      ]);
    }
  },
  {
    title: '显示名',
    key: 'event_display_name',
    width: 150,
  },
  {
    title: '标签',
    key: 'event_tag_name',
    slot: 'event_tag_name',
  },
  {
    title: '创建人',
    key: 'cname',
    width: 100
  },
  {
    title: '更新人',
    key: 'uname',
    width: 100
  },
  {
    title: '更新时间',
    key: 'utime',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    slot: 'action',
    width: 200
  }
]


export const columns2 = ctx => { 
  let cols = [
    {
      title: '属性名',
      key: 'props_name',
      slot: 'props_name'
      
    }, {
      title: '显示名',
      key: 'props_display_name',
      slot: 'props_display_name'
    }, {
      title: '数据类型',
      key: 'props_data_type',
      slot: 'props_data_type'
    }
  ]
  if (!ctx.isEdit) { 
    cols.push({
      title: '可见性',
      key: 'action',
      width: 80,
      align: 'center',
      slot: 'action'
    })
  }
  return cols
}

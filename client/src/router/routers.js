import Main from 'src/view/MainPage'

/**
 * iview-admin中meta除了原生参数外可配置的参数:
 * meta: {
 *  noLoginRequired：(false) 是否需要登录之后才可以访问
 *  hideInMenu: (false) 设为true后在左侧菜单不会显示该页面选项
 *  notCache: (false) 设为true后页面不会缓存
 *  access: (null) 可访问该页面的权限数组，当前路由设置的权限会影响子路由
 *  icon: (-) 该页面在左侧菜单、面包屑和标签导航处显示的图标，如果是自定义图标，需要在图标名称前加下划线'_'
 * }
 */
export default [
  {
    path: '/login',
    name: 'login',
    meta: {
      title: 'Login - 登录',
      hideInMenu: true,
      noLoginRequired: true
    },
    component: () => import('src/view/login/login.vue')
  },
  {
    path: '/',
    redirect: `/project/1/home`,
    name: 'base',
    meta: {
      hideInMenu: true,
      notCache: true
    }
  },
  {
    path: '/project/:id',
    redirect: `/project/:id/home`,
    meta: {
      hideInMenu: true,
      notCache: true
    },
    component: Main,
    children: [
      {
        path: `/project/:id/home`,
        name: 'home',
        meta: {
          title: '首页',
          notCache: true
        },
        component: () => import('src/view/Monitor/error-dashboard/index.vue')
      }
    ]
  },
  {
    path: '/project/:id/behavior',
    name: 'behavior',
    component: Main,
    meta: {
      icon: 'md-hand',
      title: '用户行为'
    },
    children: [
      {
        path: 'menu-count',
        name: 'menu-count',
        meta: {
          icon: 'md-radio-button-on',
          title: '菜单点击量'
        },
        component: () => import('src/view/User/menu-count/menu-count.vue')
      },
      {
        path: 'device-detail',
        name: 'device-detail',
        meta: {
          icon: 'md-desktop',
          title: '设备信息'
        },
        component: () => import('src/view/User/device-detail/index.vue')
      },
      {
        path: 'dot-config',
        name: 'dot-config',
        meta: {
          icon: 'ios-settings',
          title: '打点配置'
        },
        component: () => import('src/view/User/dot-data-config/index.vue')
      },
      {
        path: 'dot-data',
        name: 'dot-data',
        meta: {
          icon: 'md-eye',
          title: '打点事件分析'
        },
        component: () => import('src/view/User/dot-data-view/index.vue')
      }
    ]
  },
  {
    path: '/project/:id/monitor',
    name: 'monitor',
    component: Main,
    meta: {
      icon: 'md-warning',
      title: '异常监控'
    },
    children: [
      {
        path: 'performance',
        name: '页面性能',
        meta: {
          icon: 'md-speedometer',
          title: '页面性能'
        },
        component: () => import('src/view/Monitor/performance')
      },
      {
        path: 'error-dashboard',
        name: 'error-dashboard',
        meta: {
          icon: 'md-help-buoy',
          title: '错误看板'
        },
        component: () => import('src/view/Monitor/error-dashboard')
      }
    ]
  },
  {
    path: '/project/:id/alarm',
    name: '报警',
    component: Main,
    meta: {
      icon: 'md-alert'
    },
    children: [
      {
        path: 'alarm-config',
        name: 'Alarm',
        meta: {
          icon: 'ios-settings',
          title: '配置'
        },
        component: () => import('src/view/Alarm/alarm-config/index.vue')
      },
      {
        path: 'alarm-log',
        name: 'alarm_log',
        meta: {
          icon: 'md-clock',
          title: '日志'
        },
        component: () => import('src/view/Alarm/alarm-log/index.vue')
      }
    ]
  },
  {
    path: '/project/:id/ratio',
    name: '环比数据',
    component: Main,
    meta: {
      icon: 'md-refresh'
    },
    children: [
      {
        path: 'error-num',
        name: 'error_',
        meta: {
          icon: 'md-clock',
          title: '错误数量环比'
        },
        component: () => import('src/view/Data/ratio-error-num/index.vue')
      },
      {
        path: 'error-percent',
        name: 'error_percent',
        meta: {
          icon: 'md-clock',
          title: '错误占比环比'
        },
        component: () => import('src/view/Data/ratio-error-percent/index.vue')
      },
      {
        path: 'error-rank',
        name: 'error_rank',
        meta: {
          icon: 'md-clock',
          title: '错误排行环比'
        },
        component: () => import('src/view/Data/ratio-error-rank/index.vue')
      },
      {
        path: 'perf-avg',
        name: 'ratio-perf',
        meta: {
          icon: 'md-clock',
          title: '性能环比'
        },
        component: () => import('src/view/Data/ratio-perf-avg/index.vue')
      }
    ]
  },
  {
    path: '/project/:id/manage',
    name: '管理',
    component: Main,
    meta: {
      icon: 'md-clock',
      title: '管理'
    },
    children: [
      {
        path: 'user-management',
        name: '成员管理',
        meta: {
          access: ['owner'],
          icon: 'md-people',
          title: '成员管理'
        },
        component: () => import('src/view/Management/management/index.vue')
      },
      {
        path: 'project-management',
        name: '项目管理',
        meta: {
          access: ['owner'],
          icon: 'md-people',
          title: '项目管理'
        },
        component: () => import('src/view/Management/project-info/index.vue')
      },
      {
        path: 'join-apply',
        name: '申请页面',
        meta: {
          icon: 'md-people',
          title: '申请接入灯塔'
        },
        component: () => import('src/view/Management/join-apply/index.vue')
      },
      {
        path: 'join-review',
        name: '审核页面',
        meta: {
          roles: ['admin'],
          icon: 'md-people',
          title: '接入审批'
        },
        component: () => import('src/view/Management/join-review/index.vue')
      },
      {
        path: 'daily-report',
        name: '日报订阅配置',
        meta: {
          icon: 'md-people',
          title: '日报订阅'
        },
        component: () => import('src/view/Management/daily-report/index.vue')
      }
    ]
  },
  {
    path: '/project/:id/dashboard',
    name: '数据',
    component: Main,
    meta: {
      icon: 'ios-trending-up',
      title: '数据'
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        meta: {
          icon: 'md-laptop',
          title: '数据一览'
        },
        component: () => import('src/view/Data/dashboard/index.vue')
      }
    ]
  },
  {
    path: '/error/detail',
    name: '错误详情页',
    meta: {
      hideInMenu: true,
      noLoginRequired: true
    },
    component: () => import('src/view/Alarm/alarm-detail/index.vue')
  },
  {
    path: '/401',
    name: 'error_401',
    meta: {
      hideInMenu: true
    },
    component: () => import('src/view/ErrorPages/error-page/401.vue')
  },
  {
    path: '/500',
    name: 'error_500',
    meta: {
      hideInMenu: true
    },
    component: () => import('src/view/ErrorPages/error-page/500.vue')
  },
  {
    path: '*',
    name: 'error_404',
    meta: {
      hideInMenu: true
    },
    component: () => import('src/view/ErrorPages/error-page/404.vue')
  }
]

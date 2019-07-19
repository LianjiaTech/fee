import Main from '@/view/main'
import Login from '@/view/login/login.vue'
import ErrorDashboard from '@/view/error-dashboard/index.vue'
import ErrorPage404 from '@/view/error-page/404.vue'
import MenuCount from '@/view/menu-count/menu-count.vue'
import OnlineTime from '@/view/online-time/online-time.vue'
import NewUsers from '@/view/new-users'
import ViewPerformance from '@/view/performance'
import AlarmConfig from '@/view/alarm-config/index.vue'
import AlarmLog from '@/view/alarm-log/index.vue'
import Management from '@/view/management/index.vue'
import ErrorPage401 from '@/view/error-page/401.vue'
import ErrorPage500 from '@/view/error-page/500.vue'
/**
 * iview-admin中meta除了原生参数外可配置的参数:
 * meta: {
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
    },
    component: Login,
  },
  {
    path: '/',
    redirect: `/project/1/home`,
    name: 'base',
    meta: {
      hideInMenu: true,
      notCache: true,
    },
  },
  {
    path: '/project/:id',
    redirect: `/project/:id/home`,
    name: 'home',
    meta: {
      hideInMenu: true,
      notCache: true,
    },
    component: Main,
    children: [
      {
        path: `/project/:id/home`,
        name: 'home',
        meta: {
          hideInMenu: true,
          title: '首页',
          notCache: true,
        },
        component: ErrorDashboard,
      },
    ],
  },
  {
    path: '/project/:id/behavior',
    name: 'behavior',
    component: Main,
    meta: {
      icon: 'md-hand',
      title: '用户行为',
      // access:["admin"]
    },
    children: [
      {
        path: 'menu-count',
        name: 'menu-count',
        meta: {
          icon: 'md-radio-button-on',
          title: '菜单点击量',
        },
        component: MenuCount,
      },
      {
        path: 'online-time',
        name: 'online-time',
        meta: {
          icon: 'md-time',
          title: '用户在线时长',
        },
        component: OnlineTime,
      },
      {
        path: 'new-users',
        name: 'new-users',
        meta: {
          icon: 'md-person-add',
          title: '新增用户数据',
        },
        component: NewUsers,
      },
    ],
  },
  {
    path: '/project/:id/monitor',
    name: 'monitor',
    component: Main,
    meta: {
      icon: 'md-warning',
      title: '异常监控',
      // access:["admin"]
    },
    children: [
      {
        path: 'performance',
        name: '页面性能',
        meta: {
          icon: 'md-speedometer',
          title: '页面性能',
        },
        component: ViewPerformance,
      },
      {
        path: 'error-dashboard',
        name: 'error-dashboard',
        meta: {
          icon: 'md-help-buoy',
          title: '错误看板',
        },
        component: ErrorDashboard,
      },
    ],
  },
  {
    path: '/project/:id/alarm',
    name: '报警',
    component: Main,
    meta: {
      icon: 'md-alert',
    },
    children: [
      {
        path: 'alarm-config',
        name: 'Alarm',
        meta: {
          icon: 'ios-settings',
          title: '配置',
        },
        component: AlarmConfig,
      },
      {
        path: 'alarm-log',
        name: 'alarm_log',
        meta: {
          icon: 'md-clock',
          title: '日志',
        },
        component: AlarmLog,
      },
    ],
  },
  {
    path: '/project/:id/userManage',
    name: '用户',
    component: Main,
    meta: {
      access: ['owner'],
    },
    children: [
      {
        path: 'management',
        name: 'Management',
        meta: {
          icon: 'md-people',
          title: '成员管理',
        },
        component: Management,
      },
    ],
  },
  {
    path: '/401',
    name: 'error_401',
    meta: {
      hideInMenu: true,
    },
    component: ErrorPage401,
  },
  {
    path: '/500',
    name: 'error_500',
    meta: {
      hideInMenu: true,
    },
    component: ErrorPage500,
  },
  {
    path: '*',
    name: 'error_404',
    meta: {
      hideInMenu: true,
    },
    component: ErrorPage404,
  },
]

import Behavior from '~/src/routes/api/behavior'
import ErrorReport from '~/src/routes/api/error'
import Log from '~/src/routes/api/log'
import Alarm from '~/src/routes/api/alarm'
import User from '~/src/routes/api/user'
import Login from '~/src/routes/api/login'
import Project from '~/src/routes/api/project'
import Extra from '~/src/routes/api/extra'
import Ratio from '~/src/routes/api/ratio'
import Dot from '~/src/routes/api/dot'
import Dashboard from '~/src/routes/api/dashboard'

// Performance 本身是内置对象名
import RPerformance from '~/src/routes/api/performance'
import Client from '~/src/routes/api/client'

export default {
  ...Behavior,
  ...ErrorReport,
  ...Log,
  ...Alarm,
  ...User,
  ...Login,
  ...Project,
  ...RPerformance,
  ...Client,
  ...Extra,
  ...Ratio,
  ...Dot,
  ...Dashboard
}

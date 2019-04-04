import Behavior from '~/src/routes/api/behavior'
import Os from '~/src/routes/api/os'
import Browser from '~/src/routes/api/browser'
import RuntimeVersion from '~/src/routes/api/runtimeVersion'
import ErrorReport from '~/src/routes/api/error'
import Log from '~/src/routes/api/log'
import Alarm from '~/src/routes/api/alarm'
import User from '~/src/routes/api/user'
import Login from '~/src/routes/api/login'
import Project from '~/src/routes/api/project'
import UV from '~/src/routes/api/uv'
// Performance 本身是内置对象名
import RPerformance from '~/src/routes/api/performance'

export default {
  ...Behavior,
  ...Os,
  ...Browser,
  ...RuntimeVersion,
  ...ErrorReport,
  ...Log,
  ...Alarm,
  ...User,
  ...Login,
  ...Project,
  ...RPerformance,
  ...UV
}

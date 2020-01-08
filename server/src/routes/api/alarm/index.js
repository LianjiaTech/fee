import Config from '~/src/routes/api/alarm/config'
import Log from '~/src/routes/api/alarm/log'
import Detail from '~/src/routes/api/alarm/detail'
export default {
  ...Config,
  ...Log,
  ...Detail
}

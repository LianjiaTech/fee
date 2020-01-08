import events from '~/src/routes/api/dot/config/events'
import props from '~/src/routes/api/dot/config/props'
import tags from '~/src/routes/api/dot/config/tags'
import data from '~/src/routes/api/dot/data/index'

export default { 
  ...events,
  ...props,
  ...tags,
  ...data
}
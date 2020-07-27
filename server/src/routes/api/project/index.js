import Item from '~/src/routes/api/project/item'
import Member from '~/src/routes/api/project/member'
import Summary from '~/src/routes/api/project/summary'
import Apply from '~/src/routes/api/project/apply'
import Daily from '~/src/routes/api/project/daily'
export default {
  ...Item,
  ...Member,
  ...Summary,
  ...Apply,
  ...Daily
}

import Item from '~/src/routes/api/project/item'
import Member from '~/src/routes/api/project/member'
import Summary from '~/src/routes/api/project/summary'
export default {
  ...Item,
  ...Member,
  ...Summary
}

import Base from '~/src/commands/base'
import Knex from '~/src/library/mysql'
import redis from '~/src/library/redis'
class CommandTest extends Base {
  static get signature () {
    return `
     Utils:Test 
     `
  }

  static get description () {
    return '专业粘贴调试代码'
  }

  async execute (args, options) {
    this.log('hello world')
  }
}

export default CommandTest

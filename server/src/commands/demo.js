import Base from '~/src/commands/base'
// import Util from '~/src/library/utils/modules/util'
class CommandDemo extends Base {
  static get signature () {
    return `
     Command:Demo 
     
     {user:[必传]用户名} 
     {name?:[可选]称谓} 
     
     {--onlyFlag:[必传]flag,只有true/false两个值} 
     {--logName=@value:[必传]日志文件名} 
     {--isTest?=@value:[可选]是否处于测试环境}
     `
  }

  static get description () {
    return '解析kafka日志, 分析pv'
  }

  async execute (args, options) {
    let { user, name } = args
    let { onlyFlag, logName, isTest } = options
    this.log('user =>', user)
    this.log(`CommandDemo, name=> ${name}`)
    this.log(`CommandDemo, onlyFlag=> ${onlyFlag}`)
    this.log(`CommandDemo, logName=> ${logName}`)
    this.log(`CommandDemo, isTest=> ${isTest}`)
    // let i = 0
    // while (1) {
    //   i++
    //   await sleep(1)
    //   this.log(`第${i}条日志`)
    // }
  }
}

export default CommandDemo

/**
 * @jest-environment jsdom
 */
 
import dt from '../../lib/index'

describe('dt instance init:', () => {
  // 测试覆盖模式
  it('init config: overwrite', () => {
    const conf = { a: 1 }
    dt.set(conf, true)
    const config = dt.config
    expect(config).toStrictEqual({ ...conf, uuid: "" })
  })
  // 测试自定义模式
  it('init config: deepMerge', () => {
    const testTag = 'b47ca710747e96f1c523ebab8022c19e9abaa56b'
    const conf = { 
      pid: 'test-pid',
      uuid: 'test-uuid',
      ucid: 'test-ucid',
      is_test: true,
      record: {
        time_on_page: false,
        performance: false,
        js_error: false,
        js_error_report_config: {
          ERROR_RUNTIME: false,
          ERROR_SCRIPT: false,
          ERROR_STYLE: false,
          ERROR_IMAGE: false,
          ERROR_AUDIO: false,
          ERROR_VIDEO: false,
          ERROR_CONSOLE: false,
          ERROR_TRY_CATCH: false,
          checkErrorNeedReport: (desc = '', stack = '') => `${desc}_test_${stack}`
        }
      },
      version: '1.0.0',
      getPageType: (location = window.location) => {
        return `${location.host}${location.pathname}`;
      }
     }
    dt.set(conf, true)
    const config = dt.config

    expect(config).toStrictEqual({ ...conf, test: testTag });
    expect(config.record.js_error_report_config.checkErrorNeedReport('desc, stack')).toBeTruthy()
    expect(config.getPageType({
      host: 'xxx.test.com',
      pathname: '/home'
    })).toBe('xxx.test.com/home')
  })
})



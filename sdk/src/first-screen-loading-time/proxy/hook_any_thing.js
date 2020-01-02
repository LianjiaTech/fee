/**
 * hooks any thing
 * @param ori
 * @param hooks :{
 *   key:function 或者是 { set:function  ，get:function }
 */
export default function hookAnyThing(ori, hooks) {
  for (let key in ori) {
    const hook = hooks[key]
    if (typeof ori[key] === 'function') {
      hookFunction.call(this, key, ori, hook)
      continue
    }
    // 不是方法的话肯定就是普通的值了
    hookOther.call(this, key, ori, hook)
  }
  return this
}

/**
 * hook function
 * @param key
 * @param ori
 * @param hookFunc
 */
function hookFunction(key, ori, hookFunc) {
  this[key] = function(...args) {
    if (typeof hookFunc !== 'function') {
      return ori[key].apply(ori, args)
    }
    return hookFunc.call(this, args, args => ori[key].apply(ori, args))
  }
}

/**
 * hook 非特殊值得
 * @param key
 * @param ori
 * @param hookFunc
 */
function hookOther(key, ori, hookFunc = {}) {
  const enumerable = ori.propertyIsEnumerable(key)
  let set, get
  if (typeof hookFunc === 'function') {
    set = function(val) {
      ori[key] = function(...args) {
        hookFunc.call(this, args, args => val.apply(this, args))
      }
    }
    get = function() {
      return ori[key]
    }
  } else {
    const { set: setFunc, get: getFunc } = hookFunc

    set = function(val) {
      if (setFunc) {
        setFunc.call(this, val, val => (ori[key] = val))
      } else {
        ori[key] = val
      }
    }
    get = function() {
      if (getFunc) {
        return getFunc.call(this, () => ori[key])
      } else {
        return ori[key]
      }
    }
  }

  Object.defineProperty(this, key, {
    enumerable,
    set,
    get
  })
}

"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = initRenderingTime;

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/es6.object.to-string");

require("core-js/modules/es6.regexp.replace");

require("core-js/modules/es6.array.sort");

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _now = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/date/now"));

var _proxy = _interopRequireDefault(require("./proxy"));

/**
 * 构建监听
 * @param reportCallback
 */
function initRenderingTime(reportCallback) {
  var initDoms = []; // 被加载得doms

  var delayNum = 0; // 等待加载得时间

  var effective = true; // 操作记录是否有效

  var lastDomChangeTime = (0, _now.default)();

  var mutationCallback = function mutationCallback(mutationsList) {
    var now = (0, _now.default)();
    lastDomChangeTime = now;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = (0, _getIterator2.default)(mutationsList), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var mutation = _step.value;
        var addedNodes = mutation.addedNodes;

        for (var i = 0; i < addedNodes.length; i++) {
          var addNode = addedNodes[i];
          var domName = getClassName(addNode);

          if (/^HTML/.test(domName)) {
            (function () {
              // 再判断是否是图片
              var item = {
                dom: addNode,
                time: now,
                domName: domName
              };
              initDoms.push(item);

              if (/Image/.test(domName)) {
                // 如果是图片，就添加图片得
                delayNum++;
                addNode.addEventListener('load', function () {
                  delayNum--;
                  item.time = (0, _now.default)();
                }, false);
              }
            })();
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  };

  var config = {
    attributes: true,
    childList: true,
    subtree: true
  };
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  if (!MutationObserver) return;
  var observer = new MutationObserver(mutationCallback);
  observer.observe(document, config);
  checkLoadFinsh();
  /**
   * 检查加载是否完成
   */

  function checkLoadFinsh() {
    var now = (0, _now.default)();

    if (now > lastDomChangeTime + 300 && delayNum === 0 && effective) {
      // 没有元素在变化同时，没有操作
      // 这里就是所有得渲染都完成了，要开始计算首屏元素和时间了
      checkDomInfirstScreen(initDoms, reportCallback);
      observer.disconnect(); // 监听销毁
    } else if (effective) {
      setTimeout(checkLoadFinsh, 300);
    }
  } // 监听全局得click和键盘输入事件


  createEventListener(function () {
    return effective = false;
  }); // 控制请求数量

  (0, _proxy.default)(function () {
    return delayNum++;
  }, function () {
    return delayNum--;
  });
}
/**
 * 创建event监听
 * @param disAbleEffective
 */


function createEventListener(disAbleEffective) {
  window.addEventListener('click', function () {
    disAbleEffective();
  }, true);
  window.addEventListener('keydown', function () {
    disAbleEffective();
  }, true);
}
/**
 * 检查第一屏幕得元素
 * @param reportCallback
 */


function checkDomInfirstScreen(initDoms, reportCallback) {
  var requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
  requestAnimationFrame(function () {
    // 在这里先筛选出首屏得元素
    var height = document.documentElement.clientHeight;
    var width = document.documentElement.clientWidth; // 筛选出top和left在 width和height得元素

    var firstScreenDoms = initDoms.filter(function (item) {
      var dom = item.dom;

      var _getOffset = getOffset(dom),
          left = _getOffset.left,
          top = _getOffset.top;

      return left <= width && top <= height;
    }); // 找出最大得时间

    firstScreenDoms.sort(function (itemA, itemB) {
      return itemB.time - itemA.time;
    }); // const maxTime = firstScreenDoms.reduce((item, time = 0) => item.time > time ? item.time : time)

    var firstScreenLoadingTime = firstScreenDoms[0] ? firstScreenDoms[0].time : 0;
    reportCallback(firstScreenLoadingTime);
  });
}
/**
 * 获取元素得className
 * @param obj
 * @returns {string}
 */


function getClassName(obj) {
  return Object.prototype.toString.call(obj).replace(/^\S+\s+/, '').replace(/]$/, '');
} // 获取元素得offset

/**
 * 获取绝对定位得值
 * @param dom
 * @param left
 * @param top
 * @returns {*}
 */


function getOffset(dom) {
  var left = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var top = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (!dom) {
    return {
      left: left,
      top: top
    };
  }

  var _dom$offsetLeft = dom.offsetLeft,
      offsetLeft = _dom$offsetLeft === void 0 ? 0 : _dom$offsetLeft,
      _dom$offsetTop = dom.offsetTop,
      offsetTop = _dom$offsetTop === void 0 ? 0 : _dom$offsetTop;
  left += offsetLeft;
  top += offsetTop;
  return getOffset(dom.parentNode, left, top);
}
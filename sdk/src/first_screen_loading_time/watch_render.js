import proxyRequest from './proxy';

/**
 * 构建监听
 * @param reportCallback
 */
export default function initRenderingTime(reportCallback) {
  const initDoms = []; // 被加载得doms
  let delayNum = 0; // 等待加载得时间
  let effective = true; // 操作记录是否有效
  let lastDomChangeTime = Date.now();
  const mutationCallback = mutationsList => {
    const now = Date.now();
    lastDomChangeTime = now;
    for (let mutation of mutationsList) {
      const { addedNodes } = mutation;
      for (let i = 0; i < addedNodes.length; i++) {
        const addNode = addedNodes[i];
        const domName = getClassName(addNode);
        if (/^HTML/.test(domName)) {
          // 再判断是否是图片
          const item = {
            dom: addNode,
            time: now,
            domName
          };
          initDoms.push(item);
          if (/Image/.test(domName)) {
            // 如果是图片，就添加图片得
            delayNum++;
            addNode.addEventListener(
              'load',
              function() {
                delayNum--;
                item.time = Date.now();
              },
              false
            );
          }
        }
      }
    }
  };
  let config = {
    attributes: true,
    childList: true,
    subtree: true
  };
  let MutationObserver =
    window.MutationObserver || window.WebKitMutationObserver;
  if (!MutationObserver) return;
  let observer = new MutationObserver(mutationCallback);
  observer.observe(document, config);
  checkLoadFinsh();
  /**
   * 检查加载是否完成
   */
  function checkLoadFinsh() {
    const now = Date.now();
    if (now > lastDomChangeTime + 300 && delayNum === 0 && effective) {
      // 没有元素在变化同时，没有操作
      // 这里就是所有得渲染都完成了，要开始计算首屏元素和时间了
      checkDomInfirstScreen(initDoms, reportCallback);
      observer.disconnect(); // 监听销毁
    } else if (effective) {
      setTimeout(checkLoadFinsh, 300);
    }
  }
  // 监听全局得click和键盘输入事件
  createEventListener(() => (effective = false));
  // 控制请求数量
  proxyRequest(
    () => delayNum++,
    () => delayNum--
  );
}

/**
 * 创建event监听
 * @param disAbleEffective
 */
function createEventListener(disAbleEffective) {
  window.addEventListener(
    'click',
    function() {
      disAbleEffective();
    },
    true
  );
  window.addEventListener(
    'keydown',
    function() {
      disAbleEffective();
    },
    true
  );
}

/**
 * 检查第一屏幕得元素
 * @param reportCallback
 */
function checkDomInfirstScreen(initDoms, reportCallback) {
  const requestAnimationFrame =
    window.requestAnimationFrame || window.setTimeout;
  requestAnimationFrame(function() {
    // 在这里先筛选出首屏得元素
    const height = document.documentElement.clientHeight;
    const width = document.documentElement.clientWidth;
    // 筛选出top和left在 width和height得元素
    const firstScreenDoms = initDoms.filter(item => {
      const { dom } = item;
      const { left, top } = getOffset(dom);
      return left <= width && top <= height;
    });
    // 找出最大得时间
    firstScreenDoms.sort((itemA, itemB) => itemB.time - itemA.time);
    // const maxTime = firstScreenDoms.reduce((item, time = 0) => item.time > time ? item.time : time)
    const firstScreenLoadingTime = firstScreenDoms[0]
      ? firstScreenDoms[0].time
      : 0;
    reportCallback(firstScreenLoadingTime);
  });
}

/**
 * 获取元素得className
 * @param obj
 * @returns {string}
 */
function getClassName(obj) {
  return Object.prototype.toString
    .call(obj)
    .replace(/^\S+\s+/, '')
    .replace(/]$/, '');
}

// 获取元素得offset
/**
 * 获取绝对定位得值
 * @param dom
 * @param left
 * @param top
 * @returns {*}
 */
function getOffset(dom, left = 0, top = 0) {
  if (!dom) {
    return { left, top };
  }
  const { offsetLeft = 0, offsetTop = 0 } = dom;
  left += offsetLeft;
  top += offsetTop;
  return getOffset(dom.parentNode, left, top);
}

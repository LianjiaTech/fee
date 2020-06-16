/**
 * 生成错误和pv柱状图
 */
export default function (data, title, infoText) {
  let maxValue = 0
  for (const item of data) {
    if (item.value > maxValue) {
      maxValue = item.value
    }
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,height=device-height">
    <title>基础柱状图</title>
</head>
<body>
<style>
    p{text-align: center;}
</style>
<div id="mountNode"></div>
<script>/*Fixing iframe window.innerHeight 0 issue in Safari*/document.body.clientHeight;</script>
<script src="https://gw.alipayobjects.com/os/antv/pkg/_antv.g2-3.4.1/dist/g2.min.js"></script>
<script src="https://gw.alipayobjects.com/os/antv/pkg/_antv.data-set-0.10.1/dist/data-set.min.js"></script>
<script>
  var data = [${data.map(item => JSON.stringify(item)).join(',')}]
  var sortType = 'negative';
  const chart = new G2.Chart({
    container: 'mountNode',
    forceFit: true,
    height: 300,
    padding: [ 0, 100, 0, 100 ]
  });
  chart.source(data);
  chart.axis('label', {
    label: {
      offset: 10
    }
  });
  chart.legend({
    position: 'right-bottom'
  });
  chart.coord().transpose().scale(1, -1);
  chart.interval().position('label*value')
    .color('type')
    .label('value')
    .adjust([{
      type: 'dodge',
      marginRatio: 1 / 10
    }]);
  chart.point().position('0*0').color('#ff7f0e').shape('triangle-down').label('${title}')
  chart.render();
  function sortData(sortType) {
    if (sortType === 'positive') {
      data.sort(function(a, b) {
        return b.value - a.value;
      });
    } else {
      data.sort(function(a, b) {
        return a.value - b.value;
      });
    }
  }
  function formatNumber (number) {
    number = number.toString()
    var numbers = number.split('.')
    var integer = numbers[0]
    var finalNumber = ''
    var integerLength = integer.length - 1
    for (var i = integer.length - 1; i >= 0; i--) {
      if (integerLength - i > 0 && (integerLength - i) % 3 == 0) {
        finalNumber = ',' + finalNumber
      }
      finalNumber = integer[i] + finalNumber
    }
    if (numbers[1]) {
      finalNumber = finalNumber+'.'+numbers[1]
    }
    return finalNumber
  }
</script>
</body>
</html>
  `
}

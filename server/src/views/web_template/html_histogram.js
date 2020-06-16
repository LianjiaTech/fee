/**
 * 生成柱状图
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
<p>${title}</p>
<div id="mountNode"></div>
<script>/*Fixing iframe window.innerHeight 0 issue in Safari*/document.body.clientHeight;</script>
<script src="https://gw.alipayobjects.com/os/antv/pkg/_antv.g2-3.4.1/dist/g2.min.js"></script>
<script src="https://gw.alipayobjects.com/os/antv/pkg/_antv.data-set-0.10.1/dist/data-set.min.js"></script>
<script>
  var data = [${data.map(item => JSON.stringify(item)).join(',')} ]
  var sortType = 'negative';
  sortData(sortType)
  var chart = new G2.Chart({
    container: 'mountNode',
    forceFit: true,
    height: window.innerHeight,
    padding: [20, 150, 50, 150]
  });
  chart.source(data, {
    value: {
      max: ${maxValue},
      min: 0,
      nice: false,
      alias: '${infoText}'
    }
  });
  chart.axis('projectName', {
    label: {
      textStyle: {
        fill: '#8d8d8d',
        fontSize: 12
      }
    },
    tickLine: {
      alignWithLabel: false,
      length: 0
    },
    line: {
      lineWidth: 0
    }
  });
  chart.axis('value', {
    label: null,
    title: {
      offset: 30,
      textStyle: {
        fontSize: 12,
        fontWeight: 300
      }
    }
  });
  chart.legend(false);
  chart.coord().transpose();
  chart.interval().position('projectName*value').size(26).opacity(1).label('value', {
    textStyle: {
      fill: '#313131'
    },
    offset: 10
  });
  chart.render();
  // $('.sort-button').click(function() {
  //   sortType = sortType === 'positive' ? 'negative' : 'positive';
  //   sortData(sortType);
  //   chart.repaint();
  // });

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
</script>
</body>
</html>
  `
}

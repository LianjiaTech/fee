export default function (projectName, pid, mail, rate, adminName, note) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<h3>"${projectName}"已经接入灯塔。</h3>
<p>项目信息:</p>
<h5>&nbsp;项目名称：${projectName}</h5>
<h5>&nbsp;pid：${pid}</h5>
<h5>&nbsp;负责人邮箱：${mail}</h5>
<h5>&nbsp;抽样比率：${(parseInt(rate) / 100).toFixed(2)}%</h5>
<h5>&nbsp;审批人：${adminName}</h5>
${note ? `<div>备注：${note}</div>` : ''}
<br/>
<br/>
<a href="http://arms.fee.lianjia.com">前往灯塔查看项目</a>
</body>
</html>
`
}
import appConfig from '~/src/configs/app'
import getTableStyle from '~/src/views/web_template/html_head_style'
/**
 * 接入灯塔邮件模板
 * @export
 * @param {*} { id, projectName, pid, mail, homePage, adminName, pv, rate, note }
 * @param {*} status 审核状态(0 pending 待审核，1 pass 通过 2 refused 拒绝)
 * @returns
 */
export default function ({ id, projectName, pid, mail, homePage, adminName, pv, rate, note }, status = 'pending') {
  let curState = {
    'pending': {
      title: '<h2 style="margin: 20px 0;">接入审批</h2>',
      thead: `${projectName} - 申请接入灯塔`,
      link: `${appConfig.host}/admin/join-review`,
      linkTxt: '点击☞进行审批'
    },
    'pass': {
      title: '<h2 style="margin: 20px 0; color: green;">😊已通过</h2>',
      thead: `${projectName} - 申请已通过`,
      link: `${appConfig.host}/project/${id}/home`,
      linkTxt: '点击☞查看项目'
    },
    'refused': {
      title: '<h2 style="margin: 20px 0; color: red;">🙁已驳回</h2>',
      thead: `${projectName} - 申请被驳回`
    }
  }[status]
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
  ${getTableStyle()}
  <style type="text/css">
    table {
      width: 400px;
    }
    div.footer {
      margin-top: 40px;
      border-top: 2px dashed #ddd;
      padding: 10px;
    }
    .foot-text {
      font-size: 12px;
      line-height: 2;
      color: #aaa;
      margin-left: 60px;
    }
  </style>
</head>
<body>
${curState.title}
<table>
  <tbody>
    <tr>
      <th colspan="2">${curState.thead}</th>
    </tr>
    <tr>
      <td>项目名称：</td>
      <td>${projectName}</td>
    </tr>
    <tr>
      <td>项目id：</td>
      <td>${pid}</td>
    </tr>
    <tr>
      <td>负责人邮箱：</td>
      <td>${mail}</td>
    </tr>
    ${
  adminName ? `<tr>
      <td>审批人：</td>
      <td>${adminName}</td>
    </tr>` : ''
}
    ${
  homePage ? `<tr>
      <td>项目首页：</td>
      <td>${homePage}</td>
    </tr>` : ''
}
    ${
  pv ? `<tr>
      <td>项目日均PV：</td>
      <td>${pv}/天</td>
    </tr>` : ''
}
    <tr>
      <td>抽样比率：</td>
      <td>${(parseInt(rate) / 100).toFixed(2)}%</td>
    </tr>
    ${note ? `<tr>
      <td>备注：</td>
      <td>${note}</td>
    </tr>` : ''
}
    ${
  curState.link ? `<tr>
    <td colspan="2" style="text-align: center;"><a href="${curState.link}">${curState.linkTxt}</a></td>
  </tr>` : ''
}
  </tbody>
</table>
<div class="footer">
  <div>
    <img style="width: 50px; float: left;" src="data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAABbCAYAAAAcNvmZAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAnhJREFUeNrs3U9LFGEcwPGf7ebaYWGhCBLCPQaRbNFd9w2YHrwF5dGTBtG1vIpit45l9AJ8BbmetQi6qCdB2EMprH/AXFzrN/qgo+2Ms+Mz0+P2/cLDoM4M8uHh2XkOy4gQEV2qjjgXPZiqDeqhT0dJR9GM/6GKjpqOBR1z318W1hLBVuCCHl7reK6jwDw9wZ9Q9Io1bIUeN9AgB6MPKXotNraZzTNmNlN4HnRZwb+1jG2g5826TBbAr4VcOAN0yx1NUJ2opcjYZo1m6YgP/j4Stu+pg+JXUsc3UWY2Tx12GjMTNxSb5cPecjIYiG12hsxqez0Lm9l9+FitPwybRz3L6WrRH4RdhCe5wP6H2AQ22AS2u2Wt3m3068XnbNwQmS8eH329KnfJk/udks91OAXUO711hWf2rT2RgdUzv/KQnz7KOQfdHstIriHSvevDvs6aTWCDTWCDDTa1Mfbm6aZm+WfDSZyVHw2HsT/3RDtv6Y7Ifubkx09f6lLdPnQKemf/t0xWfjm8XV+5KVLNi+TrwefUM39t1T3o4Y+7cu92puklA7rp8XaZUWejDaRlvY8H7i720ZToPB4xZtLi+kHTvz2+m7VyHz4g+YAksMEmsMEGm8AGm8AGm8AGG2wCG2wCG2ywCWywCWywCWywwSawwSawwQabwAabwAabwE637FX4J5fWD+RdxHOrW4dgXybv21+ufgOMZQRsAhvstmoN7JSg/W9pAjvZ5lhG0msW7HSqnH85ENjJ9YKnkZSgm73yCmz7fVDotzxnpwM9wqYmnaVjhB1kwk8dOh4GLR3+sljF3oJ7G5bZsJdtXoRdxrG1LTgR/RFgAEIioEX14WSDAAAAAElFTkSuQmCC" />  
  </div>
  <div class="foot-text">Send by 灯塔</div>
  <div class="foot-text">大前端基础架构部 infrastructure-fe@lianjia.com</div>
</div>
</body>
</html>
`
}

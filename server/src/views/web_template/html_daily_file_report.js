import getTableStyle from '~/src/views/web_template/html_head_style'

export default function ({
                           diskInfo, jsonSize, rawSize, projectSizeData, jsonCount, mailTitle, projectImage,
                         }) {
  //对 diskInfo进行拆分
  const diskInfoTable = diskInfo.split('\n').filter(line => line !== '').map(line => line.split(' ').filter(item => item !== '' && item !== ' '))
  // 显示log总数
  projectSizeData.sort((itemA, itemB) => itemB.jsonCount - itemA.jsonCount)
  const projectTable = projectSizeData.map(
    ({projectName, jsonCount}) => [projectName, jsonCount])
  projectTable.unshift(['项目名称', 'log数量'])
  return ` <!DOCTYPE html>
   <html lang="en">
   <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,height=device-height">
    <title>灯塔每日服务器状态日报</title>
     ${getTableStyle()}
   </head>
   <body>
    <div class="title">${mailTitle}</div>
    <div class="title_bar">
     <!--下载预留-->
    </div>
       
    <div class="content">
      <h4>磁盘使用情况</h4>
      ${generateTable(diskInfoTable)}
      <h4>log 占用磁盘空间</h4>
        <p>${jsonSize}</p>
        <p>${rawSize}</p>
      <h4>各个项目log数量,总数量${jsonCount}</h4>
      <img src="${projectImage}"  />
      ${generateTable(projectTable)}
    </div>
   </body>
   </html>`
}

function generateTable (tableList) {
  //取出第一行当表头
  const head = tableList.shift()
  return `
     <table>
        <tbody>
           <tr>${head.map(item => `<th>${item}</th>`).join('')} </tr>
           ${tableList.map(line =>
    `<tr>${line.map(item => `<td>${item}</td>`).join('')}</tr>`,
  ).join('')}
        </tbody>
    </table>`
}

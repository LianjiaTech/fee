import getTableStyle from '~/src/views/web_template/html_head_style'
export default function ({ mailTitle, errorTotalCountImg, table }) {
  let getImgsHtml = (errorTotalCountImg = []) => {
    let imgs = ''
    for (let imgSrc of errorTotalCountImg) {
      imgs += `<img src="${imgSrc}">`
    }
    return imgs
  }
  let imgsHtml = getImgsHtml(errorTotalCountImg)

  return `
   <!DOCTYPE html>
   <html lang="en">
   <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,height=device-height">
    <title>灯塔每日日报</title>
     ${getTableStyle({ tableRank: true })}
     <style type="text/css">
      body{
        background: #fff;
        -webkit-print-color-adjust: exact;
      }
      .img-wrap>img{
        display: block;
      }
      .fake-legend{
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px 0;
      }
      .fake-legend div{
        margin-right: 10px;
        font-size: 12px;
        color: #333;
      }
      .fake-legend span{
        line-height: 1;
        -webkit-print-color-adjust: exact;
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 5px;
      }
      div.footer{
        margin-top: 20px;
        border-top: 2px dashed #ddd;
        padding: 10px;
      }
      .foot-text{
        font-size: 12px;
        line-height: 2;
        color: #aaa;
        margin-left: 60px;
      }
     </style>
   </head>
   <body>
    <div class="title">${mailTitle}</div>
    <!-- <div class="title_bar">
      <h3>因各项目用户量不同，排行榜仅作为参考。<a href="http://weapons.ke.com/project/358/wiki/page/182">统计指标说明</a></h3>
     <!--下载预留-->
    </div>
    <div class="fake-legend">
      <div><span style="background: #2e69d1;"></span>数据总量</div>
      <div><span style="background: #35d176;"></span>uv</div>
    </div>
    -->
    <div class="fake-legend">
    <h3>因各项目用户量不同，排行榜仅作为参考。<a href="http://weapons.ke.com/project/358/wiki/page/182">统计指标说明</a></h3>
    </div>
    <div class="img-wrap">` + imgsHtml + `</div>
    <div class="content">
      ${table}
    </div>
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

export default function ({ tableRank } = {}) {
  return `<style type="text/css">
    .content::after{
        content: '';
        display: block;
        clear: both;
    }
    .content>div{
       margin-left:20px;
    }
    body{
       padding:20px 15px 20px 20px;
    }
    table {
        font-family: verdana,arial,sans-serif;
        font-size:11px;
        color:#333333;
        border-width: 1px;
        border-color: #666666;
        border-collapse: collapse;
    }
    table th {
        border-width: 1px;
        padding: 8px;
        border-style: solid;
        border-color: #666666;
        color: #fff;
        background-color: #000;
    }
    table td {
        min-width: 100px;
        border-width: 1px;
        padding: 8px;
        border-style: solid;
        border-color: #666666;
        background-color: #ffffff;
    }
    
    .cycle-ratio_up {
        color: red;
        font-size: 10px;
    }
    .cycle-ratio_down {
        color: green;
        font-size: 10px;
    }
    .title_bar{
        display:flex;
        justify-content:space-between;
        align-items: center;
    }
    button{
        padding:6px 22px;
        color:#fff;
        background-color: #4587ff;
        border-radius: 6px;
        outline：none;
        border:none
     }
    .title {
        text-align: center;
        line-height: 50px;
        font-size: 26px;
     }
</style>`
}

import shell from 'shelljs'

function getUsedkProportion () {
  return new Promise(async resolve => {
    const { data } = await new Promise(resolve => {
      shell.exec('df -lh',
        (error, data, stderr) => resolve({ error: stderr, data }))
    })
    //找第二行带百分比得就是当前磁盘占用
    const lines = data.split('\n')
    const line = lines[1]
    const point = line.match(/(\d+%)/)[1]
    resolve(parseInt(point))
  })
}

export default {
  getUsedkProportion,
}
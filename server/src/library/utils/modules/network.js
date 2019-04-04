
import os from 'os'

/**
 * 获取本机ip via https://stackoverflow.com/a/8440736
 */
function getLocalIpList () {
  // demo =>  {"lo":[{"address":"127.0.0.1","netmask":"255.0.0.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":true,"cidr":"127.0.0.1/8"}],"eth0":[{"address":"10.26.27.20","netmask":"255.255.255.0","family":"IPv4","mac":"52:54:00:05:68:ba","internal":false,"cidr":"10.26.27.20/24"}]}
  let networkInterfaceList = os.networkInterfaces()

  let localIpList = []

  for (let networkInterface of Object.keys(networkInterfaceList)) {
    for (let interfaceInfo of networkInterfaceList[networkInterface]) {
      if (interfaceInfo.family !== 'IPv4' || interfaceInfo.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        continue
      }
      let ip = interfaceInfo.address
      localIpList.push(ip)
    }
  }
  return localIpList
}

export default {
  getLocalIpList
}

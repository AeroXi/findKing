import { LoadingAnimation } from "./Loading.js"
import { printBanner } from "./banner.js"
import { ethers } from "ethers"
import dotenv from 'dotenv'
import fs from "fs"

const loader = new LoadingAnimation("calulating...")
dotenv.config('.env')
/**
 *
 * @param {*} goldenDogsMinters 金狗地址
 * @param {*} badDogs 垃圾地址
 * @param {*} mintedAmount 打中金狗的数量
 * @param {*} trashAmount 打中垃圾的数量
 * @returns
 */
let provider = new ethers.providers.WebSocketProvider(
  `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
)

export async function findKing(
  goldenDogs = [],
  badDogs = [],
  must = [],
  mintedAmount,
  trashAmount
) {
  printBanner(
    `Monitoring Info`,
    [
      {
        label: "🐶 Golden Project Amount ",
        content: `${goldenDogs.length}`,
      },
      {
        label: "🖤 Bad Project Amount ",
        content: `${badDogs.length}`,
      },
      {
        label: "🌕 Least Golden Amount ",
        content: `${mintedAmount}`,
      },
      {
        label: "🌑 Most Trash Amount ",
        content: `${trashAmount}`,
      },
    ],
    80
  )
  loader.start()
  let goldenDogsMinters = await getDogLogs(goldenDogs, "gold")
  let badDogsMinters = await getDogLogs(badDogs, "trash")
  loader.stop()
  let dogsMintersData = []
  let goldTick = 1
  let badTick = 1
  for (let minters of goldenDogsMinters) {
    console.log(`generating data, gold dog index: ${goldTick}`)
    for (let minter of minters) {
      let _minterIndex = dogsMintersData.findIndex((el) => el.minter == minter.address)
      if (_minterIndex > 0) dogsMintersData[_minterIndex].goldenAmount++
      else {
        dogsMintersData.push({
          minter: minter.address,
          goldenAmount: 1,
          badAmount: 0,
        })
      }
    }
    goldTick++
  }

  for (let minters of badDogsMinters) {
    console.log(`generating data, gold dog index: ${badTick}`)
    for (let minter of minters) {
      let _minterIndex = dogsMintersData.findIndex((el) => el.minter == minter.address && minter.amount <= 3)
      if (_minterIndex > 0) {
        dogsMintersData[_minterIndex].badAmount++
      }
    }
    badTick++
  }

  if(must.length) {
    console.log('retriving must address')
    for(let dog of must) {
      let logs = await readFromLocale(`./goldDogLogs/${dog}.json`)
      let dogMinters = []
      for(let log of logs) {
        let add = "0x" + log.topics[2].slice(26)
        if(!dogMinters.includes(add)) dogMinters.push(add)
      }
      dogsMintersData.map((minter, index) => {
        if(!dogMinters.includes(minter.minter)) delete dogsMintersData[index]
      })
    }
  }
  
  console.log('caculating...')
  dogsMintersData.map((minter, index) => {
    if (minter.goldenAmount < mintedAmount) delete dogsMintersData[index]
    if (minter.badAmount >= trashAmount) delete dogsMintersData[index]
  })
  dogsMintersData.sort(
    (minter1, minter2) => minter2.goldenAmount - minter1.goldenAmount
  )
  console.log("---------------------------------------------------")
  console.log(dogsMintersData)
  console.log(`✅ Finish!`)
  process.exit(0)
}

export async function getWinRate(address) {
  let goldDogAmount = 0
  let trashDogAmount = 0
  let goldJsons = fs.readdirSync("./goldDogLogs")
  let trashJsons = fs.readdirSync("./trashDogLogs")
  for (let json of goldJsons) {
    let logs = await readFromLocale(`./goldDogLogs/${json}`)
    for (let log of logs) {
      let add = "0x" + log.topics[2].slice(26)
      if (add == address.toLowerCase()) {
        goldDogAmount++
        break
      }
    }
  }
  for (let json of trashJsons) {
    let logs = await readFromLocale(`./trashDogLogs/${json}`)
    for (let log of logs) {
      let add = "0x" + log.topics[2].slice(26)
      if (add == address.toLowerCase()) {
        trashDogAmount++
        break
      }
    }
  }
  printBanner(
    `Monitoring Info`,
    [
      {
        label: `🌍 Address`,
        content: `${address}`,
      },
      {
        label: "🐶 Golden Project Amount ",
        content: `${goldDogAmount}`,
      },
      {
        label: "🖤 Bad Project Amount ",
        content: `${trashDogAmount}`,
      },
    ],
    120
  )
  process.exit(0)
}

const getDogLogs = async (dogs, type) => {
  if (!dogs) return
  let DogsMinters = []
  for (let i = 0; i < dogs.length; i++) {
    let address = dogs[i]
    let prjMinters = []
    let logs = await getLogs(address, type)
    // console.log(logs)
    console.log(
      `getting logs of address ${i}:${dogs[i]}, logs' length: ${logs.length}`
    )
    if (logs) {
      for (let log of logs) {
        let add = "0x" + log.topics[2].slice(26)
        if (prjMinters.findIndex(e => e.address == add) < 0) prjMinters.push({
          address: add,
          amount: 1
        })
        else prjMinters.map((e) => {
          if(e.address == add) e.amount++
          return e
        })
      }
      DogsMinters.push(prjMinters)
    }
  }
  return DogsMinters
}

const getLogs = async (address, type) => {
  let logs = []
  let path = `./${type}DogLogs/${address}.json`
  if (fs.existsSync(path)) logs = await readFromLocale(path)
  else {
    try {
      logs = await provider.getLogs({
        address,
        fromBlock: 14400000,
        topics: [
          null,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          null,
          null,
        ],
      })
      writeToLocale(address, logs, type)
    } catch (error) {
      if (error.code == "-32602") {
        logs = await fragment(address)
        writeToLocale(address, logs, type)
      }
    }
  }
  return logs
}
const fragment = async (address) => {
  let fromBlock = 14400000
  let toBlock = await provider.getBlockNumber()
  let logs = []
  while (fromBlock + 4001 < toBlock) {
    fromBlock += 2001
    let _logs = await provider.getLogs({
      fromBlock: fromBlock,
      toBlock: fromBlock + 2000,
      address,
      topics: [
        null,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        null,
        null,
      ],
    })
    logs = [...logs, ..._logs]
  }
  logs = [
    ...logs,
    ...(await provider.getLogs({
      fromBlock: fromBlock + 2001,
      toBlock,
      address,
      topics: [
        null,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    })),
  ]
  return logs
}

const readFromLocale = async (path) => {
  return new Promise((resolve) => {
    let logs = []
    fs.readFile(path, (err, data) => {
      if (err) console.error(err)
      if (data.length) logs = JSON.parse(data)
      resolve(logs)
    })
  })
}

const writeToLocale = (address, logs, type) => {
  let path = `./${type}DogLogs/${address}.json`
  fs.writeFile(path, JSON.stringify(logs, null, 4), () => {
    console.log(`successful writting in locale`)
  })
}

export const formatTxt = (path) => {
  let res = fs.readFileSync(path, 'utf8')
  let my_address = []
  res.split(/\r?\n/).forEach(add => {
    my_address.push(add.trim())
  })
  return my_address
}

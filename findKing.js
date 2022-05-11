import { findKing, formatTxt } from "./utils.js"

console.clear()
/**
 *
 * @description 通过logs来获取mint地址，再遍历所有地址来统计每个对应地址mint到的金狗和垃圾项目的数量，通过设置后面两个参数
 *              来剔除一些垃圾地址。
 *              超过10000条返回值的合约地址会采用分片请求，等待时间会稍长一些。
 *
 * @running     通过node findKing 运行脚本
 *
 * @param {*} goldenDogsMinters 金狗地址
 * @param {*} badDogs 垃圾地址
 * @param {*} mintedAmount 打中金狗的数量 (小于该值剔除)
 * @param {*} trashAmount 打中垃圾的数量 (大于该值剔除)
 * @returns
 */

// Example
findKing(
  formatTxt("./goldDogs.txt"),
  formatTxt("./trashDogs.txt"),
  [
    // '0x5646908923F052e640611a53EC3C202864ce8620'
  ],
  20,
  100
)

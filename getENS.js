import { ethers } from "ethers";
const provider = new ethers.providers.WebSocketProvider(
    'wss://eth-mainnet.alchemyapi.io/v2/vUc8G6g7FAl8UrTYwC9o3pZTyDbZ1wgi'
  )
let result = await provider.lookupAddress("0x5555763613a12D8F3e73be831DFf8598089d3dCa");
console.log(result)

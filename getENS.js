import { ethers } from "ethers";
import { kings } from "./king.js"

const provider = new ethers.providers.WebSocketProvider(
    'wss://eth-mainnet.alchemyapi.io/v2/vUc8G6g7FAl8UrTYwC9o3pZTyDbZ1wgi'
  )

for (const king of kings) {
    console.log(await provider.lookupAddress(king.minter))
}


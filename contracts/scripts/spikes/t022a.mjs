import { parseEther, parseUnits, erc20Abi } from 'viem'
import fs from 'fs'
import * as L from './lib.mjs'
const art = JSON.parse(fs.readFileSync('MockProviderToken.json','utf8'))
let s = L.load()
if (!s.token) {
  const hash = await L.sepWal.deployContract({ abi: art.abi, bytecode: art.bytecode, args:[L.account.address] })
  const rc = await L.sepPub.waitForTransactionReceipt({hash})
  L.save({ token: rc.contractAddress, deployTx: hash, deployBlock: Number(rc.blockNumber) }); s = L.load()
  L.log('mNVDA deployed', s.token, hash)
}
if (!s.mintTx) {
  const h = await L.sepWal.writeContract({address:s.token, abi:art.abi, functionName:'mint', args:[L.account.address, parseUnits('1000',18)]})
  await L.sepPub.waitForTransactionReceipt({hash:h}); L.save({mintTx:h}); L.log('minted 1000 mNVDA', h)
}
if (!s.registerTx) {
  await L.sepPub.simulateContract({account:L.account, address:L.SERVICE, abi:L.serviceAbi, functionName:'registerOwnerlessToken', args:[s.token]})
  const h = await L.sepWal.writeContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'registerOwnerlessToken', args:[s.token]})
  await L.sepPub.waitForTransactionReceipt({hash:h}); L.save({registerTx:h}); L.log('registered', h)
}
const tokenId = await L.sepPub.readContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'getOwnerlessTokenId', args:[s.token]})
const mgr = await L.sepPub.readContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'resolveTokenManager', args:[tokenId]})
L.save({tokenId, sepoliaManager:mgr}); L.log('tokenId', tokenId, 'manager', mgr)

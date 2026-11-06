import fs from 'fs'
import { arcPub, arcWal, account, log } from './lib.mjs'
import { formatUnits } from 'viem'
const st = JSON.parse(fs.readFileSync('/workspace/agent/work/market/deploy-state.json'))
const out = '/workspace/agent/work/market/contracts/arc/out/'
const mAbi = JSON.parse(fs.readFileSync(out + 'InventoryMarket.json')).abi
const USDC = '0x3600000000000000000000000000000000000000', W = '0x5ad2862787d5C7F42a09014CE4C973d162878a16'
const erc = [{name:'balanceOf',type:'function',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'uint256'}]},{name:'approve',type:'function',stateMutability:'nonpayable',inputs:[{type:'address'},{type:'uint256'}],outputs:[{type:'bool'}]}]
const fee = { maxFeePerGas: 25_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n }
const send = async (p) => { const h = await arcWal.writeContract({ ...p, ...fee }); const r = await arcPub.waitForTransactionReceipt({ hash: h }); if (r.status !== 'success') throw new Error('revert ' + h); log(p.functionName, h); return h }
const bal = async (t, d) => formatUnits(await arcPub.readContract({address:t,abi:erc,functionName:'balanceOf',args:[account.address]}), d)
const M = st.market
const res = {}
await send({address:USDC,abi:erc,functionName:'approve',args:[M,10n**12n]})
await send({address:W,abi:erc,functionName:'approve',args:[M,10n**24n]})
res.depositW = await send({address:M,abi:mAbi,functionName:'deposit',args:[W,3n*10n**18n]})
res.depositUsdc = await send({address:M,abi:mAbi,functionName:'deposit',args:[USDC,8_000_000n]})
log('before', 'w', await bal(W,18), 'usdc', await bal(USDC,6))
const [wOut] = await arcPub.readContract({address:M,abi:mAbi,functionName:'quoteBuy',args:[5_000_000n]})
log('quoteBuy 5 USDC ->', formatUnits(wOut,18), 'wNVDA')
res.buy = await send({address:M,abi:mAbi,functionName:'buy',args:[5_000_000n, wOut*99n/100n]})
const [uOut] = await arcPub.readContract({address:M,abi:mAbi,functionName:'quoteSell',args:[wOut]})
log('quoteSell ->', formatUnits(uOut,6), 'USDC')
res.sell = await send({address:M,abi:mAbi,functionName:'sell',args:[wOut, uOut*99n/100n]})
log('after', 'w', await bal(W,18), 'usdc', await bal(USDC,6))
log('inventory', JSON.stringify(await arcPub.readContract({address:M,abi:mAbi,functionName:'inventory'}), (_,v)=>typeof v==='bigint'?v.toString():v))
fs.writeFileSync('/workspace/agent/work/market/trade-state.json', JSON.stringify(res,null,2))

import fs from 'fs'
import { arcPub, arcWal, account, log } from './lib.mjs'
import { parseUnits, formatUnits } from 'viem'
const out = '/workspace/agent/work/market/contracts/arc/out/'
const art = n => JSON.parse(fs.readFileSync(out + n + '.json'))
const USDC = '0x3600000000000000000000000000000000000000', W = '0x5ad2862787d5C7F42a09014CE4C973d162878a16'
const erc = [{name:'balanceOf',type:'function',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'uint256'}]},{name:'approve',type:'function',stateMutability:'nonpayable',inputs:[{type:'address'},{type:'uint256'}],outputs:[{type:'bool'}]}]
const fee = { maxFeePerGas: 25_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n }
const send = async (p) => { const h = await arcWal.writeContract({ ...p, ...fee }); const r = await arcPub.waitForTransactionReceipt({ hash: h }); if (r.status !== 'success') throw new Error('revert ' + h); log(p.functionName, h); return r }
const deploy = async (n, args) => { const a = art(n); const h = await arcWal.deployContract({ abi: a.abi, bytecode: a.bytecode, args, ...fee }); const r = await arcPub.waitForTransactionReceipt({ hash: h }); log('deployed', n, r.contractAddress, h); return { address: r.contractAddress, tx: h, abi: a.abi } }
log('wNVDA', formatUnits(await arcPub.readContract({address:W,abi:erc,functionName:'balanceOf',args:[account.address]}),18), 'USDC(erc20)', formatUnits(await arcPub.readContract({address:USDC,abi:erc,functionName:'balanceOf',args:[account.address]}),6))
const oracle = await deploy('PriceOracle', [account.address, 300n])
const market = await deploy('InventoryMarket', [account.address, USDC, W, oracle.address])
const q = (await (await fetch('https://api.xstocks.fi/api/v2/public/assets/NVDAx/price-data')).json()).quote
log('xstocks quote', q)
const ts = BigInt(Math.floor(Date.now() / 1000) - 5)
await send({ address: oracle.address, abi: oracle.abi, functionName: 'updatePrice', args: [BigInt(Math.round(q * 1e8)), ts, 0, 0] })
await send({ address: oracle.address, abi: oracle.abi, functionName: 'setDemoMode', args: [true] })
await send({ address: market.address, abi: market.abi, functionName: 'setOffHoursTrading', args: [true] })
fs.writeFileSync('/workspace/agent/work/market/deploy-state.json', JSON.stringify({ oracle: oracle.address, oracleTx: oracle.tx, market: market.address, marketTx: market.tx, price: q }, null, 2))
log('done')

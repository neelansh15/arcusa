import { zeroAddress } from 'viem'
import * as L from './lib.mjs'
const s = L.load()
const t0 = Date.now()
const qr = await fetch(`${L.IRIS}/v2/quote/cctpx/${s.tokenId}/0/26`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount:'1', feeToken: zeroAddress, requests:[{type:'FORWARD', params:{msgType:'DeployTokenMessage', autoExecuteHookData:false}}] }) })
const qt = await qr.text(); L.log('quote status', qr.status, qt.slice(0,700))
if (!qr.ok) process.exit(1)
const q = JSON.parse(qt); L.save({quote:{feeTotalAmount:q.feeTotalAmount, fetchedAt:new Date().toISOString()}})
await L.sepPub.simulateContract({account:L.account, address:L.SERVICE, abi:L.serviceAbi, functionName:'deployRemoteOwnerlessToken', args:[s.token, 26, {signedQuote:q.signedQuote, refundAddress:zeroAddress}], value:BigInt(q.feeTotalAmount)})
const h = await L.sepWal.writeContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'deployRemoteOwnerlessToken', args:[s.token, 26, {signedQuote:q.signedQuote, refundAddress:zeroAddress}], value:BigInt(q.feeTotalAmount)})
const rc = await L.sepPub.waitForTransactionReceipt({hash:h}); L.log('deployRemote tx', h, rc.status); L.save({deployRemoteTx:h, deployRemoteStatus:rc.status})
for (let i=0;i<60;i++){
  try { const a = await L.arcPub.readContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'resolveTokenAddress', args:[s.tokenId]})
    if (a && a!==zeroAddress) { const m = await L.arcPub.readContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'resolveTokenManager', args:[s.tokenId]}); L.save({wNVDA:a, arcManager:m, wrapperAppearedSec:Math.round((Date.now()-t0)/1000)}); L.log('ARC wrapper', a, 'manager', m, 'after', Math.round((Date.now()-t0)/1000),'s'); break } else L.log('zero address at', i)
  } catch(e){ if(i%5==0) L.log('poll', i, (e.cause?.data||e.cause?.cause?.data||'revert').toString().slice(0,12)) }
  await new Promise(r=>setTimeout(r,10000))
}

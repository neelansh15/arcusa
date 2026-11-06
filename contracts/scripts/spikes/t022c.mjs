import { zeroAddress } from 'viem'
import * as L from './lib.mjs'
const s = L.load(); const t0 = new Date(s.quote.fetchedAt).getTime()
for (let i=0;i<150;i++){
  try { const a = await L.arcPub.readContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'resolveTokenAddress', args:[s.tokenId]})
    if (a && a!==zeroAddress) { const m = await L.arcPub.readContract({address:L.SERVICE, abi:L.serviceAbi, functionName:'resolveTokenManager', args:[s.tokenId]}); L.save({wNVDA:a, arcManager:m, wrapperAppearedSec:Math.round((Date.now()-t0)/1000)}); console.log('ARC wrapper', a, 'manager', m, 'secs since quote', Math.round((Date.now()-t0)/1000)); process.exit(0) } else console.log('zero')
  } catch(e){}
  await new Promise(r=>setTimeout(r,15000))
}
console.log('timeout'); process.exit(2)

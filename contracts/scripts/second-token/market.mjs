import solc from 'solc'; import fs from 'fs'; import os from 'os'; import path from 'path'
import {createPublicClient,createWalletClient,http,defineChain,parseUnits} from 'viem'; import {privateKeyToAccount} from 'viem/accounts'
const R=process.argv[2], step=process.argv[3]
const root=path.join(R,'contracts/arc'), oz=path.join(R,'contracts/sepolia/lib/openzeppelin-contracts/contracts/')
const names=['PriceOracle','InventoryMarket']
const sources=Object.fromEntries(names.map(n=>['src/'+n+'.sol',{content:fs.readFileSync(path.join(root,'src',n+'.sol'),'utf8')}]))
const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources,settings:{evmVersion:'cancun',optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}),{import:p=>{const f=p.replace('@openzeppelin/contracts/',oz);return fs.existsSync(f)?{contents:fs.readFileSync(f,'utf8')}:{error:'nf '+p}}}))
if(out.errors?.some(e=>e.severity==='error')){console.log(out.errors.map(e=>e.formattedMessage).join('\n'));process.exit(1)}
const art=n=>{const c=out.contracts['src/'+n+'.sol'][n];return {abi:c.abi,bytecode:'0x'+c.evm.bytecode.object}}
const arc=defineChain({id:5042002,name:'Arc',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:{default:{http:['https://rpc.testnet.arc.io']}}})
const acct=privateKeyToAccount(JSON.parse(fs.readFileSync(os.homedir()+'/.arcusa/arcusa-testnet-wallet.json','utf8')).privateKey)
const pub=createPublicClient({chain:arc,transport:http(undefined,{retryCount:10,retryDelay:3000})}),wal=createWalletClient({account:acct,chain:arc,transport:http(undefined,{retryCount:10,retryDelay:3000})})
const fee={maxFeePerGas:25_000_000_000n,maxPriorityFeePerGas:1_000_000_000n}
const log=(...a)=>console.log(new Date().toISOString(),...a)
const send=async p=>{const h=await wal.writeContract({...p,...fee});const r=await pub.waitForTransactionReceipt({hash:h});if(r.status!=='success')throw new Error('revert '+h);log(p.functionName,h);return h}
const SF='market-state.json',load=()=>fs.existsSync(SF)?JSON.parse(fs.readFileSync(SF,'utf8')):{},save=o=>fs.writeFileSync(SF,JSON.stringify({...load(),...o},null,2))
const USDC='0x3600000000000000000000000000000000000000',W='0xD6bB2FFfCc37845fe44767E40569b801c9F9afd5',RELAYER='0xB4964152cD9A6f971446E40b23Ed7513da26faE0'
const dep=async(n,args)=>{const a=art(n);const h=await wal.deployContract({abi:a.abi,bytecode:a.bytecode,args,...fee});const r=await pub.waitForTransactionReceipt({hash:h});log('deployed',n,r.contractAddress,h);return {address:r.contractAddress,tx:h,abi:a.abi}}
if(step==='deploy'){
 const o=await dep('PriceOracle',[acct.address,300n]);const m=await dep('InventoryMarket',[acct.address,USDC,W,o.address])
 const q=(await (await fetch('https://api.xstocks.fi/api/v2/public/assets/TSLAx/price-data')).json()).quote;log('xstocks TSLAx',q)
 const ts=BigInt(Math.floor(Date.now()/1000)-5)
 await send({address:o.address,abi:o.abi,functionName:'updatePrice',args:[BigInt(Math.round(q*1e8)),ts,0,0]})
 await send({address:o.address,abi:o.abi,functionName:'setDemoMode',args:[true]})
 await send({address:m.address,abi:m.abi,functionName:'setOffHoursTrading',args:[true]})
 const rtx=await send({address:o.address,abi:o.abi,functionName:'setRelayer',args:[RELAYER,true]})
 save({oracle:o.address,oracleTx:o.tx,market:m.address,marketTx:m.tx,price:q,setRelayerTx:rtx})
}
if(step==='deposit'){
 const s=load(),m=art('InventoryMarket'),erc=[{name:'approve',type:'function',stateMutability:'nonpayable',inputs:[{type:'address'},{type:'uint256'}],outputs:[{type:'bool'}]},{name:'balanceOf',type:'function',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'uint256'}]}]
 const bal=await pub.readContract({address:W,abi:erc,functionName:'balanceOf',args:[acct.address]});log('wTSLA balance',bal)
 const wAmt=parseUnits(process.argv[4],18),uAmt=parseUnits(process.argv[5],6)
 await send({address:W,abi:erc,functionName:'approve',args:[s.market,wAmt]});await send({address:USDC,abi:erc,functionName:'approve',args:[s.market,uAmt]})
 const t1=await send({address:s.market,abi:m.abi,functionName:'deposit',args:[W,wAmt]});const t2=await send({address:s.market,abi:m.abi,functionName:'deposit',args:[USDC,uAmt]});save({depositTxs:[t1,t2]})
}

import {createPublicClient,createWalletClient,http,defineChain,zeroAddress,parseUnits} from 'viem'
import {privateKeyToAccount} from 'viem/accounts'; import {sepolia} from 'viem/chains'; import fs from 'fs'; import os from 'os'
const SERVICE='0x63753E722bd2C2A5DF6EE19C5106662208B81077', IRIS='https://iris-api-sandbox.circle.com'
const arc=defineChain({id:5042002,name:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:{default:{http:['https://rpc.testnet.arc.io']}}})
const abi=[
 {type:'function',name:'registerOwnerlessToken',stateMutability:'nonpayable',inputs:[{name:'token',type:'address'}],outputs:[]},
 {type:'function',name:'getOwnerlessTokenId',stateMutability:'view',inputs:[{name:'token',type:'address'}],outputs:[{type:'bytes32'}]},
 {type:'function',name:'resolveTokenManager',stateMutability:'view',inputs:[{name:'tokenId',type:'bytes32'}],outputs:[{type:'address'}]},
 {type:'function',name:'resolveTokenAddress',stateMutability:'view',inputs:[{name:'tokenId',type:'bytes32'}],outputs:[{type:'address'}]},
 {type:'function',name:'deployRemoteOwnerlessToken',stateMutability:'payable',inputs:[{name:'token',type:'address'},{name:'destinationDomain',type:'uint32'},{name:'claim',type:'tuple',components:[{name:'signedQuote',type:'bytes'},{name:'refundAddress',type:'address'}]}],outputs:[]}]
const acct=privateKeyToAccount(JSON.parse(fs.readFileSync(os.homedir()+'/.arcusa/arcusa-testnet-wallet.json','utf8')).privateKey)
const T=http('https://ethereum-sepolia-rpc.publicnode.com'),A=http('https://rpc.testnet.arc.io')
const sp=createPublicClient({chain:sepolia,transport:T}),sw=createWalletClient({account:acct,chain:sepolia,transport:T}),ap=createPublicClient({chain:arc,transport:A})
const ST='state.json',load=()=>fs.existsSync(ST)?JSON.parse(fs.readFileSync(ST,'utf8')):{},save=o=>fs.writeFileSync(ST,JSON.stringify({...load(),...o},null,2))
const log=(...a)=>console.log(new Date().toISOString(),...a)
const art=JSON.parse(fs.readFileSync('MockTSLAToken.json','utf8')); let s=load()
if(!s.token){const h=await sw.deployContract({abi:art.abi,bytecode:art.bytecode,args:[acct.address]});const rc=await sp.waitForTransactionReceipt({hash:h});save({token:rc.contractAddress,deployTx:h});s=load();log('mTSLA',s.token,h)}
if(!s.mintTx){const h=await sw.writeContract({address:s.token,abi:art.abi,functionName:'mint',args:[acct.address,parseUnits('1000',18)]});await sp.waitForTransactionReceipt({hash:h});save({mintTx:h});log('minted',h)}
if(!s.registerTx){await sp.simulateContract({account:acct,address:SERVICE,abi,functionName:'registerOwnerlessToken',args:[s.token]});const h=await sw.writeContract({address:SERVICE,abi,functionName:'registerOwnerlessToken',args:[s.token]});await sp.waitForTransactionReceipt({hash:h});save({registerTx:h});log('registered',h)}
const tokenId=await sp.readContract({address:SERVICE,abi,functionName:'getOwnerlessTokenId',args:[s.token]})
const mgr=await sp.readContract({address:SERVICE,abi,functionName:'resolveTokenManager',args:[tokenId]});save({tokenId,sepoliaManager:mgr});log('tokenId',tokenId,'manager',mgr)
if(!s.deployRemoteTx){
 const qr=await fetch(`${IRIS}/v2/quote/cctpx/${tokenId}/0/26`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:'1',feeToken:zeroAddress,requests:[{type:'FORWARD',params:{msgType:'DeployTokenMessage',autoExecuteHookData:false}}]})})
 const qt=await qr.text();log('quote',qr.status,qt.slice(0,200));if(!qr.ok)process.exit(1);const q=JSON.parse(qt)
 const args=[s.token,26,{signedQuote:q.signedQuote,refundAddress:zeroAddress}],value=BigInt(q.feeTotalAmount)
 let ok=false;for(let i=0;i<30&&!ok;i++){try{await sp.simulateContract({account:acct,address:SERVICE,abi,functionName:'deployRemoteOwnerlessToken',args,value});ok=true}catch(e){log('sim retry',i,(e.shortMessage||e.message).slice(0,120));await new Promise(r=>setTimeout(r,30000))}}
 if(!ok)process.exit(2)
 const h=await sw.writeContract({address:SERVICE,abi,functionName:'deployRemoteOwnerlessToken',args,value});const rc=await sp.waitForTransactionReceipt({hash:h})
 save({deployRemoteTx:h,deployRemoteStatus:rc.status,fee:q.feeTotalAmount,sentAt:new Date().toISOString()});log('deployRemote',h,rc.status);s=load()
}
const t0=new Date(load().sentAt).getTime()
for(let i=0;i<200;i++){try{const a=await ap.readContract({address:SERVICE,abi,functionName:'resolveTokenAddress',args:[tokenId]});if(a&&a!==zeroAddress){const m=await ap.readContract({address:SERVICE,abi,functionName:'resolveTokenManager',args:[tokenId]});save({wTSLA:a,arcManager:m,appearedSec:Math.round((Date.now()-t0)/1000)});log('ARC wrapper',a,m);process.exit(0)}}catch(e){}
 if(i%8==0)log('waiting',i);await new Promise(r=>setTimeout(r,15000))}
log('timeout');process.exit(3)

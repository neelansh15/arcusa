import {BridgeKit} from '@circle-fin/bridge-kit'; import {createAdapterFromPrivateKey} from '@circle-fin/adapter-viem-v2'; import fs from 'fs'; import os from 'os'
const {privateKey,address}=JSON.parse(fs.readFileSync(os.homedir()+'/.arcusa/arcusa-testnet-wallet.json','utf8'))
const {tokenId}=JSON.parse(fs.readFileSync('state.json','utf8'))
const kit=new BridgeKit(),adapter=createAdapterFromPrivateKey({privateKey})
const j=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x,2)
const t0=Date.now();console.log(new Date().toISOString(),'START')
try{const r=await kit.bridge({from:{adapter,chain:'Ethereum_Sepolia'},to:{chain:'Arc_Testnet',recipientAddress:address,useForwarder:true},amount:'10',token:tokenId,config:{feePayment:'source',transferSpeed:'SLOW'}});console.log(new Date().toISOString(),'DONE',Math.round((Date.now()-t0)/1000));console.log(j(r))}catch(e){console.log('FAIL',e?.message??e);console.log(j(e))}

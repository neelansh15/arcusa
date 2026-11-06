import {arcPub,sepPub} from './lib.mjs';
const M='0x276fACA17FA1C19A0d9B4f1B190C89c2d28C601b';
const names=['owner','operator','pendingOwner','paused','rateLimit','maxTransferAmount','rateLimitWindow','token'];
for(const [n,c] of [['sepolia',sepPub],['arc',arcPub]]) for(const f of names){
 try{const r=await c.readContract({address:M,abi:[{name:f,type:'function',inputs:[],outputs:[{type:f=='paused'?'bool':(['owner','operator','pendingOwner','token'].includes(f)?'address':'uint256')}],stateMutability:'view'}],functionName:f});console.log(n,f,String(r))}catch(e){console.log(n,f,'ERR',e.shortMessage?.slice(0,60))}}

import {arcPub as arc, sepPub as sepolia} from './lib.mjs';
const s=JSON.parse((await import('fs')).readFileSync('t022-state.json'));s.token=s.token||s.mNVDA;
const abi=[{name:'name',type:'function',inputs:[],outputs:[{type:'string'}],stateMutability:'view'},{name:'symbol',type:'function',inputs:[],outputs:[{type:'string'}],stateMutability:'view'},{name:'decimals',type:'function',inputs:[],outputs:[{type:'uint8'}],stateMutability:'view'},{name:'totalSupply',type:'function',inputs:[],outputs:[{type:'uint256'}],stateMutability:'view'},{name:'balanceOf',type:'function',inputs:[{type:'address'}],outputs:[{type:'uint256'}],stateMutability:'view'}];
const w=s.wNVDA;
for(const f of ['name','symbol','decimals','totalSupply']) console.log('w',f,String(await arc.readContract({address:w,abi,functionName:f})));
console.log('locked',String(await sepolia.readContract({address:s.token,abi,functionName:'balanceOf',args:[s.sepoliaManager]})));

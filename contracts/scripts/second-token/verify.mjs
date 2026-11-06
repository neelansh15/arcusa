import {createPublicClient,http,parseAbi} from 'viem'
const abi=parseAbi(['function name() view returns (string)','function symbol() view returns (string)','function decimals() view returns (uint8)','function totalSupply() view returns (uint256)','function balanceOf(address) view returns (uint256)','function token() view returns (address)'])
const a=createPublicClient({transport:http('https://rpc.testnet.arc.io')}),s=createPublicClient({transport:http('https://ethereum-sepolia-rpc.publicnode.com')})
const W='0xD6bB2FFfCc37845fe44767E40569b801c9F9afd5',M='0xc49A72ceF1c4cDA64A4a12aBA9859a0E3BFE877f',T='0xbd0ae58afe2d6c42a3b31f8d97b31093fcbc8bdf'
for(const f of ['name','symbol','decimals','totalSupply'])console.log('wrapper',f,String(await a.readContract({address:W,abi,functionName:f})))
console.log('arc mgr token()',await a.readContract({address:M,abi,functionName:'token'}))
console.log('sep mgr token()',await s.readContract({address:M,abi,functionName:'token'}))
console.log('locked',String(await s.readContract({address:T,abi,functionName:'balanceOf',args:[M]})))

import { createWalletClient, createPublicClient, http, defineChain, zeroAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import fs from 'fs'
export const SERVICE = '0x63753E722bd2C2A5DF6EE19C5106662208B81077'
export const IRIS = 'https://iris-api-sandbox.circle.com'
export const arc = defineChain({ id: 5042002, name: 'Arc Testnet', nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18}, rpcUrls:{default:{http:['https://rpc.testnet.arc.io']}} })
export const serviceAbi = [
  { type:'function', name:'registerOwnerlessToken', stateMutability:'nonpayable', inputs:[{name:'token',type:'address'}], outputs:[] },
  { type:'function', name:'getOwnerlessTokenId', stateMutability:'view', inputs:[{name:'token',type:'address'}], outputs:[{type:'bytes32'}] },
  { type:'function', name:'resolveTokenManager', stateMutability:'view', inputs:[{name:'tokenId',type:'bytes32'}], outputs:[{type:'address'}] },
  { type:'function', name:'resolveTokenAddress', stateMutability:'view', inputs:[{name:'tokenId',type:'bytes32'}], outputs:[{type:'address'}] },
  { type:'function', name:'deployRemoteOwnerlessToken', stateMutability:'payable', inputs:[{name:'token',type:'address'},{name:'destinationDomain',type:'uint32'},{name:'claim',type:'tuple',components:[{name:'signedQuote',type:'bytes'},{name:'refundAddress',type:'address'}]}], outputs:[] },
]
const w = JSON.parse(fs.readFileSync('/workspace/agent/secrets/arcusa-testnet-wallet.json','utf8'))
export const account = privateKeyToAccount(w.privateKey)
const sepT = http('https://ethereum-sepolia-rpc.publicnode.com'), arcT = http('https://rpc.testnet.arc.io')
export const sepPub = createPublicClient({chain:sepolia, transport:sepT}), sepWal = createWalletClient({account, chain:sepolia, transport:sepT})
export const arcPub = createPublicClient({chain:arc, transport:arcT}), arcWal = createWalletClient({account, chain:arc, transport:arcT})
export const log = (...a)=>console.log(...a)
export const STATE='/workspace/agent/work/spikes/t022-state.json'
export const load=()=>fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{}
export const save=(o)=>fs.writeFileSync(STATE, JSON.stringify({...load(),...o},null,2))

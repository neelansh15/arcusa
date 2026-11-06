import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { parseEther, parseAbi } from 'viem'
import fs from 'fs'
import { arcPub, arcWal, log } from './lib.mjs'
const F = '/workspace/agent/secrets/arcusa-relayer.json'
const ORACLE = '0xcd92cc2ff8d630a93090c203463843ffd685f83d'
let k
if (fs.existsSync(F)) k = JSON.parse(fs.readFileSync(F, 'utf8')).privateKey
else { k = generatePrivateKey(); fs.writeFileSync(F, JSON.stringify({ privateKey: k, address: privateKeyToAccount(k).address }), { mode: 0o600 }) }
const addr = privateKeyToAccount(k).address
log('relayer', addr)
const fees = { maxFeePerGas: 25_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n }
const bal = await arcPub.getBalance({ address: addr })
if (bal < parseEther('0.5')) {
  const h = await arcWal.sendTransaction({ to: addr, value: parseEther('1'), ...fees })
  await arcPub.waitForTransactionReceipt({ hash: h }); log('funded', h)
}
const abi = parseAbi(['function setRelayer(address relayer, bool allowed)', 'function isRelayer(address) view returns (bool)'])
if (!(await arcPub.readContract({ address: ORACLE, abi, functionName: 'isRelayer', args: [addr] }))) {
  const h = await arcWal.writeContract({ address: ORACLE, abi, functionName: 'setRelayer', args: [addr, true], ...fees })
  await arcPub.waitForTransactionReceipt({ hash: h }); log('setRelayer', h)
}
log('isRelayer', await arcPub.readContract({ address: ORACLE, abi, functionName: 'isRelayer', args: [addr] }))
log('balance', (await arcPub.getBalance({ address: addr })).toString())

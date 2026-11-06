import { BridgeKit } from '@circle-fin/bridge-kit'
import { createAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2'
import fs from 'node:fs'

const { privateKey, address } = JSON.parse(fs.readFileSync('/workspace/agent/secrets/arcusa-testnet-wallet.json', 'utf8'))
const { tokenId } = JSON.parse(fs.readFileSync('/workspace/agent/work/spikes/t022-state.json', 'utf8'))
const adapter = createAdapterFromPrivateKey({ privateKey })
const kit = new BridgeKit()
const j = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? x.toString() : x), 2)
const dirs = [
  { name: 'sepolia->arc', from: 'Ethereum_Sepolia', to: 'Arc_Testnet', amount: '10' },
  { name: 'arc->sepolia', from: 'Arc_Testnet', to: 'Ethereum_Sepolia', amount: '5' },
] as const
for (const d of dirs) {
  const t0 = Date.now()
  console.log(new Date().toISOString(), 'START', d.name)
  try {
    const result = await kit.bridge({
      from: { adapter, chain: d.from },
      to: { chain: d.to, recipientAddress: address, useForwarder: true },
      amount: d.amount,
      token: tokenId,
      config: { feePayment: 'source', transferSpeed: 'SLOW' },
    } as any)
    console.log(new Date().toISOString(), 'DONE', d.name, 'elapsedSec', Math.round((Date.now() - t0) / 1000))
    console.log(j(result))
  } catch (e: any) {
    console.log(new Date().toISOString(), 'FAIL', d.name, 'elapsedSec', Math.round((Date.now() - t0) / 1000))
    console.log(e?.message ?? e); console.log(j(e))
    break
  }
}

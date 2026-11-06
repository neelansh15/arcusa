import { BridgeKit } from '@circle-fin/bridge-kit'
import { createAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2'
import fs from 'node:fs'

const walletFile = process.env.WALLET_FILE ?? '/workspace/agent/secrets/arcusa-t004-fresh-wallet.json'
const { privateKey, address } = JSON.parse(fs.readFileSync(walletFile, 'utf8'))
const amount = process.env.AMOUNT ?? '1'

const adapter = createAdapterFromPrivateKey({ privateKey })
const kit = new BridgeKit()
const t0 = Date.now()
const result = await kit.bridge({
  from: { adapter, chain: 'Ethereum_Sepolia' },
  to: { chain: 'Arc_Testnet', recipientAddress: address, useForwarder: true },
  amount,
  config: { feePayment: 'source' },
})
console.log(JSON.stringify({ elapsedSec: Math.round((Date.now() - t0) / 1000), result }, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2))

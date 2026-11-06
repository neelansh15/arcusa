// Compile contracts/arc/src + test mocks with solc-js (cancun, optimizer 200). Writes out/<Name>.json.
import solc from 'solc'; import fs from 'fs'; import path from 'path'
const root = '/workspace/agent/work/market/contracts/arc'
const nm = '/workspace/agent/work/spikes/node_modules'
const files = { 'src/PriceOracle.sol': 'src/PriceOracle.sol', 'src/InventoryMarket.sol': 'src/InventoryMarket.sol', 'test/MockERC20.sol': 'test/MockERC20.sol' }
const sources = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, { content: fs.readFileSync(path.join(root, v), 'utf8') }]))
const findImports = p => { try { return { contents: fs.readFileSync(path.join(nm, p), 'utf8') } } catch { return { error: 'not found ' + p } } }
const input = { language: 'Solidity', sources, settings: { evmVersion: 'cancun', optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } }
const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }))
const errs = (out.errors || [])
if (errs.length) console.log(errs.map(e => e.formattedMessage).join('\n'))
if (errs.some(e => e.severity === 'error')) process.exit(1)
fs.mkdirSync(path.join(root, 'out'), { recursive: true })
for (const f of Object.keys(files)) for (const [name, c] of Object.entries(out.contracts[f])) {
  fs.writeFileSync(path.join(root, 'out', name + '.json'), JSON.stringify({ abi: c.abi, bytecode: '0x' + c.evm.bytecode.object }))
  console.log('ok', name, c.evm.bytecode.object.length / 2, 'bytes')
}

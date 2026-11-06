import solc from 'solc'; import fs from 'fs'; import path from 'path'
const R=process.argv[2]; const src=path.join(R,'contracts/sepolia/src/MockTSLAToken.sol')
const oz=path.join(R,'contracts/sepolia/lib/openzeppelin-contracts/contracts/')
const input={language:'Solidity',sources:{'MockTSLAToken.sol':{content:fs.readFileSync(src,'utf8')}},settings:{evmVersion:'cancun',optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}
const out=JSON.parse(solc.compile(JSON.stringify(input),{import:p=>{const f=p.replace('@openzeppelin/contracts/',oz);return fs.existsSync(f)?{contents:fs.readFileSync(f,'utf8')}:{error:'nf '+p}}}))
if(out.errors?.some(e=>e.severity==='error')){console.log(out.errors.map(e=>e.formattedMessage).join('\n'));process.exit(1)}
const c=out.contracts['MockTSLAToken.sol'].MockTSLAToken
fs.writeFileSync('MockTSLAToken.json',JSON.stringify({abi:c.abi,bytecode:'0x'+c.evm.bytecode.object}));console.log('ok',c.evm.bytecode.object.length/2)

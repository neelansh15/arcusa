// Pushes the ingested NVDA price to the Arc PriceOracle. Needs viem and RELAYER_KEY (never commit it).
import { createPublicClient, createWalletClient, http, defineChain, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ORACLE = process.env.ORACLE ?? '0xcd92cc2ff8d630a93090c203463843ffd685f83d';
const SRC = process.env.PRICE_URL ?? 'http://127.0.0.1:4301/api/price';
const MOVE_BPS = Number(process.env.MOVE_BPS ?? 10);
const HEARTBEAT_S = Number(process.env.HEARTBEAT_S ?? 60);
const arc = defineChain({ id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: [process.env.ARC_RPC ?? 'https://rpc.testnet.arc.io'] } } });
const account = privateKeyToAccount(process.env.RELAYER_KEY);
const pub = createPublicClient({ chain: arc, transport: http() });
const wal = createWalletClient({ account, chain: arc, transport: http() });
const abi = parseAbi([
  'function updatePrice(uint256 price, uint64 publishTime, uint8 session, uint32 confidenceBps)',
  'function latestRound() view returns (uint256 price, uint64 publishTime, uint8 session, uint32 confidenceBps, uint256 age, bool stale)',
]);

// 1 = Regular (Mon-Fri 09:30-16:00 America/New_York), else 0 = Closed.
function session(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  const mins = Number(p.hour) * 60 + Number(p.minute);
  return !['Sat', 'Sun'].includes(p.weekday) && mins >= 570 && mins < 960 ? 1 : 0;
}

let lastPushed = null; // {price(8dp bigint), at}
let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    const r = await (await fetch(SRC)).json();
    if (!r.quote || r.stale) return console.log('skip: no fresh source price');
    const price = BigInt(Math.round(r.quote * 1e8));
    const now = Math.floor(Date.now() / 1000);
    if (!lastPushed) {
      const o = await pub.readContract({ address: ORACLE, abi, functionName: 'latestRound' });
      lastPushed = { price: o[0], at: Number(o[1]) };
    }
    const moveBps = Number(((price > lastPushed.price ? price - lastPushed.price : lastPushed.price - price) * 10000n) / lastPushed.price);
    if (moveBps < MOVE_BPS && now - lastPushed.at < HEARTBEAT_S) return;
    const hash = await wal.writeContract({ address: ORACLE, abi, functionName: 'updatePrice', args: [price, BigInt(Math.max(now, lastPushed.at + 1)), session(), 0], maxFeePerGas: 25_000_000_000n, maxPriorityFeePerGas: 1_000_000_000n });
    await pub.waitForTransactionReceipt({ hash });
    lastPushed = { price, at: now };
    console.log(new Date().toISOString(), 'oracle', r.quote, 'session', session(), hash);
  } catch (e) {
    console.log('error:', String(e.shortMessage ?? e.message ?? e).split('\n')[0]);
  } finally {
    busy = false;
  }
}
console.log('relayer', account.address, '->', ORACLE);
tick();
setInterval(tick, 5000);

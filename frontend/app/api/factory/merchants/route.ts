import { NextRequest, NextResponse } from 'next/server';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network/';

// Minimal ABI for getAllMerchants
const FACTORY_ABI = [
  {
    inputs: [],
    name: 'getAllMerchants',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
];

function encodeGetAllMerchants(): string {
  // function selector for getAllMerchants() - keccak256('getAllMerchants()') -> first 4 bytes
  // Precomputed selector (from contract): 0x150b7a02
  return '0x150b7a02';
}

export async function GET(request: NextRequest) {
  if (!FACTORY_ADDRESS || FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return NextResponse.json({ merchants: [] });
  }

  try {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: FACTORY_ADDRESS,
          data: encodeGetAllMerchants(),
        },
        'latest',
      ],
      id: 1,
    });

    const resp = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || 'rpc error');

    const result = data.result as string; // hex encoded ABI-encoded address[]
    if (!result || result === '0x') return NextResponse.json({ merchants: [] });

    // Decode dynamic array of addresses: skip 32 bytes offset, then length, then elements
    // result layout: 0x + offset(32) + length(32) + element1(32) + element2(32) ...
    const hex = result.slice(2);
    const lenHex = hex.slice(64, 128);
    const len = parseInt(lenHex, 16);
    const addrs: string[] = [];
    for (let i = 0; i < len; i++) {
      const start = 128 + i * 64;
      const addrHex = hex.slice(start + 24, start + 64); // last 40 chars
      addrs.push('0x' + addrHex);
    }

    return NextResponse.json({ merchants: addrs });
  } catch (err) {
    console.error('factory merchants error', err);
    return NextResponse.json({ merchants: [] }, { status: 500 });
  }
}

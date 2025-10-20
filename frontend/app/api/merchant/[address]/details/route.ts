import { NextRequest, NextResponse } from 'next/server';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network/';

// Factory ABI subset for getMerchantDetails
const FACTORY_ABI = [
  {
    inputs: [{ name: 'merchantAddress', type: 'address' }],
    name: 'getMerchantDetails',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'aiAgent', type: 'address' },
      { name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const merchantAddress = params.address;

  if (!merchantAddress || !merchantAddress.startsWith('0x')) {
    return NextResponse.json(
      { error: 'Invalid merchant address' },
      { status: 400 }
    );
  }

  try {
    // Call factory contract to get merchant details
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: FACTORY_ADDRESS,
            data: encodeFunctionData(merchantAddress),
          },
          'latest',
        ],
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'RPC call failed');
    }

    const result = data.result;
    
    // Decode the result (owner, aiAgent, isActive)
    // This is a simplified version - in production you'd use viem's decodeFunctionResult
    const owner = '0x' + result.slice(26, 66);
    const aiAgent = '0x' + result.slice(90, 130);
    const isActive = parseInt(result.slice(-1), 16) === 1;

    return NextResponse.json({
      address: merchantAddress,
      owner,
      aiAgent,
      isActive,
      name: `Merchant ${merchantAddress.slice(0, 8)}...`,
    });
  } catch (error: any) {
    console.error('Error fetching merchant details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch merchant details' },
      { status: 500 }
    );
  }
}

function encodeFunctionData(merchantAddress: string): string {
  // getMerchantDetails(address) function selector: 0xd33112d7
  const selector = '0xd33112d7';
  const paddedAddress = merchantAddress.slice(2).padStart(64, '0');
  return selector + paddedAddress;
}

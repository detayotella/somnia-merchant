import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { CONTRACTS } from '@/src/contracts/config';
import MerchantFactoryABI from '@/src/contracts/MerchantFactoryCoreV2.json';
import MerchantNPCABI from '@/src/contracts/MerchantNPCCoreV2.json';

const client = createPublicClient({
  chain: {
    id: 50312,
    name: 'Somnia Devnet',
    nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://dream-rpc.somnia.network'] },
      public: { http: ['https://dream-rpc.somnia.network'] },
    },
  },
  transport: http('https://dream-rpc.somnia.network'),
});

export async function GET() {
  try {
    // Get all merchant addresses from factory
    const merchantAddresses = await client.readContract({
      address: CONTRACTS.MerchantFactoryCoreV2.address as `0x${string}`,
      abi: MerchantFactoryABI,
      functionName: 'getAllMerchants',
    }) as string[];

    if (!merchantAddresses || merchantAddresses.length === 0) {
      return NextResponse.json({
        merchantCount: 0,
        totalItems: 0,
        totalProfit: 0,
        merchantStats: [],
      });
    }

    // Fetch data for each merchant (tokenId is always 1 for clones)
    const merchantStats = await Promise.all(
      merchantAddresses.map(async (address) => {
        try {
          const [itemCount, profit] = await Promise.all([
            client.readContract({
              address: address as `0x${string}`,
              abi: MerchantNPCABI,
              functionName: 'getItemCount',
              args: [BigInt(1)],
            }),
            client.readContract({
              address: address as `0x${string}`,
              abi: MerchantNPCABI,
              functionName: 'profitOf',
              args: [BigInt(1)],
            }),
          ]);

          return {
            address,
            itemCount: Number(itemCount),
            profit: Number(formatEther(profit as bigint)),
          };
        } catch (error) {
          console.error(`Error fetching data for merchant ${address}:`, error);
          return {
            address,
            itemCount: 0,
            profit: 0,
          };
        }
      })
    );

    // Aggregate totals
    const totalItems = merchantStats.reduce((sum, stat) => sum + stat.itemCount, 0);
    const totalProfit = merchantStats.reduce((sum, stat) => sum + stat.profit, 0);

    return NextResponse.json({
      merchantCount: merchantAddresses.length,
      totalItems,
      totalProfit,
      merchantStats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

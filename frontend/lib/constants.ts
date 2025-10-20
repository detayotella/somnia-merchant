export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x6e63EE04a3E2Fe8Fec10299c314968c87b5e31d2") as `0x${string}`;
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x6e63EE04a3E2Fe8Fec10299c314968c87b5e31d2") as `0x${string}`;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://dream-rpc.somnia.network/";
export const NETWORK_ID = parseInt(process.env.NEXT_PUBLIC_NETWORK_ID ?? "50312", 10);
export const THEME_COLORS = {
  background: "#0D0D0F",
  surface: "#16161A",
  mint: "#00FFC6",
  gold: "#FFD369",
  textPrimary: "#EDEDED",
  textMuted: "#A0A0A0"
};

// MerchantFactory ABI (minimal for frontend usage)
export const FACTORY_ABI = [
  {
    inputs: [
      { name: 'merchantName', type: 'string' },
      { name: 'itemName', type: 'string' },
      { name: 'initialStock', type: 'uint256' },
      { name: 'itemPrice', type: 'uint256' },
    ],
    name: 'createMerchant',
    outputs: [
      { name: 'merchantAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'merchantAddress', type: 'address' },
      { name: 'aiAgent', type: 'address' },
    ],
    name: 'registerAIAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllMerchants',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getMerchantsByOwner',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
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
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'merchantAddress', type: 'address' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'MerchantCreated',
    type: 'event',
  },
] as const;

import { getDefaultConfig, type Chain } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import type { Config } from "wagmi";
import { NETWORK_ID, RPC_URL } from "./constants";

export const somniaChain: Chain = {
  id: NETWORK_ID,
  name: "Somnia Testnet",
  nativeCurrency: { name: "Somnia Ether", symbol: "SOM", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] }
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: "https://explorer.somnia.network"
    }
  },
  testnet: true
};

export const chains = [somniaChain] as const;

const transports = {
  [somniaChain.id]: http(RPC_URL)
} as const satisfies Record<(typeof chains)[number]["id"], ReturnType<typeof http>>;

let _wagmiConfig: Config | undefined;

export function getWagmiConfig(): Config {
  if (typeof window === "undefined") {
    throw new Error("getWagmiConfig must be called on the client side only");
  }
  
  if (!_wagmiConfig) {
    _wagmiConfig = getDefaultConfig({
      appName: "Somnia Merchant NPC",
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID ?? "SOMNIA-MERCHANT-NPC",
      chains,
      transports,
      ssr: false // Disable SSR to avoid indexedDB issues
    });
  }
  return _wagmiConfig;
}

"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { getWagmiConfig } from "../lib/ethersClient";
import type { Config } from "wagmi";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    // Initialize wagmi config only on client side
    setConfig(getWagmiConfig());
  }, []);

  if (!config) {
    // Show loading state during SSR or before config is ready
    return <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
      <div className="text-[#00FFC6] text-xl">Initializing...</div>
    </div>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({ 
            accentColor: "#D4AF37", 
            accentColorForeground: "#0D0D0F",
            borderRadius: "large",
            fontStack: "system"
          })} 
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

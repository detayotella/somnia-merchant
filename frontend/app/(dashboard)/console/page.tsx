"use client";

import { useEffect, useMemo } from "react";
import { createPublicClient, http, formatEther, type Log } from "viem";
import { somniaChain } from "../../../lib/ethersClient";
import { merchantNpcAbi } from "../../../lib/abi";
import { CONTRACT_ADDRESS, RPC_URL } from "../../../lib/constants";
import { useMerchantStore } from "../../../store/useMerchantStore";
import { MerchantCard, type MerchantViewModel } from "../../../components/MerchantCard";
import { ProfitPanel } from "../../../components/ProfitPanel";
import { ActivityFeed } from "../../../components/ActivityFeed";
import { AIAgentStatus } from "../../../components/AIAgentStatus";
import { MerchantDecisionStream } from "../../../components/MerchantDecisionStream";

const client = createPublicClient({
  chain: somniaChain,
  transport: http(RPC_URL),
  pollingInterval: 6_000
});

export default function ConsolePage() {
  const { merchants, activities, setMerchants, addActivity } = useMerchantStore();

  useEffect(() => {
    async function loadMerchants() {
      try {
        const totalMerchants = await client.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: merchantNpcAbi,
          functionName: "totalMerchants"
        });

        const results: MerchantViewModel[] = [];
        for (let tokenId = 1; tokenId <= Number(totalMerchants); tokenId += 1) {
          const merchant = await buildMerchant(tokenId);
          if (merchant) {
            results.push(merchant);
          }
        }
        setMerchants(results);
      } catch (error) {
        console.error("Failed to load merchants", error);
      }
    }

    loadMerchants();
    const interval = setInterval(loadMerchants, 30_000);
    return () => clearInterval(interval);
  }, [setMerchants]);

  useEffect(() => {
    const unwatch = client.watchContractEvent({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: merchantNpcAbi,
      eventName: "ItemBought",
      onLogs: (logs) => {
        logs.forEach((log) => {
          addActivity({
            id: `${log.blockHash}-${log.logIndex}`,
            message: `Item ${log.args?.item} sold for ${formatEther(log.args?.price ?? 0n)}Ξ`,
            timestamp: Math.floor(Date.now() / 1000)
          });
        });
      }
    });

    return () => {
      unwatch?.();
    };
  }, [addActivity]);

  const profitData = useMemo(
    () =>
      merchants.map((merchant) => ({
        label: `#${merchant.tokenId}`,
        value: Number(formatEther(merchant.profitWei))
      })),
    [merchants]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-borderLight bg-gradient-to-br from-surface/80 to-surfaceLight/60 backdrop-blur-xl p-8 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-secondary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Console</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-textPrimary mb-2">Active Merchants</h2>
            <p className="text-textMuted max-w-2xl">
              Real-time monitoring of AI-powered NPC merchants on Somnia testnet. Data refreshes every 30 seconds.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surfaceLight border border-borderLight">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse-slow" />
                <span className="text-sm text-textMuted">Live</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-surfaceLight border border-borderLight">
                <span className="text-sm text-textMuted">{merchants.length} Merchants Online</span>
              </div>
            </div>
          </div>
        </section>

      {/* Merchants Grid */}
      <section>
        <div className="grid gap-6 md:grid-cols-2">
          {merchants.map((merchant) => (
            <MerchantCard key={merchant.tokenId} merchant={merchant} />
          ))}
          {merchants.length === 0 && (
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-dashed border-borderLight bg-surface/30 backdrop-blur-xl p-12 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-textPrimary mb-2">No Merchants Found</h3>
                <p className="text-textMuted mb-6">
                  Deploy the contract and mint your first NPC merchant to get started.
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-glow">
                  <span>Check Deployment Guide</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI Agent Status */}
      <AIAgentStatus />

        {/* Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProfitPanel data={profitData} />
          <ActivityFeed entries={activities} />
        </div>
    </div>
  );
}

async function buildMerchant(tokenId: number): Promise<MerchantViewModel | null> {
  try {
    const [owner, name, inventory, profit] = await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: merchantNpcAbi,
        functionName: "ownerOf",
        args: [BigInt(tokenId)]
      }),
      client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: merchantNpcAbi,
        functionName: "merchantNameOf",
        args: [BigInt(tokenId)]
      }),
      client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: merchantNpcAbi,
        functionName: "getInventory",
        args: [BigInt(tokenId)]
      }),
      client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: merchantNpcAbi,
        functionName: "profitOf",
        args: [BigInt(tokenId)]
      })
    ]);

    return {
      tokenId,
      owner,
      name,
      profitWei: profit,
      items: inventory.map((item, index) => ({
        index,
        name: item.name,
        priceWei: item.price,
        qty: Number(item.qty),
        active: item.active
      }))
    };
  } catch (error) {
    console.warn(`Skipping token ${tokenId}`, error);
    return null;
  }
}

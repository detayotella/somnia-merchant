"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPublicClient, formatEther, http } from "viem";
import { motion } from "framer-motion";
import { ArrowLeft, Package, TrendingUp, User, Wallet, ShoppingCart } from "lucide-react";
import { somniaChain } from "../../../lib/ethersClient";
import { merchantNpcAbi } from "../../../lib/abi";
import { CONTRACT_ADDRESS, RPC_URL } from "../../../lib/constants";
import type { MerchantViewModel } from "../../../components/MerchantCard";
import { ActivityFeed } from "../../../components/ActivityFeed";
import { Layout } from "../../../components/Layout";

const client = createPublicClient({ chain: somniaChain, transport: http(RPC_URL) });

export default function MerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<MerchantViewModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    async function fetchMerchant() {
      setLoading(true);
      const data = await buildMerchant(Number(params.id));
      setMerchant(data);
      setLoading(false);
    }
    fetchMerchant();
  }, [params?.id]);

  if (loading) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <button
            onClick={() => router.push("/console")}
            className="flex items-center gap-2 text-sm text-mint transition-colors hover:text-mint/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Console
          </button>
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-mint/20 border-t-mint"></div>
              <p className="text-sm text-textMuted">Loading merchant data...</p>
            </div>
          </div>
        </motion.div>
      </Layout>
    );
  }

  if (!merchant) {
    return (
      <Layout>
        <div className="space-y-6">
          <button
            onClick={() => router.push("/console")}
            className="flex items-center gap-2 text-sm text-mint transition-colors hover:text-mint/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Console
          </button>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-red-400">Merchant not found or failed to load.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const totalItems = merchant.items.reduce((sum, item) => sum + item.qty, 0);
  const activeItems = merchant.items.filter(item => item.active && item.qty > 0).length;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <button
          onClick={() => router.push("/console")}
          className="flex items-center gap-2 text-sm text-mint transition-colors hover:text-mint/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Console
        </button>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-mint/20 bg-gradient-to-br from-surface/80 via-surface/60 to-surface/40 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="absolute right-0 top-0 h-64 w-64 bg-mint/5 blur-3xl"></div>
          <div className="relative">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="font-display text-4xl font-bold text-textPrimary">
                  {merchant.name}
                </h1>
                <p className="mt-2 text-sm text-textMuted">Token ID #{merchant.tokenId}</p>
              </div>
              <div className="rounded-full bg-mint/10 p-3">
                <ShoppingCart className="h-6 w-6 text-mint" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-background/60 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gold/10 p-2">
                    <TrendingUp className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Profit Accrued</p>
                    <p className="font-display text-xl font-bold text-gold">
                      {formatEther(merchant.profitWei)}Ξ
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-background/60 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-mint/10 p-2">
                    <Package className="h-5 w-5 text-mint" />
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Total Stock</p>
                    <p className="font-display text-xl font-bold text-textPrimary">
                      {totalItems} items
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-background/60 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 p-2">
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Active Items</p>
                    <p className="font-display text-xl font-bold text-textPrimary">
                      {activeItems}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-background/40 px-4 py-3">
              <Wallet className="h-4 w-4 text-textMuted" />
              <p className="text-xs text-textMuted">Owner:</p>
              <code className="rounded bg-background/60 px-2 py-1 text-xs text-mint font-mono">
                {merchant.owner.slice(0, 6)}...{merchant.owner.slice(-4)}
              </code>
            </div>
          </div>
        </motion.div>

        {/* Inventory Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-mint/20 bg-surface/70 p-8 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-textPrimary">Inventory</h2>
            <span className="rounded-full bg-mint/10 px-3 py-1 text-sm text-mint">
              {merchant.items.length} items
            </span>
          </div>

          {merchant.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-mint/20 bg-background/40 p-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-textMuted opacity-50" />
              <p className="text-textMuted">No inventory yet.</p>
              <p className="mt-2 text-sm text-textMuted">
                The AI agent will seed items on the next cycle.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {merchant.items.map((item, idx) => (
                <motion.div
                  key={item.index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:scale-[1.02] hover:shadow-lg ${
                    item.active && item.qty > 0
                      ? "border-mint/30 bg-gradient-to-br from-mint/5 to-transparent"
                      : "border-textMuted/20 bg-background/60 opacity-60"
                  }`}
                >
                  {item.active && item.qty > 0 && (
                    <div className="absolute right-2 top-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-mint"></span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-semibold text-textPrimary">
                        {item.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-textMuted">
                          <Package className="h-4 w-4" />
                          <span>Stock: {item.qty}</span>
                        </div>
                        <div className={`rounded-full px-2 py-0.5 text-xs ${
                          item.active ? "bg-mint/20 text-mint" : "bg-textMuted/20 text-textMuted"
                        }`}>
                          {item.active ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold text-gold">
                        {formatEther(item.priceWei)}Ξ
                      </div>
                      <p className="text-xs text-textMuted">per item</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ActivityFeed entries={[]} />
        </motion.div>
      </motion.div>
    </Layout>
  );
}

async function buildMerchant(tokenId: number): Promise<MerchantViewModel | null> {
  try {
    const [owner, name, inventory, profit] = await Promise.all([
      client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: merchantNpcAbi, functionName: "ownerOf", args: [BigInt(tokenId)] }),
      client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: merchantNpcAbi, functionName: "merchantNameOf", args: [BigInt(tokenId)] }),
      client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: merchantNpcAbi, functionName: "getInventory", args: [BigInt(tokenId)] }),
      client.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: merchantNpcAbi, functionName: "profitOf", args: [BigInt(tokenId)] })
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
    console.error("Unable to load merchant", error);
    return null;
  }
}

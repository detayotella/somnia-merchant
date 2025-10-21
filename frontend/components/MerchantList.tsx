"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, ExternalLink, Loader2 } from "lucide-react";
import { useGetAllMerchants } from "@/src/contracts/hooks";

export default function MerchantList() {
  const { data: merchants, isLoading, error } = useGetAllMerchants();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-mint" />
          <p className="text-sm text-textMuted">Loading merchants from V2 factory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-red-400">Failed to load merchants</p>
        <p className="mt-2 text-sm text-textMuted">{error.message}</p>
      </div>
    );
  }

  if (!merchants || !Array.isArray(merchants) || merchants.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-mint/20 bg-surface/40 p-12 text-center">
        <Store className="mx-auto mb-4 h-12 w-12 text-textMuted opacity-50" />
        <p className="text-textMuted">No merchants found.</p>
        <p className="mt-2 text-sm text-textMuted">
          Create your first merchant to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-textPrimary">
          Your Merchants
        </h2>
        <div className="rounded-full bg-mint/10 px-3 py-1 text-xs text-mint">
          V2 Factory • {merchants.length} {merchants.length === 1 ? 'Merchant' : 'Merchants'}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {merchants.map((address, idx) => (
          <MerchantCard key={address} address={address as string} index={idx} />
        ))}
      </div>
    </div>
  );
}

// Separate component for better performance
function MerchantCard({ address, index }: { address: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-mint/20 bg-gradient-to-br from-surface/80 to-surface/60 p-6 shadow-lg backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-xl"
    >
      <div className="absolute right-0 top-0 h-32 w-32 bg-mint/5 blur-3xl"></div>
      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-mint/10 p-3">
            <Store className="h-6 w-6 text-mint" />
          </div>
          <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
            Active
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-textPrimary">
            Merchant #{index + 1}
          </h3>
          <code className="mt-2 block rounded bg-background/60 px-2 py-1 font-mono text-xs text-textMuted">
            {address.slice(0, 6)}...{address.slice(-4)}
          </code>
        </div>
        <Link
          href={`/merchant/${address}`}
          className="flex items-center gap-2 text-sm font-semibold text-mint transition-colors hover:text-mint/80"
        >
          View Details
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatEther } from "viem";

export interface InventoryItem {
  index: number;
  name: string;
  priceWei: bigint;
  qty: number;
  active: boolean;
}

export interface MerchantViewModel {
  tokenId: number;
  name: string;
  owner: string;
  profitWei: bigint;
  items: InventoryItem[];
}

interface MerchantCardProps {
  merchant: MerchantViewModel;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  const profit = Number(formatEther(merchant.profitWei));
  const activeItems = merchant.items.filter(item => item.active && item.qty > 0);
  const totalStock = merchant.items.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = merchant.items.reduce((sum, item) => sum + Number(formatEther(item.priceWei)) * item.qty, 0);

  return (
    <motion.article
      className="group relative overflow-hidden rounded-2xl border border-borderLight bg-surface/90 backdrop-blur-xl shadow-card hover:shadow-cardHover transition-all duration-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" />

      <div className="relative p-6 space-y-5">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Merchant ID Badge */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-primary font-bold text-sm">#{merchant.tokenId}</span>
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success border-2 border-surface" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold text-textPrimary mb-1 truncate group-hover:text-primary transition-colors">
                {merchant.name || `Merchant #${merchant.tokenId}`}
              </h2>
              <p className="text-xs text-textMuted font-mono truncate flex items-center gap-1.5">
                <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {merchant.owner.slice(0, 6)}...{merchant.owner.slice(-4)}
              </p>
            </div>
          </div>
          
          {/* Profit Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="badge-gold">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{profit.toFixed(4)} Ξ</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-textMuted font-semibold">Profit</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-surfaceLight/50 border border-borderLight">
          <div className="text-center">
            <div className="text-2xl font-bold text-textPrimary mb-0.5">{activeItems.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-textMuted font-semibold">Items</div>
          </div>
          <div className="text-center border-x border-borderLight">
            <div className="text-2xl font-bold text-textPrimary mb-0.5">{totalStock}</div>
            <div className="text-[10px] uppercase tracking-wider text-textMuted font-semibold">Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-0.5">{totalValue.toFixed(2)}</div>
            <div className="text-[10px] uppercase tracking-wider text-textMuted font-semibold">Value Ξ</div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider font-bold text-textMuted">Inventory</h3>
            {merchant.items.length > 3 && (
              <span className="text-xs font-semibold text-primary">+{merchant.items.length - 3}</span>
            )}
          </div>
          
          {merchant.items.length > 0 ? (
            <div className="space-y-2">
              {merchant.items.slice(0, 3).map((item) => (
                <div 
                  key={item.index} 
                  className="group/item flex items-center justify-between p-3 rounded-lg bg-background/50 border border-borderLight/50 hover:border-primary/30 hover:bg-background/70 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 h-2 w-2 rounded-full ${item.active && item.qty > 0 ? 'bg-success shadow-[0_0_8px_rgba(5,150,105,0.5)]' : 'bg-textDisabled'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-textPrimary text-sm truncate group-hover/item:text-primary transition-colors">{item.name}</p>
                      <p className="text-[11px] text-textMuted">
                        <span className={item.qty > 0 ? 'text-success' : 'text-error'}>
                          {item.qty} in stock
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-sm font-bold text-primary">{formatEther(item.priceWei)}</span>
                    <span className="text-[10px] text-textMuted uppercase">Ξ</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-borderLight bg-background/30 text-center">
              <svg className="h-8 w-8 mx-auto mb-2 text-textDisabled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm text-textMuted">No inventory</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link
          href={`/merchant/${merchant.tokenId}`}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
        >
          <span>View Details</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.article>
  );
}

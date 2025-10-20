'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Loader2, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { useBuyItem, useGetItem, useGetItemCount } from '@/src/contracts/hooks';
import { formatEther, parseEther } from 'viem';

interface PurchaseModalProps {
  merchantAddress: string;
  merchantId: bigint;
  itemId: bigint;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ItemData {
  name: string;
  price: bigint;
  quantity: bigint;
  isActive: boolean;
}

export default function PurchaseModal({
  merchantAddress,
  merchantId,
  itemId,
  isOpen,
  onClose,
  onSuccess,
}: PurchaseModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [purchaseStep, setPurchaseStep] = useState<'select' | 'confirming' | 'success' | 'error'>('select');
  
  const { data: itemData, isLoading: isLoadingItem, error: itemError } = useGetItem(
    merchantAddress,
    merchantId,
    itemId
  );
  
  const { buyItem, isPending, isConfirming, isSuccess, error, hash } = useBuyItem();

  // Parse item data
  const item: ItemData | null = itemData ? {
    name: (itemData as any)[0] || 'Unknown Item',
    price: BigInt((itemData as any)[1] || 0),
    quantity: BigInt((itemData as any)[2] || 0),
    isActive: Boolean((itemData as any)[3]),
  } : null;

  const totalCost = item ? item.price * BigInt(quantity) : BigInt(0);

  // Handle quantity changes
  const incrementQuantity = () => {
    if (item && quantity < Number(item.quantity)) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!item || !item.isActive) {
      alert('This item is not available');
      return;
    }
    if (quantity < 1 || quantity > Number(item.quantity)) {
      alert('Invalid quantity');
      return;
    }

    try {
      setPurchaseStep('confirming');
      await buyItem(
        merchantAddress,
        merchantId,
        itemId,
        BigInt(quantity),
        totalCost
      );
    } catch (err) {
      console.error('Purchase error:', err);
      setPurchaseStep('error');
    }
  };

  // Watch for transaction success
  useEffect(() => {
    if (isSuccess) {
      setPurchaseStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    }
  }, [isSuccess, onSuccess, onClose]);

  // Watch for transaction error
  useEffect(() => {
    if (error) {
      setPurchaseStep('error');
    }
  }, [error]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setPurchaseStep('select');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="bg-surface border border-borderLight rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-borderLight p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Purchase Item</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-background/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoadingItem && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {itemError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-400">Failed to load item</p>
                    <p className="text-sm text-textSecondary mt-1">
                      {itemError.message}
                    </p>
                  </div>
                </div>
              )}

              {item && purchaseStep === 'select' && (
                <div className="space-y-6">
                  {/* Item Info */}
                  <div className="bg-background/50 rounded-xl p-4 border border-borderLight">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-textSecondary">Price:</span>
                            <span className="font-mono font-semibold">
                              {formatEther(item.price)} STT
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-textSecondary">Available:</span>
                            <span className={item.quantity > 0 ? 'text-green-400' : 'text-red-400'}>
                              {item.quantity.toString()} units
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-textSecondary">Status:</span>
                            <span className={item.isActive ? 'text-green-400' : 'text-red-400'}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-3">
                      Quantity
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="p-2 rounded-lg bg-background hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={Number(item.quantity)}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= Number(item.quantity)) {
                            setQuantity(val);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-background border border-borderLight rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= Number(item.quantity)}
                        className="p-2 rounded-lg bg-background hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Total Cost */}
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-textSecondary">Total Cost:</span>
                      <span className="text-2xl font-bold font-mono text-primary">
                        {formatEther(totalCost)} STT
                      </span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={handlePurchase}
                    disabled={!item.isActive || item.quantity === BigInt(0) || isPending}
                    className="w-full px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-transform flex items-center justify-center gap-2"
                  >
                    {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isPending ? 'Confirming...' : 'Purchase Now'}
                  </button>

                  {!item.isActive && (
                    <p className="text-sm text-red-400 text-center">
                      This item is currently unavailable
                    </p>
                  )}
                </div>
              )}

              {purchaseStep === 'confirming' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-semibold text-lg">Processing Purchase</p>
                    <p className="text-sm text-textSecondary mt-2">
                      {isPending && 'Please confirm the transaction in your wallet'}
                      {isConfirming && 'Waiting for blockchain confirmation...'}
                    </p>
                    {hash && (
                      <code className="mt-4 block text-xs text-textSecondary">
                        TX: {hash.slice(0, 10)}...{hash.slice(-8)}
                      </code>
                    )}
                  </div>
                </div>
              )}

              {purchaseStep === 'success' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-green-400">Purchase Successful!</h3>
                    <p className="text-sm text-textSecondary mt-2">
                      You purchased {quantity} {item?.name}
                    </p>
                    {hash && (
                      <code className="mt-4 block text-xs text-textSecondary">
                        TX: {hash.slice(0, 10)}...{hash.slice(-8)}
                      </code>
                    )}
                  </div>
                </div>
              )}

              {purchaseStep === 'error' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-red-400">Purchase Failed</h3>
                    <p className="text-sm text-textSecondary mt-2">
                      {error?.message || 'Transaction failed. Please try again.'}
                    </p>
                    <button
                      onClick={() => setPurchaseStep('select')}
                      className="mt-4 px-4 py-2 bg-surface border border-borderLight rounded-lg hover:bg-background/50 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Inventory Display Component
interface InventoryDisplayProps {
  merchantAddress: string;
  merchantId: bigint;
  onPurchase?: (itemId: bigint) => void;
}

export function InventoryDisplay({
  merchantAddress,
  merchantId,
  onPurchase,
}: InventoryDisplayProps) {
  const { data: itemCount, isLoading } = useGetItemCount(merchantAddress, merchantId);
  const [selectedItem, setSelectedItem] = useState<bigint | null>(null);

  const count = itemCount ? Number(itemCount) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="rounded-xl border border-dashed border-borderLight bg-background/20 p-8 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-textSecondary opacity-50" />
        <p className="text-textSecondary">No items in inventory</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }, (_, i) => (
          <InventoryItem
            key={i}
            merchantAddress={merchantAddress}
            merchantId={merchantId}
            itemId={BigInt(i)}
            onBuy={() => {
              setSelectedItem(BigInt(i));
              onPurchase?.(BigInt(i));
            }}
          />
        ))}
      </div>

      {selectedItem !== null && (
        <PurchaseModal
          merchantAddress={merchantAddress}
          merchantId={merchantId}
          itemId={selectedItem}
          isOpen={selectedItem !== null}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            // Refetch inventory or show success message
            setSelectedItem(null);
          }}
        />
      )}
    </>
  );
}

// Individual Inventory Item Card
function InventoryItem({
  merchantAddress,
  merchantId,
  itemId,
  onBuy,
}: {
  merchantAddress: string;
  merchantId: bigint;
  itemId: bigint;
  onBuy: () => void;
}) {
  const { data: itemData, isLoading } = useGetItem(merchantAddress, merchantId, itemId);

  const item: ItemData | null = itemData ? {
    name: (itemData as any)[0] || 'Unknown Item',
    price: BigInt((itemData as any)[1] || 0),
    quantity: BigInt((itemData as any)[2] || 0),
    isActive: Boolean((itemData as any)[3]),
  } : null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-borderLight bg-surface/50 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-background rounded w-3/4"></div>
          <div className="h-3 bg-background rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl border border-borderLight bg-gradient-to-br from-surface/80 to-surface/60 p-6 shadow-lg"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{item.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {item.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-textSecondary">Price:</span>
          <span className="font-mono font-semibold">{formatEther(item.price)} STT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-textSecondary">In Stock:</span>
          <span className={item.quantity > 0 ? 'text-green-400' : 'text-red-400'}>
            {item.quantity.toString()}
          </span>
        </div>
      </div>

      <button
        onClick={onBuy}
        disabled={!item.isActive || item.quantity === BigInt(0)}
        className="w-full px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-transform"
      >
        {item.quantity === BigInt(0) ? 'Out of Stock' : 'Buy Now'}
      </button>
    </motion.div>
  );
}

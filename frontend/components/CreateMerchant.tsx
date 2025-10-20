'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Store, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCreateMerchant, useAddItem } from '@/src/contracts/hooks';
import { parseEther } from 'viem';

interface FormData {
  merchantName: string;
  itemName: string;
  initialStock: string;
  itemPrice: string;
}

export default function CreateMerchant() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState<FormData>({
    merchantName: '',
    itemName: '',
    initialStock: '10',
    itemPrice: '0.01',
  });
  const [step, setStep] = useState<'form' | 'creating' | 'adding-item' | 'complete'>('form');
  const [createdMerchant, setCreatedMerchant] = useState<string | null>(null);

  const { createMerchant, isPending: isCreatingMerchant, isConfirming: isConfirmingMerchant, isSuccess: merchantCreated, hash: createHash } = useCreateMerchant();
  const { addItem, isPending: isAddingItem, isConfirming: isConfirmingItem, isSuccess: itemAdded } = useAddItem();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    // Basic validation
    if (!formData.merchantName || formData.merchantName.length > 32) {
      alert('Merchant name must be 1-32 characters');
      return;
    }
    if (!formData.itemName) {
      alert('Item name is required');
      return;
    }
    const stock = parseInt(formData.initialStock, 10);
    if (isNaN(stock) || stock < 1) {
      alert('Initial stock must be at least 1');
      return;
    }
    const price = parseFloat(formData.itemPrice);
    if (isNaN(price) || price < 0.0001) {
      alert('Item price must be a positive number');
      return;
    }

    try {
      setStep('creating');
      await createMerchant(formData.merchantName);
    } catch (error) {
      console.error('Create merchant error:', error);
      alert('Failed to create merchant. See console for details.');
      setStep('form');
    }
  };

  // Watch for merchant creation success
  React.useEffect(() => {
    if (merchantCreated && createHash) {
      // In V2, the merchant address would be in the event logs
      // For now, we'll show success and redirect to merchant list
      setStep('complete');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  }, [merchantCreated, createHash, router]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface/80 backdrop-blur-xl rounded-3xl border border-borderLight p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Create Your Merchant (V2)</h2>
            <p className="text-sm text-textSecondary">Deploy a new MerchantNPC with initializable pattern</p>
          </div>
        </div>

        {!isConnected && (
          <div className="mb-6 bg-secondary/10 border-l-4 border-secondary rounded-r-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-secondary">
              Please connect your wallet to create a merchant.
            </p>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Merchant Name *
              </label>
              <input
                name="merchantName"
                value={formData.merchantName}
                onChange={handleInputChange}
                maxLength={32}
                required
                className="w-full px-4 py-2 bg-background/50 border border-borderLight rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g., Wizard's Emporium"
              />
              <p className="text-xs text-textSecondary mt-1">
                {formData.merchantName.length}/32 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                First Item Name *
              </label>
              <input
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-background/50 border border-borderLight rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g., Health Potion"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Initial Stock
                </label>
                <input
                  name="initialStock"
                  type="number"
                  min="1"
                  value={formData.initialStock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background/50 border border-borderLight rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Item Price (STT)
                </label>
                <input
                  name="itemPrice"
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={formData.itemPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-background/50 border border-borderLight rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isCreatingMerchant || !isConnected}
                className="px-6 py-3 bg-primary text-black font-semibold rounded-xl disabled:opacity-60 hover:scale-105 transition-transform flex items-center gap-2"
              >
                {isCreatingMerchant && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreatingMerchant ? 'Creating...' : 'Create Merchant'}
              </button>
            </div>
          </form>
        )}

        {(step === 'creating' || step === 'adding-item') && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold text-lg">
                {step === 'creating' && 'Creating your merchant...'}
                {step === 'adding-item' && 'Adding initial item...'}
              </p>
              <p className="text-sm text-textSecondary mt-2">
                {isCreatingMerchant && 'Please confirm the transaction in your wallet'}
                {isConfirmingMerchant && 'Waiting for blockchain confirmation...'}
                {isAddingItem && 'Please confirm adding the first item'}
                {isConfirmingItem && 'Adding item to your merchant...'}
              </p>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-green-400">Merchant Created!</h3>
              <p className="text-sm text-textSecondary mt-2">
                Redirecting to dashboard...
              </p>
              {createHash && (
                <code className="mt-4 block text-xs text-textSecondary">
                  TX: {createHash.slice(0, 10)}...{createHash.slice(-8)}
                </code>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

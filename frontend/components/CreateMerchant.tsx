'use client';

import { useState } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';

// TODO: Update with actual factory address after deployment
const FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000';

const FACTORY_ABI = [
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
] as const;

interface FormData {
  merchantName: string;
  itemName: string;
  initialStock: string;
  itemPrice: string;
}

export default function CreateMerchant() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState<FormData>({
    merchantName: '',
    itemName: '',
    initialStock: '10',
    itemPrice: '0.1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMerchant, setCreatedMerchant] = useState<{
    address: string;
    tokenId: string;
  } | null>(null);

  const { write: createMerchant, data: txData } = useContractWrite({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'createMerchant',
  });

  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransaction({
    hash: txData?.hash,
    onSuccess(data) {
      // Parse logs to get merchant address and tokenId
      const log = data.logs[0];
      if (log) {
        // TODO: Decode event logs properly
        setCreatedMerchant({
          address: '0x...', // Parse from event
          tokenId: '1', // Parse from event
        });
      }
      setIsSubmitting(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
      alert('Factory contract not deployed yet. Please check DEPLOYMENT.md');
      return;
    }

    // Validation
    if (!formData.merchantName || formData.merchantName.length > 32) {
      alert('Merchant name must be 1-32 characters');
      return;
    }
    if (!formData.itemName) {
      alert('Item name is required');
      return;
    }
    const stock = parseInt(formData.initialStock);
    if (isNaN(stock) || stock < 1) {
      alert('Initial stock must be at least 1');
      return;
    }
    const price = parseFloat(formData.itemPrice);
    if (isNaN(price) || price < 0.001) {
      alert('Item price must be at least 0.001 STT');
      return;
    }

    setIsSubmitting(true);
    setCreatedMerchant(null);

    try {
      createMerchant({
        args: [
          formData.merchantName,
          formData.itemName,
          BigInt(stock),
          parseEther(formData.itemPrice),
        ],
      });
    } catch (error) {
      console.error('Error creating merchant:', error);
      setIsSubmitting(false);
      alert('Failed to create merchant. See console for details.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        🏪 Create Your Merchant
      </h2>

      {!isConnected ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            Please connect your wallet to create a merchant.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Merchant Name */}
        <div>
          <label
            htmlFor="merchantName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Merchant Name *
          </label>
          <input
            type="text"
            id="merchantName"
            name="merchantName"
            value={formData.merchantName}
            onChange={handleInputChange}
            placeholder="e.g., Wizard's Shop"
            maxLength={32}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.merchantName.length}/32 characters
          </p>
        </div>

        {/* First Item Name */}
        <div>
          <label
            htmlFor="itemName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            First Item Name *
          </label>
          <input
            type="text"
            id="itemName"
            name="itemName"
            value={formData.itemName}
            onChange={handleInputChange}
            placeholder="e.g., Health Potion"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            This will be the first item in your merchant's inventory
          </p>
        </div>

        {/* Initial Stock */}
        <div>
          <label
            htmlFor="initialStock"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Initial Stock *
          </label>
          <input
            type="number"
            id="initialStock"
            name="initialStock"
            value={formData.initialStock}
            onChange={handleInputChange}
            min="1"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum: 1 unit
          </p>
        </div>

        {/* Item Price */}
        <div>
          <label
            htmlFor="itemPrice"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Item Price (STT) *
          </label>
          <input
            type="number"
            id="itemPrice"
            name="itemPrice"
            value={formData.itemPrice}
            onChange={handleInputChange}
            min="0.001"
            step="0.001"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum: 0.001 STT per item
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            What happens when you create a merchant?
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ New MerchantNPC contract deployed</li>
            <li>✅ Merchant NFT minted to your wallet</li>
            <li>✅ First inventory item added automatically</li>
            <li>✅ You can assign an AI agent to manage it</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isConnected || isSubmitting || isTxPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-md transition duration-200 ease-in-out transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
        >
          {isSubmitting || isTxPending ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating Merchant...
            </span>
          ) : (
            '🏪 Create Merchant'
          )}
        </button>
      </form>

      {/* Success Message */}
      {isTxSuccess && createdMerchant && (
        <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            ✅ Merchant Created Successfully!
          </h3>
          <div className="text-sm text-green-700 space-y-1">
            <p>
              <strong>Contract Address:</strong>{' '}
              <code className="bg-green-100 px-2 py-1 rounded">
                {createdMerchant.address}
              </code>
            </p>
            <p>
              <strong>NFT Token ID:</strong> #{createdMerchant.tokenId}
            </p>
            <p className="mt-3">
              You can now assign an AI agent to manage your merchant!
            </p>
          </div>
        </div>
      )}

      {/* Factory Not Deployed Warning */}
      {FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000' && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ Factory Contract Not Deployed
          </h3>
          <p className="text-sm text-red-700">
            The MerchantFactory contract has not been deployed yet. Please check{' '}
            <code className="bg-red-100 px-1 rounded">DEPLOYMENT.md</code> for
            instructions.
          </p>
        </div>
      )}
    </div>
  );
}

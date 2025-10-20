import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from './config';
// V2 Contracts with Initializable Pattern
import MerchantFactoryABI from './MerchantFactoryCoreV2.json';
import MerchantNPCABI from './MerchantNPCCoreV2.json';

// Factory Contract Hooks (V2)

export function useGetAllMerchants() {
  return useReadContract({
    address: CONTRACTS.MerchantFactoryCoreV2.address as `0x${string}`,
    abi: MerchantFactoryABI,
    functionName: 'getAllMerchants',
  });
}

export function useGetMerchantCount() {
  return useReadContract({
    address: CONTRACTS.MerchantFactoryCoreV2.address as `0x${string}`,
    abi: MerchantFactoryABI,
    functionName: 'getMerchantCount',
  });
}

export function useIsAIAgent(address?: string) {
  return useReadContract({
    address: CONTRACTS.MerchantFactoryCoreV2.address as `0x${string}`,
    abi: MerchantFactoryABI,
    functionName: 'isAIAgent',
    args: address ? [address] : undefined,
  });
}

export function useGetMerchantsByCreator(creator?: string) {
  return useReadContract({
    address: CONTRACTS.MerchantFactoryCoreV2.address as `0x${string}`,
    abi: MerchantFactoryABI,
    functionName: 'getMerchantsByCreator',
    args: creator ? [creator] : undefined,
  });
}

export function useRegisterAIAgent() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const registerAgent = async (agentAddress: string) => {
    writeContract({
      address: CONTRACTS.MerchantFactoryCoreV2.address as `0x${string}`,
      abi: MerchantFactoryABI,
      functionName: 'registerAIAgent',
      args: [agentAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    registerAgent,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

export function useCreateMerchant() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const createMerchant = async (name: string) => {
    writeContract({
      address: CONTRACTS.MerchantFactoryCoreV2.address as `0x${string}`,
      abi: MerchantFactoryABI,
      functionName: 'createMerchant',
      args: [name],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    createMerchant,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

// Merchant NPC Contract Hooks

export function useGetItem(merchantAddress?: string, merchantId?: bigint, itemId?: bigint) {
  return useReadContract({
    address: merchantAddress as `0x${string}`,
    abi: MerchantNPCABI,
    functionName: 'getItem',
    args: merchantId !== undefined && itemId !== undefined ? [merchantId, itemId] : undefined,
  });
}

export function useGetItemCount(merchantAddress?: string, merchantId?: bigint) {
  return useReadContract({
    address: merchantAddress as `0x${string}`,
    abi: MerchantNPCABI,
    functionName: 'getItemCount',
    args: merchantId !== undefined ? [merchantId] : undefined,
  });
}

export function useGetProfit(merchantAddress?: string, merchantId?: bigint) {
  return useReadContract({
    address: merchantAddress as `0x${string}`,
    abi: MerchantNPCABI,
    functionName: 'profitOf',
    args: merchantId !== undefined ? [merchantId] : undefined,
  });
}

export function useGetMerchantData(merchantAddress?: string, merchantId?: bigint) {
  return useReadContract({
    address: merchantAddress as `0x${string}`,
    abi: MerchantNPCABI,
    functionName: 'merchants',
    args: merchantId !== undefined ? [merchantId] : undefined,
  });
}

export function useAddItem() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const addItem = async (
    merchantAddress: string,
    merchantId: bigint,
    name: string,
    price: bigint,
    quantity: bigint
  ) => {
    writeContract({
      address: merchantAddress as `0x${string}`,
      abi: MerchantNPCABI,
      functionName: 'addItem',
      args: [merchantId, name, price, quantity],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    addItem,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

export function useRestockItem() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const restockItem = async (
    merchantAddress: string,
    merchantId: bigint,
    itemId: bigint,
    quantity: bigint
  ) => {
    writeContract({
      address: merchantAddress as `0x${string}`,
      abi: MerchantNPCABI,
      functionName: 'restockItem',
      args: [merchantId, itemId, quantity],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    restockItem,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

export function useToggleItem() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const toggleItem = async (
    merchantAddress: string,
    merchantId: bigint,
    itemId: bigint
  ) => {
    writeContract({
      address: merchantAddress as `0x${string}`,
      abi: MerchantNPCABI,
      functionName: 'toggleItem',
      args: [merchantId, itemId],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    toggleItem,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

export function useBuyItem() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const buyItem = async (
    merchantAddress: string,
    merchantId: bigint,
    itemId: bigint,
    quantity: bigint,
    value: bigint
  ) => {
    writeContract({
      address: merchantAddress as `0x${string}`,
      abi: MerchantNPCABI,
      functionName: 'buyItem',
      args: [merchantId, itemId, quantity],
      value,
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    buyItem,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

export function useWithdrawProfit() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const withdrawProfit = async (
    merchantAddress: string,
    merchantId: bigint
  ) => {
    writeContract({
      address: merchantAddress as `0x${string}`,
      abi: MerchantNPCABI,
      functionName: 'withdrawProfit',
      args: [merchantId],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  return {
    withdrawProfit,
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}

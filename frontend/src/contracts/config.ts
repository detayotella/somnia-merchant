export const SOMNIA_TESTNET = {
  chainId: 50312,
  name: 'Somnia Testnet',
  rpcUrl: 'https://dream-rpc.somnia.network/',
  blockExplorer: 'https://somnia.explorer.com', // Update when available
} as const;

export const CONTRACTS = {
  // V2 Contracts with Initializable Pattern (CURRENT)
  MerchantFactoryCoreV2: {
    address: '0xA59c20a794D389Fac2788cB1e41D185093443D36',
    deploymentTx: '0xb972ccb0cf7fa2ba29c19d8f1e050bf02002215842c2e4cc12c5976313d053d9',
  },
  MerchantNPCCoreV2: {
    address: '0xc9ec0e2eA1a44928b1d5AA3D0e117569CC1e756b',
    deploymentTx: '0xd928a2ce43f950065fe640a5b6f1c3294901db0f430daef62c782126711c63a3',
  },
  
  // V1 Contracts (DEPRECATED - merchant creation fails)
  MerchantFactoryCore: {
    address: '0xe4113B75B4d044DDfF12a746b4e8c2dBc5Fe4D7B',
    deploymentTx: '0x4c0ece412cca6cf6f59356e257e2e87244c70dcb7783cf6f679a342c0e393f1c',
  },
  MerchantNPCCore: {
    address: '0x050C4a124571B6acC6D48540d95b9a442F2e549d',
    deploymentTx: '0x1b489d95ed0d82806e9efe1a99a7b354fed16808d4a4a740abd85c891ba7d36f',
  },
  
  Libraries: {
    StorageLib: '0x88d8f2AA0a82d35467B17872Cdb8A6a6a948d0b6',
    ValidationLib: '0x1629501A881A10Ca88713961BFA974907948fa0a',
    InventoryLib: '0x61223EEff3fFE3eDCCE853c4eb4DB8C775681E23',
    PurchaseLib: '0x4886085FdB12052C5f470fBDccca5bb3B9d2fBA8',
  },
} as const;

export const AI_AGENT_ADDRESS = '0x2331B698eeE9bEaE834B06B6bDCb2DF94c9a01A3';

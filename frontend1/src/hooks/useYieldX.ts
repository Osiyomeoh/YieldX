// hooks/useYieldX.ts - Complete YieldXCore Integration with Imported ABIs
import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';

// Import ABIs from your files
import YieldXCore from '../abis/YieldXCore.json';
import YieldXPriceManager from '../abis/YieldXPriceManager.json';
import YieldXInvestmentModule from '../abis/YieldXInvestmentModule.json';
import YieldXInvoiceNFT from '../abis/YieldXInvoiceNFT.json';
import YieldXRiskCalculator from '../abis/YieldXRiskCalculator.json';
import YieldXVRFModule from '../abis/YieldXVRFModule.json';

const YieldXCoreABI = YieldXCore.abi;
const YieldXPriceManagerABI = YieldXPriceManager.abi;
const YieldXInvestmentModuleABI = YieldXInvestmentModule.abi;
const YieldXInvoiceNFTABI = YieldXInvoiceNFT.abi;
const YieldXRiskCalculatorABI = YieldXRiskCalculator.abi;
const YieldXVRFModuleABI = YieldXVRFModule.abi;

// Inline ABI for MockUSDC
const MockUSDCABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Contract addresses from your deployment
const CONTRACT_ADDRESSES = {
  USDC: "0x29Aa0e79a83304b59f6b670EBc1Ca515542e3a45" as Address,
  INVOICE_NFT: "0x5d89fC0D93f97e41cF377D72036ABDEa42Eef9e3" as Address,
  PRICE_MANAGER: "0x3657FbcC37009B1bc1Ea281D8D4F814b520680B5" as Address,
  RISK_CALCULATOR: "0xD5Daf6C5659a65bBC59Ba35D2E7d8385f9ef496e" as Address,
  INVESTMENT_MODULE: "0x15F69a1e4286438bf2998ca5CE0f8213076a4328" as Address,
  VRF_MODULE: "0x2cF96785b23A35ed6a16F0D0EbA378b46bC3eaF2" as Address,
  PROTOCOL: "0x1a4906Ea468F61c7A0352287116942A1b982f99C" as Address, // YieldXCore
  VERIFICATION_MODULE: "0xDb0128B2680935DA2daab9D8dF3D9Eb5C523476d" as Address
};

// YieldX Verification ABI - Since you don't have this file, keep the manual one
const YIELDX_VERIFICATION_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "invoiceId", "type": "uint256"}
    ],
    "name": "getDocumentVerification",
    "outputs": [
      {"internalType": "bool", "name": "verified", "type": "bool"},
      {"internalType": "bool", "name": "valid", "type": "bool"},
      {"internalType": "string", "name": "details", "type": "string"},
      {"internalType": "uint256", "name": "risk", "type": "uint256"},
      {"internalType": "string", "name": "rating", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastFunctionsResponse",
    "outputs": [
      {"internalType": "bytes32", "name": "lastRequestId", "type": "bytes32"},
      {"internalType": "bytes", "name": "lastResponse", "type": "bytes"},
      {"internalType": "bytes", "name": "lastError", "type": "bytes"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastResponseDecoded",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "invoiceId", "type": "uint256"},
      {"internalType": "string", "name": "documentHash", "type": "string"},
      {"internalType": "string", "name": "commodity", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "string", "name": "supplierCountry", "type": "string"},
      {"internalType": "string", "name": "buyerCountry", "type": "string"},
      {"internalType": "string", "name": "exporterName", "type": "string"},
      {"internalType": "string", "name": "buyerName", "type": "string"}
    ],
    "name": "startDocumentVerification",
    "outputs": [
      {"internalType": "bytes32", "name": "", "type": "bytes32"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "testDirectRequest",
    "outputs": [
      {"internalType": "bytes32", "name": "", "type": "bytes32"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ownerTestRequest",
    "outputs": [
      {"internalType": "bytes32", "name": "", "type": "bytes32"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Types
interface VerificationData {
  verified: boolean;
  valid: boolean;
  details: string;
  risk: number;
  rating: string;
  timestamp: number;
}

interface ProtocolStats {
  totalInvoices: number;
  totalFundsRaised: number;
  pendingInvoices: number;
  verifiedInvoices: number;
  fundedInvoices: number;
}

interface LiveMarketData {
  ethPrice: number;
  usdcPrice: number;
  btcPrice: number;
  linkPrice: number;
  lastUpdate: number;
  marketVolatility: number;
  initialPricesFetched: boolean;
}

export const useYieldX = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Contract writes
  const { writeContract: writeYieldXCore } = useWriteContract();
  const { writeContract: writeUSDC } = useWriteContract();
  const { writeContract: writeVerification } = useWriteContract();
  const { writeContract: writePriceManager } = useWriteContract();
  
  // ============ PROTOCOL STATS ============
  
  // Protocol Stats
  const { data: protocolStats } = useReadContract({
    address: CONTRACT_ADDRESSES.PROTOCOL,
    abi: YieldXCoreABI,
    functionName: 'getProtocolStats',
  });
  
  // Invoice counter
  const { data: invoiceCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.PROTOCOL,
    abi: YieldXCoreABI,
    functionName: 'invoiceCounter',
  });
  
  // ============ LIVE MARKET DATA ============
  
  // Live market prices
  const { data: priceData } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_MANAGER,
    abi: YieldXPriceManagerABI,
    functionName: 'getLatestPrices',
    query: { refetchInterval: 30000 }
  });
  
  // Market volatility
  const { data: volatilityData } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_MANAGER,
    abi: YieldXPriceManagerABI,
    functionName: 'calculateMarketVolatility',
    query: { refetchInterval: 60000 }
  });
  
  // Initial prices fetched status
  const { data: initialPricesFetched } = useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_MANAGER,
    abi: YieldXPriceManagerABI,
    functionName: 'initialPricesFetched',
  });
  
  // ============ USDC DATA ============
  
  // Get USDC balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: MockUSDCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  // ============ VERIFICATION READ FUNCTIONS ============
  
  // Get verification data for specific invoice - THIS IS THE KEY FIX
  const getVerificationData = useCallback(async (invoiceId: string) => {
    try {
      console.log(`🔍 Getting verification data for invoice ${invoiceId}`);
      
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.VERIFICATION_MODULE,
        abi: YIELDX_VERIFICATION_ABI,
        functionName: 'getDocumentVerification',
        args: [BigInt(invoiceId)],
      }) as [boolean, boolean, string, bigint, string, bigint] | undefined;
      
      if (!result) {
        console.log('❌ No verification data found');
        return null;
      }
      
      const [verified, valid, details, risk, rating, timestamp] = result;
      
      const verificationData = {
        verified,
        valid,
        details,
        risk: Number(risk),
        rating,
        timestamp: Number(timestamp),
      };
      
      console.log(`✅ Verification data for invoice ${invoiceId}:`, verificationData);
      return verificationData;
      
    } catch (error) {
      console.error('❌ Error getting verification data:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get last Functions response (global - for debugging only)
  const getLastFunctionsResponse = useCallback(async () => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.VERIFICATION_MODULE,
        abi: YIELDX_VERIFICATION_ABI,
        functionName: 'getLastFunctionsResponse',
      }) as [string, string, string] | undefined;
      
      if (!result) return null;
      
      const [lastRequestId, lastResponse, lastError] = result;
      
      // Decode the response
      let decodedResponse = '';
      if (lastResponse && lastResponse !== '0x') {
        try {
          decodedResponse = Buffer.from(lastResponse.slice(2), 'hex').toString('utf8');
        } catch (e) {
          console.warn('Could not decode response:', e);
        }
      }
      
      return {
        lastRequestId,
        lastResponse,
        lastError,
        decodedResponse,
        responseLength: lastResponse ? (lastResponse.length - 2) / 2 : 0,
      };
    } catch (error) {
      console.error('Error getting last Functions response:', error);
      return null;
    }
  }, [publicClient]);
  
  // ============ YIELDX CORE READ FUNCTIONS ============
  
  // Get investment opportunities
  const getInvestmentOpportunities = useCallback(async () => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvestmentOpportunities',
      }) as bigint[] | undefined;
      
      return result?.map(id => Number(id)) || [];
    } catch (error) {
      console.error('Error getting investment opportunities:', error);
      return [];
    }
  }, [publicClient]);
  
  // Get invoice basics
  const getInvoiceBasics = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoiceBasics',
        args: [BigInt(invoiceId)],
      }) as [bigint, string, bigint, number] | undefined;
      
      if (!result) return null;
      
      const [id, supplier, amount, status] = result;
      
      return {
        id: Number(id),
        supplier,
        amount: Number(amount),
        status,
      };
    } catch (error) {
      console.error('Error getting invoice basics:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get invoice parties
  const getInvoiceParties = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoiceParties',
        args: [BigInt(invoiceId)],
      }) as [string, string, string, string] | undefined;
      
      if (!result) return null;
      
      const [buyer, exporterName, buyerName, commodity] = result;
      
      return {
        buyer,
        exporterName,
        buyerName,
        commodity,
      };
    } catch (error) {
      console.error('Error getting invoice parties:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get invoice financials
  const getInvoiceFinancials = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoiceFinancials',
        args: [BigInt(invoiceId)],
      }) as [bigint, bigint, bigint, bigint] | undefined;
      
      if (!result) return null;
      
      const [targetFunding, currentFunding, aprBasisPoints, dueDate] = result;
      
      return {
        targetFunding: Number(targetFunding),
        currentFunding: Number(currentFunding),
        aprBasisPoints: Number(aprBasisPoints),
        dueDate: Number(dueDate),
      };
    } catch (error) {
      console.error('Error getting invoice financials:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get invoice locations
  const getInvoiceLocations = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoiceLocations',
        args: [BigInt(invoiceId)],
      }) as [string, string] | undefined;
      
      if (!result) return null;
      
      const [supplierCountry, buyerCountry] = result;
      
      return {
        supplierCountry,
        buyerCountry,
      };
    } catch (error) {
      console.error('Error getting invoice locations:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get invoice metadata
  const getInvoiceMetadata = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoiceMetadata',
        args: [BigInt(invoiceId)],
      }) as [bigint, boolean, bigint] | undefined;
      
      if (!result) return null;
      
      const [createdAt, documentVerified, remainingFunding] = result;
      
      return {
        createdAt: Number(createdAt),
        documentVerified,
        remainingFunding: Number(remainingFunding),
      };
    } catch (error) {
      console.error('Error getting invoice metadata:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get investment basics
  const getInvestmentBasics = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvestmentBasics',
        args: [BigInt(invoiceId)],
      }) as [bigint, bigint, bigint, bigint] | undefined;
      
      if (!result) return null;
      
      const [targetFunding, currentFunding, remainingFunding, numInvestors] = result;
      
      return {
        targetFunding: Number(targetFunding),
        currentFunding: Number(currentFunding),
        remainingFunding: Number(remainingFunding),
        numInvestors: Number(numInvestors),
      };
    } catch (error) {
      console.error('Error getting investment basics:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get investor data
  const getInvestorData = useCallback(async (investorAddress: string, invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvestorData',
        args: [investorAddress as Address, BigInt(invoiceId)],
      }) as bigint | undefined;
      
      return result ? Number(result) : null;
    } catch (error) {
      console.error('Error getting investor data:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get investor invoices
  const getInvestorInvoices = useCallback(async (investorAddress: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvestorInvoices',
        args: [investorAddress as Address],
      }) as bigint[] | undefined;
      
      return result?.map(id => Number(id)) || [];
    } catch (error) {
      console.error('Error getting investor invoices:', error);
      return [];
    }
  }, [publicClient]);
  
  // Get all invoices
  const getAllInvoices = useCallback(async () => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getAllInvoices',
      }) as bigint[] | undefined;
      
      return result?.map(id => Number(id)) || [];
    } catch (error) {
      console.error('Error getting all invoices:', error);
      return [];
    }
  }, [publicClient]);
  
  // Get invoices by status
  const getInvoicesByStatus = useCallback(async (status: number) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoicesByStatus',
        args: [status],
      }) as bigint[] | undefined;
      
      return result?.map(id => Number(id)) || [];
    } catch (error) {
      console.error('Error getting invoices by status:', error);
      return [];
    }
  }, [publicClient]);
  
  // ============ USDC FUNCTIONS ============
  
  // Get USDC allowance
  const getUSDCAllowance = useCallback(async (spender: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'allowance',
        args: [address as Address, spender as Address],
      }) as bigint | undefined;
      
      return result ? Number(result) : 0;
    } catch (error) {
      console.error('Error getting USDC allowance:', error);
      return 0;
    }
  }, [publicClient, address]);
  
  // ============ WRITE FUNCTIONS ============
  
  // Submit invoice to YieldXCore
  const submitInvoice = useCallback(async (invoiceData: {
    buyer: string;
    amount: string;
    commodity: string;
    supplierCountry: string;
    buyerCountry: string;
    exporterName: string;
    buyerName: string;
    dueDate: number;
    documentHash: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🚀 Submitting invoice to YieldXCore:', invoiceData);
      
      const tx = await writeYieldXCore({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'submitInvoice',
        args: [
          invoiceData.buyer as Address,
          parseUnits(invoiceData.amount, 6), // USDC has 6 decimals
          invoiceData.commodity,
          invoiceData.supplierCountry,
          invoiceData.buyerCountry,
          invoiceData.exporterName,
          invoiceData.buyerName,
          BigInt(invoiceData.dueDate),
          invoiceData.documentHash,
        ],
      });
      
      console.log('✅ Invoice submitted! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error submitting invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit invoice');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeYieldXCore]);
  
  // Invest in invoice
  const investInInvoice = useCallback(async (invoiceId: string, amount: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`💰 Investing ${amount} USDC in invoice ${invoiceId}`);
      
      const tx = await writeYieldXCore({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'investInInvoice',
        args: [BigInt(invoiceId), parseUnits(amount, 6)],
      });
      
      console.log('✅ Investment successful! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error investing:', error);
      setError(error instanceof Error ? error.message : 'Failed to invest');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeYieldXCore]);
  
  // Start document verification with real form data
  const startDocumentVerification = useCallback(async (verificationData: {
    invoiceId: string;
    documentHash: string;
    commodity: string;
    amount: string;
    supplierCountry: string;
    buyerCountry: string;
    exporterName: string;
    buyerName: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Starting document verification with real form data:', verificationData);
      
      const tx = await writeVerification({
        address: CONTRACT_ADDRESSES.VERIFICATION_MODULE,
        abi: YIELDX_VERIFICATION_ABI,
        functionName: 'startDocumentVerification',
        args: [
          BigInt(verificationData.invoiceId),
          verificationData.documentHash,
          verificationData.commodity,
          BigInt(verificationData.amount),
          verificationData.supplierCountry,
          verificationData.buyerCountry,
          verificationData.exporterName,
          verificationData.buyerName,
        ],
      });
      
      console.log('✅ Document verification started! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error starting verification:', error);
      setError(error instanceof Error ? error.message : 'Failed to start verification');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeVerification]);
  
  // Approve USDC spending
  const approveUSDC = useCallback(async (spender: string, amount: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`💳 Approving ${amount} USDC for ${spender}`);
      
      const tx = await writeUSDC({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'approve',
        args: [spender as Address, parseUnits(amount, 6)],
      });
      
      console.log('✅ USDC approved! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error approving USDC:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve USDC');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeUSDC]);
  
  // Mint test USDC
  const mintTestUSDC = useCallback(async (amount: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🏦 Minting ${amount} test USDC`);
      
      const tx = await writeUSDC({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'mint',
        args: [address as Address, parseUnits(amount, 6)],
      });
      
      console.log('✅ Test USDC minted! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error minting USDC:', error);
      setError(error instanceof Error ? error.message : 'Failed to mint USDC');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeUSDC, address]);
  
  // Update live prices
  const updateLivePrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 Updating live prices from Chainlink oracles');
      
      const tx = await writePriceManager({
        address: CONTRACT_ADDRESSES.PRICE_MANAGER,
        abi: YieldXPriceManagerABI,
        functionName: 'updateLivePrices',
      });
      
      console.log('✅ Live prices updated! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error updating prices:', error);
      setError(error instanceof Error ? error.message : 'Failed to update prices');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writePriceManager]);
  
  // Test verification request
  const testVerificationRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🧪 Sending test verification request');
      
      const tx = await writeVerification({
        address: CONTRACT_ADDRESSES.VERIFICATION_MODULE,
        abi: YIELDX_VERIFICATION_ABI,
        functionName: 'testDirectRequest',
      });
      
      console.log('✅ Test verification request sent! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error sending test verification:', error);
      setError(error instanceof Error ? error.message : 'Failed to send verification');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeVerification]);
  
  // ============ LEGACY COMPATIBILITY FUNCTIONS ============
  
  // Legacy function names for backward compatibility
  const getInvestmentInfo = useCallback(async (invoiceId: string) => {
    const basics = await getInvestmentBasics(invoiceId);
    if (!basics) return null;
    
    return {
      totalInvestment: basics.currentFunding / 1e6, // Convert to USDC
      numInvestors: basics.numInvestors,
      investors: [], // Not available in YieldXCore
    };
  }, [getInvestmentBasics]);
  
  const getInvoiceBasicData = useCallback(async (invoiceId: string) => {
    const basics = await getInvoiceBasics(invoiceId);
    const parties = await getInvoiceParties(invoiceId);
    
    if (!basics || !parties) return null;
    
    return {
      commodityType: parties.commodity,
      invoiceAmount: basics.amount / 1e6, // Convert to USDC
      exporter: parties.exporterName,
      buyer: parties.buyer,
    };
  }, [getInvoiceBasics, getInvoiceParties]);
  
  // Add a refreshBalance function
  const refreshBalance = useCallback(async () => {
    if (!address || !publicClient) return;
    try {
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: MockUSDCABI,
        functionName: 'balanceOf',
        args: [address]
      });
      return Number(balance) / 1e6;
    } catch (error) {
      console.error('Error refreshing balance:', error);
      return null;
    }
  }, [address, publicClient]);
  
  // Aliases for Dashboard compatibility
  const stats = protocolStats ? {
    totalInvoices: Number(protocolStats[0]),
    totalFundsRaised: Number(protocolStats[1]) / 1e6,
    pendingInvoices: Number(protocolStats[2]),
    verifiedInvoices: Number(protocolStats[3]),
    fundedInvoices: Number(protocolStats[4]),
  } : null;
  const loading = isLoading;
  const contracts = CONTRACT_ADDRESSES;
  const testDirectRequest = testVerificationRequest;
  
  // getInvoiceDetails: combine basic invoice info
  const getInvoiceDetails = useCallback(async (invoiceId: string) => {
    const [basics, parties, financials, locations, metadata] = await Promise.all([
      getInvoiceBasics(invoiceId),
      getInvoiceParties(invoiceId),
      getInvoiceFinancials(invoiceId),
      getInvoiceLocations(invoiceId),
      getInvoiceMetadata(invoiceId)
    ]);
    return { basics, parties, financials, locations, metadata };
  }, [getInvoiceBasics, getInvoiceParties, getInvoiceFinancials, getInvoiceLocations, getInvoiceMetadata]);
  
  // getFunctionsConfig: stub
  const getFunctionsConfig = useCallback(async () => null, []);
  
  // Return all functions and data
  return {
    // Connection state
    isConnected,
    address,
    isLoading,
    error,
    
    // Protocol data
    protocolStats: stats,
    invoiceCounter: invoiceCounter ? Number(invoiceCounter) : 0,
    
    // Live market data
    liveMarketData: priceData ? {
      ethPrice: Number(priceData[0]) / 1e8,
      usdcPrice: Number(priceData[1]) / 1e8,
      btcPrice: Number(priceData[2]) / 1e8,
      linkPrice: Number(priceData[3]) / 1e8,
      lastUpdate: Number(priceData[4]),
      marketVolatility: volatilityData ? Number(volatilityData) / 100 : 0.02,
      initialPricesFetched: Boolean(initialPricesFetched),
    } : null,
    
    // USDC data
    usdcBalance: usdcBalance ? Number(usdcBalance) / 1e6 : 0,
    
    // Contract addresses
    contractAddresses: CONTRACT_ADDRESSES,
    contracts,
    
    // YieldXCore functions
    getInvestmentOpportunities,
    getInvoiceBasics,
    getInvoiceParties,
    getInvoiceFinancials,
    getInvoiceLocations,
    getInvoiceMetadata,
    getInvestmentBasics,
    getInvestorData,
    getInvestorInvoices,
    getAllInvoices,
    getInvoicesByStatus,
    submitInvoice,
    investInInvoice,
    
    // Verification functions
    getVerificationData,
    getLastFunctionsResponse,
    startDocumentVerification,
    testVerificationRequest,
    testDirectRequest,
    
    // USDC functions
    getUSDCAllowance,
    approveUSDC,
    mintTestUSDC,
    refreshBalance,
    
    // Price management
    updateLivePrices,
    
    // Dashboard compatibility
    loading,
    getInvoiceDetails,
    getFunctionsConfig,
    
    // Legacy compatibility
    getInvestmentInfo,
    getInvoiceBasicData,
  };
};
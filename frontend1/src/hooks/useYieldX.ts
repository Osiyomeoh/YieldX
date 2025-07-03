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
// ✅ PRODUCTION-READY YIELDX PROTOCOL ADDRESSES
const CONTRACT_ADDRESSES = {
  USDC: "0x6a563Ea24116aa64d2Ea325d6fd3Cefbf20F0FDb", // ✅ mockUSDC
  INVOICE_NFT: "0xb862eCe2874b75e8Aaba173449EF95c141B95Dc2", // ✅ yieldXNFT  
  PRICE_MANAGER: "0x8d02c2bFddff0EAc4d01a9E068d5c6971e359b7E", // ✅ priceManager
  RISK_CALCULATOR: "0x3325272046430788807F49055E3470699AE4a48A", // ✅ riskCalculator
  INVESTMENT_MODULE: "0xbe20894414bb92269c3d6D36Ff272cFc34AE9247", // ✅ investmentModule
  VRF_MODULE: "0xA10F5A4E60f8080663A7a88edD6de0B7BFE9EF87", // ✅ vrfModule
  PROTOCOL: "0x8dFAdc9b2bD255D5c8BE8f43f8FF54FE11EE5dB5", // ✅ yieldXCore  
  VERIFICATION_MODULE: "0x4402aF89143b8c36fFa6bF75Df99dBc4Beb4c7dc", // ✅ verificationModule (reused working one)
  FALLBACK_CONTRACT: "0x89f1278566F9C24C078BC1C9FB461479cfCF5183"
} as const;


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
  
  // ✅ FIXED: Investment function in useYieldX hook - check CORE CONTRACT allowance
const investInInvoice = useCallback(async (invoiceId: string, amount: string) => {
  try {
    setIsLoading(true);
    setError(null);
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid investment amount');
    }
    
    console.log(`💰 Starting investment: ${amount} USDC in Invoice ${invoiceId}`);
    console.log(`👤 Investor address: ${address}`);
    
    // Step 1: Validate user balance
    const userBalance = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
    if (userBalance < amountNum) {
      throw new Error(`Insufficient balance. You have ${userBalance.toFixed(2)} USDC but need ${amountNum} USDC`);
    }
    
    // ✅ FIXED: Step 2 - Check allowance for CORE CONTRACT (not Investment Module)
    console.log('📝 Checking USDC allowance for Core Contract...');
    const allowance = await getUSDCAllowance(CONTRACT_ADDRESSES.PROTOCOL); // ✅ CORRECT: Core Contract
    const amountWei = amountNum * 1e6;
    
    console.log(`Core Contract allowance: ${allowance / 1e6} USDC, Required: ${amountNum} USDC`);
    
    if (allowance < amountWei) {
      throw new Error(`Insufficient USDC allowance for Core Contract. Current: ${(allowance/1e6).toFixed(2)} USDC, Need: ${amountNum} USDC. Please approve USDC first.`);
    }
    
    // Step 3: Validate invoice
    console.log('📝 Validating invoice...');
    const invoiceBasics = await getInvoiceBasics(invoiceId);
    const invoiceFinancials = await getInvoiceFinancials(invoiceId);
    
    if (!invoiceBasics || !invoiceFinancials) {
      throw new Error('Could not fetch invoice details');
    }
    
    console.log(`✅ Invoice ${invoiceId} status: ${invoiceBasics.status} (need 2 for Verified)`);
    console.log(`✅ Invoice APR: ${invoiceFinancials.aprBasisPoints} basis points`);
    console.log(`✅ Invoice supplier: ${invoiceBasics.supplier}`);
    console.log(`✅ Your address: ${address}`);
    
    if (invoiceBasics.status !== 2) {
      throw new Error(`Invoice not available for investment. Status: ${invoiceBasics.status} (need 2 for Verified)`);
    }
    
    if (invoiceFinancials.aprBasisPoints <= 0) {
      throw new Error('Invoice has no APR set. Verification may not be complete.');
    }
    
    const remainingFunding = (invoiceFinancials.targetFunding - invoiceFinancials.currentFunding) / 1e6;
    if (amountNum > remainingFunding) {
      throw new Error(`Investment amount (${amountNum}) exceeds remaining funding (${remainingFunding.toFixed(2)})`);
    }
    
    // Pre-check: Are you the supplier?
    if (invoiceBasics.supplier.toLowerCase() === address?.toLowerCase()) {
      throw new Error('Supplier cannot invest in own invoice. Please use a different wallet address to invest.');
    }
    
    // Step 4: Submit transaction
    console.log('🔄 Preparing transaction for wallet confirmation...');
    console.log('💡 Please check your wallet for the transaction confirmation popup!');
    
    if (!walletClient) {
      throw new Error('Wallet client not available. Please reconnect your wallet.');
    }
    
    if (!publicClient) {
      throw new Error('Public client not available. Please check your network connection.');
    }
    
    try {
      console.log('🚀 Sending transaction to wallet for confirmation...');
      
      const transactionArgs = [BigInt(invoiceId), parseUnits(amount, 6)];
      
      const investInInvoiceAbi = YieldXCoreABI.find(
        (item: any) => item.type === 'function' && item.name === 'investInInvoice'
      );
      
      if (!investInInvoiceAbi) {
        throw new Error('investInInvoice function not found in contract ABI');
      }
      
      // ✅ CORRECT: Call Core Contract (which handles the allowance check)
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.PROTOCOL as `0x${string}`,
        abi: [investInInvoiceAbi],
        functionName: 'investInInvoice',
        args: transactionArgs,
        account: address as `0x${string}`,
      });
      
      console.log('✅ Transaction confirmed by user!');
      console.log('✅ Transaction hash:', txHash);
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for blockchain confirmation...');
      
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60000,
      });
      
      if (receipt.status === 'success') {
        console.log('🎉 Transaction confirmed on blockchain!');
        console.log('📄 Receipt:', receipt);
        
        return { 
          success: true, 
          txHash: txHash,
          message: `Investment successful! ${amount} USDC invested in Invoice #${invoiceId}`,
          receipt: receipt
        };
      } else {
        throw new Error('Transaction failed on blockchain');
      }
      
    } catch (walletError: any) {
      console.error('❌ Detailed wallet error:', walletError);
      
      // Handle user rejection
      if (walletError?.name === 'UserRejectedRequestError' || 
          walletError?.message?.includes('User rejected') ||
          walletError?.message?.includes('user rejected') ||
          walletError?.code === 4001) {
        throw new Error('Transaction was cancelled by user');
      }
      
      // Extract specific contract error messages
      let errorMessage = 'Transaction failed';
      
      if (walletError?.cause?.reason) {
        errorMessage = `Contract error: ${walletError.cause.reason}`;
      } else if (walletError?.shortMessage) {
        errorMessage = `Contract error: ${walletError.shortMessage}`;
      } else if (walletError?.details) {
        errorMessage = `Contract error: ${walletError.details}`;
      } else if (walletError?.message?.includes('execution reverted')) {
        const patterns = [
          /execution reverted: (.+?)(\"|$)/,
          /reverted with reason string '(.+?)'/,
          /revert (.+?)(\"|$)/,
          /'(.+?)'/
        ];
        
        for (const pattern of patterns) {
          const match = walletError.message.match(pattern);
          if (match && match[1]) {
            errorMessage = `Contract error: ${match[1]}`;
            break;
          }
        }
        
        if (errorMessage === 'Transaction failed') {
          errorMessage = `Contract execution reverted: ${walletError.message}`;
        }
      } else if (walletError?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fee';
      } else if (walletError?.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Transaction may revert.';
      } else if (walletError?.message) {
        errorMessage = `Wallet error: ${walletError.message}`;
      }
      
      console.log('🔍 Final extracted error message:', errorMessage);
      throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('❌ Investment failed:', error);
    
    let errorMessage = 'Investment failed';
    if (error instanceof Error) {
      if (error.message.includes('insufficient allowance') || error.message.includes('Insufficient USDC allowance')) {
        errorMessage = 'Please approve USDC for Core Contract first';
      } else if (error.message.includes('exceeds')) {
        errorMessage = 'Investment amount too high';
      } else if (error.message.includes('cancelled') || error.message.includes('rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient balance') || error.message.includes('Insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message.includes('not available for investment')) {
        errorMessage = 'Invoice not ready for investment';
      } else if (error.message.includes('Supplier cannot invest')) {
        errorMessage = 'You cannot invest in your own invoice. Please use a different wallet address.';
      } else if (error.message.includes('Contract error:')) {
        errorMessage = error.message; // Keep contract errors as-is
      } else if (error.message.includes('Wallet client not available')) {
        errorMessage = 'Please reconnect your wallet and try again';
      } else {
        errorMessage = error.message;
      }
    }
    
    setError(errorMessage);
    return { 
      success: false, 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    setIsLoading(false);
  }
}, [
  walletClient,
  publicClient,
  getUSDCAllowance, 
  getInvoiceBasics, 
  getInvoiceFinancials,
  usdcBalance, 
  setIsLoading, 
  setError,
  address
]);

// ✅ FIXED: Approve USDC function with proper error handling
// const approveUSDC = useCallback(async (spender: string, amount: string) => {
//   try {
//     setIsLoading(true);
//     setError(null);
    
//     const amountNum = parseFloat(amount);
//     if (isNaN(amountNum) || amountNum <= 0) {
//       throw new Error('Invalid approval amount');
//     }
    
//     console.log(`💳 Approving ${amount} USDC for ${spender}`);
//     console.log(`💳 Spender should be Investment Module: ${CONTRACT_ADDRESSES.INVESTMENT_MODULE}`);
    
//     // Check current balance
//     const balance = usdcBalance ? Number(usdcBalance) / 1e6 : 0;
//     if (balance < amountNum) {
//       throw new Error(`Insufficient USDC balance. You have ${balance.toFixed(2)} USDC but trying to approve ${amountNum} USDC`);
//     }
    
//     // Check current allowance
//     const currentAllowance = await getUSDCAllowance(spender);
//     console.log(`💳 Current allowance for ${spender}: ${currentAllowance / 1e6} USDC`);
    
//     // Use a large approval amount to avoid repeated approvals
//     const approvalAmount = Math.max(amountNum * 2, 10000); // Approve 2x the amount or 10,000 USDC minimum
    
//     console.log(`💳 Approving ${approvalAmount} USDC for ${spender}`);
    
//     try {
//       // ✅ FIXED: Use writeContract correctly with proper error handling
//       const approveTx = await writeUSDC({
//         address: CONTRACT_ADDRESSES.USDC,
//         abi: MockUSDCABI,
//         functionName: 'approve',
//         args: [spender as Address, parseUnits(approvalAmount.toString(), 6)],
//       });
      
//       console.log('✅ USDC approval transaction submitted:', approveTx);
      
//       // Check if we got a valid transaction hash
//       if (!approveTx || typeof approveTx !== 'string') {
//         throw new Error('Approval transaction failed - invalid response from wallet');
//       }
      
//       // Wait for transaction confirmation
//       await new Promise(resolve => setTimeout(resolve, 3000));
      
//       // Verify approval
//       const newAllowance = await getUSDCAllowance(spender);
//       console.log(`💳 New allowance for ${spender}: ${newAllowance / 1e6} USDC`);
      
//       if (newAllowance >= parseUnits(amount, 6)) {
//         console.log('✅ USDC approval confirmed!');
//         return { 
//           success: true, 
//           txHash: approveTx,
//           message: `Successfully approved ${approvalAmount} USDC spending for ${spender}`
//         };
//       } else {
//         throw new Error('Approval verification failed');
//       }
      
//     } catch (wagmiError: any) {
//       console.error('❌ Wagmi approval error:', wagmiError);
      
//       if (wagmiError?.message?.includes('User rejected')) {
//         throw new Error('Approval was cancelled by user');
//       } else {
//         throw new Error(`Approval failed: ${wagmiError.message || 'Unknown error'}`);
//       }
//     }
    
//   } catch (error) {
//     console.error('❌ USDC approval failed:', error);
//     const errorMessage = error instanceof Error ? error.message : 'Failed to approve USDC';
//     setError(errorMessage);
//     return { success: false, error: errorMessage };
//   } finally {
//     setIsLoading(false);
//   }
// }, [writeUSDC, getUSDCAllowance, usdcBalance, setIsLoading, setError]);
  
  
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
    if (!address || !walletClient || !publicClient) {
      return { success: false, error: 'Wallet not connected' };
    }
  
    try {
      setIsLoading(true);
      setError(null);
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid approval amount');
      }
      
      console.log(`💳 Approving ${amount} USDC for ${spender}`);
      console.log(`💳 Spender should be Investment Module: ${CONTRACT_ADDRESSES.INVESTMENT_MODULE}`);
      console.log(`💳 Please check your wallet for the approval transaction!`);
      
      // ✅ REMOVED: Balance check for approval - you can approve more than your balance!
      // ERC20 approvals are just setting spending limits, not transferring tokens
      
      // Check current allowance
      const currentAllowance = await getUSDCAllowance(spender);
      console.log(`💳 Current allowance for ${spender}: ${currentAllowance / 1e6} USDC`);
      
      // Use a large approval amount to avoid repeated approvals
      const approvalAmount = Math.max(amountNum * 5, 50000); // Approve 5x the amount or 50,000 USDC minimum
      
      console.log(`💳 Approving ${approvalAmount} USDC for ${spender}...`);
      
      try {
        // ✅ FIXED: Use walletClient directly - this WILL wait for user confirmation
        const approveTx = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
          abi: MockUSDCABI,
          functionName: 'approve',
          args: [spender as `0x${string}`, parseUnits(approvalAmount.toString(), 6)],
          account: address as `0x${string}`,
        });
        
        console.log('✅ Approval transaction confirmed by user!');
        console.log('✅ Transaction hash:', approveTx);
        
        // Check if we got a valid transaction hash
        if (!approveTx || typeof approveTx !== 'string' || approveTx.length < 10) {
          throw new Error('Approval transaction failed - invalid transaction hash');
        }
        
        // Wait for blockchain confirmation
        console.log('⏳ Waiting for blockchain confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: approveTx,
          timeout: 60000, // 60 second timeout
        });
        
        if (receipt.status === 'success') {
          console.log('🎉 Approval confirmed on blockchain!');
          
          // Verify approval
          const newAllowance = await getUSDCAllowance(spender);
          console.log(`💳 New allowance for ${spender}: ${newAllowance / 1e6} USDC`);
          
          if (newAllowance >= parseUnits(amount, 6)) {
            console.log('✅ USDC approval verification successful!');
            return { 
              success: true, 
              txHash: approveTx,
              message: `Successfully approved ${approvalAmount.toLocaleString()} USDC for Investment Module!`
            };
          } else {
            throw new Error('Approval verification failed - allowance not set correctly');
          }
        } else {
          throw new Error('Approval transaction was reverted by blockchain');
        }
        
      } catch (walletError: any) {
        console.error('❌ Wallet approval error:', walletError);
        console.error('❌ Error details:', {
          name: walletError?.name,
          message: walletError?.message,
          code: walletError?.code,
          cause: walletError?.cause,
        });
        
        // Handle user rejection
        if (walletError?.name === 'UserRejectedRequestError' || 
            walletError?.message?.includes('User rejected') ||
            walletError?.message?.includes('user rejected') ||
            walletError?.code === 4001) {
          throw new Error('Approval was cancelled by user');
        }
        
        // Handle insufficient gas
        if (walletError?.message?.includes('insufficient funds for intrinsic transaction cost')) {
          throw new Error('Insufficient ETH for gas fees');
        }
        
        // Handle other wallet errors
        if (walletError?.message?.includes('execution reverted')) {
          throw new Error('Approval transaction failed - please try again');
        }
        
        throw new Error(`Approval failed: ${walletError?.message || 'Unknown wallet error'}`);
      }
      
    } catch (error) {
      console.error('❌ USDC approval failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve USDC';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [
    address, 
    walletClient, 
    publicClient, 
    getUSDCAllowance, 
    setIsLoading, 
    setError
  ]); // ✅ REMOVED usdcBalance dependency
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
  
  const getCompleteInvestmentDetails = useCallback(async (invoiceId: string) => {
    try {
      console.log(`📊 Getting complete investment details for invoice ${invoiceId}`);
      
      // Get all invoice data in parallel
      const [
        basics,
        parties, 
        financials,
        locations,
        metadata,
        verification,
        investmentBasics
      ] = await Promise.all([
        getInvoiceBasics(invoiceId),
        getInvoiceParties(invoiceId),
        getInvoiceFinancials(invoiceId),
        getInvoiceLocations(invoiceId),
        getInvoiceMetadata(invoiceId),
        getVerificationData(invoiceId),
        getInvestmentBasics(invoiceId)
      ]);
      
      if (!basics || !parties || !financials) {
        console.log(`❌ Missing basic data for invoice ${invoiceId}`);
        return null;
      }
      
      // Calculate additional fields
      const currentAPR = financials.aprBasisPoints / 100; // Convert basis points to percentage
      const totalAmount = basics.amount / 1e6; // Convert to USDC
      const targetFunding = financials.targetFunding / 1e6;
      const currentFunding = financials.currentFunding / 1e6;
      const remainingFunding = targetFunding - currentFunding;
      const fundingProgress = targetFunding > 0 ? (currentFunding / targetFunding) * 100 : 0;
      
      // Calculate time to maturity
      const now = Math.floor(Date.now() / 1000);
      const daysToMaturity = Math.max(0, Math.floor((financials.dueDate - now) / (24 * 60 * 60)));
      
      // Risk assessment
      const riskLevel = verification?.risk || 50;
      const riskCategory = riskLevel <= 25 ? 'Low' : riskLevel <= 50 ? 'Medium' : riskLevel <= 75 ? 'High' : 'Very High';
      
      const completeDetails = {
        // Basic info
        id: Number(invoiceId),
        status: basics.status,
        supplier: basics.supplier,
        buyer: parties.buyer,
        
        // Financial details
        totalAmount,
        targetFunding,
        currentFunding,
        remainingFunding,
        fundingProgress,
        apr: currentAPR,
        aprBasisPoints: financials.aprBasisPoints,
        
        // Investment details
        numInvestors: investmentBasics?.numInvestors || 0,
        minInvestment: Math.max(100, remainingFunding * 0.01), // 1% of remaining or $100 min
        maxInvestment: remainingFunding,
        
        // Trade details
        commodity: parties.commodity,
        exporterName: parties.exporterName,
        buyerName: parties.buyerName,
        supplierCountry: locations?.supplierCountry || '',
        buyerCountry: locations?.buyerCountry || '',
        
        // Timeline
        submittedDate: metadata?.createdAt || 0,
        dueDate: financials.dueDate,
        daysToMaturity,
        
        // Verification & Risk
        documentVerified: metadata?.documentVerified || false,
        riskScore: verification?.risk || 0,
        riskCategory,
        creditRating: verification?.rating || 'N/A',
        
        // Display helpers
        isAvailable: basics.status === 2 && remainingFunding > 0, // Verified and has remaining funding
        isFullyFunded: currentFunding >= targetFunding,
        tradeDuration: daysToMaturity + 30, // Approximate trade duration
        
        // Formatted strings for display
        formatted: {
          totalAmount: `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          targetFunding: `$${targetFunding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          currentFunding: `$${currentFunding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          remainingFunding: `$${remainingFunding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          apr: `${currentAPR.toFixed(2)}%`,
          fundingProgress: `${fundingProgress.toFixed(1)}%`,
          submittedDate: new Date((metadata?.createdAt || 0) * 1000).toLocaleDateString(),
          dueDate: new Date(financials.dueDate * 1000).toLocaleDateString(),
          tradeRoute: `${locations?.supplierCountry || ''} → ${locations?.buyerCountry || ''}`,
        }
      };
      
      console.log(`✅ Complete investment details for invoice ${invoiceId}:`, completeDetails);
      return completeDetails;
      
    } catch (error) {
      console.error(`❌ Error getting complete investment details for invoice ${invoiceId}:`, error);
      return null;
    }
  }, [
    getInvoiceBasics,
    getInvoiceParties,
    getInvoiceFinancials,
    getInvoiceLocations,
    getInvoiceMetadata,
    getVerificationData,
    getInvestmentBasics
  ]);
  
  // Get ALL available investment opportunities with complete details
  const getAllInvestmentOpportunities = useCallback(async () => {
    try {
      console.log('📊 Getting all investment opportunities with complete details...');
      
      // Get list of verified invoice IDs
      const opportunityIds = await getInvestmentOpportunities();
      console.log(`Found ${opportunityIds.length} investment opportunities:`, opportunityIds);
      
      if (opportunityIds.length === 0) {
        console.log('ℹ️ No investment opportunities available');
        return [];
      }
      
      // Get complete details for each opportunity
      const opportunities = await Promise.all(
        opportunityIds.map(async (invoiceId) => {
          const details = await getCompleteInvestmentDetails(invoiceId.toString());
          return details;
        })
      );
      
      // Filter out any null results and sort by APR (highest first)
      const validOpportunities = opportunities
        .filter(Boolean)
        .sort((a, b) => (b?.apr || 0) - (a?.apr || 0));
      
      console.log(`✅ Retrieved ${validOpportunities.length} complete investment opportunities`);
      return validOpportunities;
      
    } catch (error) {
      console.error('❌ Error getting all investment opportunities:', error);
      return [];
    }
  }, [getInvestmentOpportunities, getCompleteInvestmentDetails]);
  
  // Get user's investment portfolio with details
  const getInvestorPortfolio = useCallback(async (investorAddress?: string) => {
    if (!investorAddress) return [];
    
    try {
      console.log(`💼 Getting investment portfolio for ${investorAddress}`);
      
      // Get list of invoices this investor has invested in
      const investedInvoiceIds = await getInvestorInvoices(investorAddress);
      console.log(`Found ${investedInvoiceIds.length} investments:`, investedInvoiceIds);
      
      if (investedInvoiceIds.length === 0) {
        return [];
      }
      
      // Get complete details for each investment
      const portfolio = await Promise.all(
        investedInvoiceIds.map(async (invoiceId) => {
          const details = await getCompleteInvestmentDetails(invoiceId.toString());
          if (!details) return null;
          
          // Get investor's specific investment amount
          const investmentAmount = await getInvestorData(investorAddress, invoiceId.toString());
          const investmentAmountUSDC = (investmentAmount || 0) / 1e6;
          
          // Calculate investor's share
          const investorShare = details.currentFunding > 0 ? 
            (investmentAmountUSDC / details.currentFunding) * 100 : 0;
          
          // Calculate potential returns
          const potentialReturn = investmentAmountUSDC * (1 + details.apr / 100);
          const potentialProfit = potentialReturn - investmentAmountUSDC;
          
          return {
            ...details,
            investment: {
              amount: investmentAmountUSDC,
              share: investorShare,
              potentialReturn,
              potentialProfit,
              formatted: {
                amount: `$${investmentAmountUSDC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                share: `${investorShare.toFixed(2)}%`,
                potentialReturn: `$${potentialReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                potentialProfit: `$${potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              }
            }
          };
        })
      );
      
      // Filter out null results and sort by investment amount (largest first)
      const validPortfolio = portfolio
        .filter(Boolean)
        .sort((a, b) => (b?.investment?.amount || 0) - (a?.investment?.amount || 0));
      
      console.log(`✅ Retrieved portfolio with ${validPortfolio.length} investments`);
      return validPortfolio;
      
    } catch (error) {
      console.error('❌ Error getting investor portfolio:', error);
      return [];
    }
  }, [getInvestorInvoices, getCompleteInvestmentDetails, getInvestorData]);
  
  // ============ ADDITIONAL MISSING YIELDX FUNCTIONS ============
  
  // Get supplier invoices
  const getSupplierInvoices = useCallback(async (supplierAddress: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getSupplierInvoices',
        args: [supplierAddress as Address],
      }) as bigint[] | undefined;
      
      return result?.map(id => Number(id)) || [];
    } catch (error) {
      console.error('Error getting supplier invoices:', error);
      return [];
    }
  }, [publicClient]);
  
  // Get invoice status only
  const getInvoiceStatus = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoiceStatus',
        args: [BigInt(invoiceId)],
      }) as number | undefined;
      
      return result !== undefined ? result : null;
    } catch (error) {
      console.error('Error getting invoice status:', error);
      return null;
    }
  }, [publicClient]);
  
  // Check if invoice is verified
  const isInvoiceVerified = useCallback(async (invoiceId: string) => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'isInvoiceVerified',
        args: [BigInt(invoiceId)],
      }) as boolean | undefined;
      
      return result || false;
    } catch (error) {
      console.error('Error checking if invoice is verified:', error);
      return false;
    }
  }, [publicClient]);
  
  // Get contract version
  const getVersion = useCallback(async () => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'version',
      }) as string | undefined;
      
      return result;
    } catch (error) {
      console.error('Error getting version:', error);
      return null;
    }
  }, [publicClient]);
  
  // Get contract info
  const getContractInfo = useCallback(async () => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getContractInfo',
      }) as [string, string, string, boolean, bigint] | undefined;
      
      if (!result) return null;
      
      const [name, version, owner, paused, totalInvoices] = result;
      
      return {
        name,
        version,
        owner,
        paused,
        totalInvoices: Number(totalInvoices),
      };
    } catch (error) {
      console.error('Error getting contract info:', error);
      return null;
    }
  }, [publicClient]);
  
  // Initialize protocol (admin function)
  const initializeProtocol = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('⚙️ Initializing protocol...');
      
      const tx = await writeYieldXCore({
        address: CONTRACT_ADDRESSES.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'initializeProtocol',
      });
      
      console.log('✅ Protocol initialized! TX:', tx);
      return { success: true, txHash: tx };
      
    } catch (error) {
      console.error('❌ Error initializing protocol:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize protocol');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [writeYieldXCore]);
  
  // ============ HELPER FUNCTIONS ============
  
  // Get invoice status name
  const getInvoiceStatusName = useCallback((status: number) => {
    const statusNames = [
      "Submitted",     // 0
      "Verifying",     // 1
      "Verified",      // 2
      "FullyFunded",   // 3
      "Approved",      // 4
      "Funded",        // 5
      "Repaid",        // 6
      "Defaulted",     // 7
      "Rejected"       // 8
    ];
    
    return statusNames[status] || 'Unknown';
  }, []);
  
  // Debug function to check entire flow
  const debugInvoiceFlow = useCallback(async () => {
    console.log("🔍 DEBUGGING YIELDX INVOICE FLOW");
    console.log("=====================================");
    
    try {
      const totalInvoices = invoiceCounter || 0;
      console.log(`📊 Total invoices submitted: ${totalInvoices}`);
      
      if (totalInvoices === 0) {
        console.log("❌ No invoices found! Submit an invoice first.");
        return;
      }
      
      console.log("\n📋 Checking invoice statuses:");
      const statusNames = [
        "Submitted", "Verifying", "Verified", "FullyFunded", 
        "Approved", "Funded", "Repaid", "Defaulted", "Rejected"
      ];
      
      for (let i = 1; i <= totalInvoices; i++) {
        try {
          console.log(`\n🔍 Invoice ${i}:`);
          
          const basics = await getInvoiceBasics(i.toString());
          if (!basics) {
            console.log(`  ❌ Could not get basic info for invoice ${i}`);
            continue;
          }
          
          console.log(`  Status: ${basics.status} (${statusNames[basics.status] || 'Unknown'})`);
          console.log(`  Amount: ${(basics.amount / 1e6).toFixed(2)} USDC`);
          console.log(`  Supplier: ${basics.supplier}`);
          
          const verification = await getVerificationData(i.toString());
          if (verification) {
            console.log(`  Verification - Completed: ${verification.verified}, Valid: ${verification.valid}`);
            console.log(`  Risk Score: ${verification.risk}, Rating: ${verification.rating}`);
            console.log(`  Details: ${verification.details}`);
          } else {
            console.log(`  ❌ No verification data found`);
          }
          
          if (basics.status === 2) {
            console.log(`  ✅ Invoice ${i} should be available for investment!`);
          } else if (basics.status === 1) {
            console.log(`  ⏳ Invoice ${i} is stuck in verification...`);
          } else {
            console.log(`  ℹ️ Invoice ${i} not ready for investment (status: ${statusNames[basics.status]})`);
          }
          
        } catch (error) {
          console.log(`  ❌ Error checking invoice ${i}:`, error);
        }
      }
      
      console.log("\n💰 Checking investment opportunities:");
      const opportunities = await getInvestmentOpportunities();
      console.log(`Available opportunities: ${opportunities.length}`);
      console.log(`Invoice IDs: [${opportunities.join(', ')}]`);
      
      if (opportunities.length === 0) {
        console.log("❌ No investment opportunities found!");
        console.log("🔧 Possible issues:");
        console.log("  - Invoices stuck in 'Verifying' status (verification callback failed)");
        console.log("  - Verification module core contract not set correctly");
        console.log("  - Chainlink Functions not completing");
      }
      
    } catch (error) {
      console.error("❌ Debug failed:", error);
    }
  }, [
    invoiceCounter,
    getInvoiceBasics,
    getVerificationData,
    getInvestmentOpportunities
  ]);
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

    getCompleteInvestmentDetails,
  getAllInvestmentOpportunities,
  getInvestorPortfolio,
    
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
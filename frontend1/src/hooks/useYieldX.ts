// src/hooks/useYieldX.ts - Updated with YOUR LATEST ENHANCED SEPOLIA DEPLOYMENT
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, getAddress } from 'viem';
import { MarketData, SubmitInvoiceForm, TransactionResult } from '../types';

// Import your deployed ABIs
import YieldXCoreArtifact from '../abis/YieldXCore.json';
import MockUSDCArtifact from '../abis/MockUSDC.json';
import YieldXInvoiceNFTArtifact from '../abis/YieldXInvoiceNFT.json';
import YieldXPriceManagerFixedArtifact from '../abis/YieldXPriceManager.json';
import YieldXRiskCalculatorArtifact from '../abis/YieldXRiskCalculator.json';
import ChainlinkFallbackContractArtifact from '../abis/ChainlinkFallbackContract.json';

// ✅ YOUR LATEST ENHANCED SEPOLIA DEPLOYMENT ADDRESSES (From your enhanced deployment output)
const CONTRACTS = {
  PROTOCOL: getAddress("0x4762a004b38eE4b464597AB3441Db52F19803f45"),      // ✅ Enhanced YieldXCore
  MOCK_USDC: getAddress("0x73B03360f6d0F69Be602d8f2cdEF05F9025f0814"),     // ✅ MockUSDC
  INVOICE_NFT: getAddress("0xF9F53b06E6Ece41f28232267F31CcE195A20139f"),   // ✅ YieldXInvoiceNFT
  PRICE_MANAGER: getAddress("0xdb4Cce7bc16EA405CF9f4c1F4293D738e376bfC2"), // ✅ YieldXPriceManagerFixed
  RISK_CALCULATOR: getAddress("0x9397E1D7e6A4326b994D1fe640a353dee3AEeC68"), // ✅ YieldXRiskCalculator
  FALLBACK_CONTRACT: getAddress("0x2c47b02cf0fB988dAfaC69050CF7bd039ae9AC16"), // ✅ ChainlinkFallbackContract
} as const;

console.log('🚀 USING YOUR LATEST ENHANCED SEPOLIA DEPLOYMENT:', {
  PROTOCOL: CONTRACTS.PROTOCOL,
  MOCK_USDC: CONTRACTS.MOCK_USDC,
  INVOICE_NFT: CONTRACTS.INVOICE_NFT,
  PRICE_MANAGER: CONTRACTS.PRICE_MANAGER,
  RISK_CALCULATOR: CONTRACTS.RISK_CALCULATOR,
  FALLBACK_CONTRACT: CONTRACTS.FALLBACK_CONTRACT,
});

// Extract ABIs from your actual artifacts
const YieldXCoreABI = YieldXCoreArtifact.abi;
const MockUSDCABI = MockUSDCArtifact.abi;
const YieldXInvoiceNFTABI = YieldXInvoiceNFTArtifact.abi;
const YieldXPriceManagerFixedABI = YieldXPriceManagerFixedArtifact.abi;
const YieldXRiskCalculatorABI = YieldXRiskCalculatorArtifact.abi;
const ChainlinkFallbackContractABI = ChainlinkFallbackContractArtifact.abi;

// Enhanced types for your contract structure
export interface VotingDetails {
  yesVotes: number;
  totalVotes: number;
  isApproved: boolean;
}

export interface InvoiceDetails {
  id: number;
  supplier: string;
  buyer: string;
  amount: number;
  commodity: string;
  supplierCountry: string;
  buyerCountry: string;
  exporterName: string;
  buyerName: string;
  dueDate: number;
  aprBasisPoints: number;
  status: number; // 0=Submitted, 1=UnderReview, 2=Approved, 3=Funded, 4=Repaid, 5=Defaulted
  vrfFulfilled: boolean;
}

export interface LivePriceData {
  ethPrice: number;
  usdcPrice: number;
  btcPrice: number;
  linkPrice: number;
  lastUpdate: number;
  marketVolatility: number;
  initialPricesFetched: boolean;
}

export interface ProtocolStats {
  totalInvoices: number;
  totalCommitteeMembers: number;
  totalFundsRaised: number;
  pendingInvoices: number;
  approvedInvoices: number;
  fundedInvoices: number;
}

export interface ChainlinkData {
  vrfRandomness: string;
  commodityPrice: string;
  countryRiskScore: string;
  chainlinkVerified: boolean;
  ethPrice: string;
  btcPrice: string;
  linkPrice: string;
  usdcPrice: string;
}

export function useYieldX() {
  const { address, isConnected, chain } = useAccount();
  const { writeContractAsync, isPending: isWritePending, error: writeError } = useWriteContract();
  const publicClient = usePublicClient();
  
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);
  const [committeeRole, setCommitteeRole] = useState<string>('');

  // Read USDC balance
  const { 
    data: rawUsdcBalance, 
    error: balanceError, 
    refetch: refetchBalance,
    isLoading: isBalanceLoading 
  } = useReadContract({
    address: CONTRACTS.MOCK_USDC,
    abi: MockUSDCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      staleTime: 0,
      gcTime: 0,
      refetchInterval: 3000,
      refetchIntervalInBackground: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    }
  });

  // Read invoice counter for protocol stats
  const { data: invoiceCounter, refetch: refetchStats } = useReadContract({
    address: CONTRACTS.PROTOCOL,
    abi: YieldXCoreABI,
    functionName: 'invoiceCounter',
  });

  // Check if user is committee member
  const { data: isUserCommitteeMember, refetch: refetchCommitteeStatus } = useReadContract({
    address: CONTRACTS.PROTOCOL,
    abi: YieldXCoreABI,
    functionName: 'committeeMembers',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // 🆕 Get committee members list using enhanced function
  const { data: committeeMembers, refetch: refetchCommitteeMembers } = useReadContract({
    address: CONTRACTS.PROTOCOL,
    abi: YieldXCoreABI,
    functionName: 'getCommitteeMembers',
  });

  // 🆕 Get protocol statistics using enhanced function
  const { data: protocolStats, refetch: refetchProtocolStats } = useReadContract({
    address: CONTRACTS.PROTOCOL,
    abi: YieldXCoreABI,
    functionName: 'getProtocolStats',
  });

  // Check if user is owner
  const { data: contractOwner } = useReadContract({
    address: CONTRACTS.PROTOCOL,
    abi: YieldXCoreABI,
    functionName: 'owner',
  });

  // Get live price data from your PriceManagerFixed
  const { data: livePrices, refetch: refetchPrices } = useReadContract({
    address: CONTRACTS.PRICE_MANAGER,
    abi: YieldXPriceManagerFixedABI,
    functionName: 'getLatestPrices',
  });

  // Get market volatility
  const { data: marketVolatility } = useReadContract({
    address: CONTRACTS.PRICE_MANAGER,
    abi: YieldXPriceManagerFixedABI,
    functionName: 'calculateMarketVolatility',
  });

  // Check if initial prices were fetched from Chainlink
  const { data: initialPricesFetched } = useReadContract({
    address: CONTRACTS.PRICE_MANAGER,
    abi: YieldXPriceManagerFixedABI,
    functionName: 'initialPricesFetched',
  });

  // Wait for transaction
  const { 
    isLoading: isTransactionLoading, 
    isSuccess: isTransactionSuccess,
    data: transactionReceipt 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check user permissions
  const isCommitteeMember = Boolean(isUserCommitteeMember);
  const isOwner = Boolean(contractOwner && address && contractOwner.toLowerCase() === address.toLowerCase());

  // Set committee role based on user status
  useEffect(() => {
    if (isOwner) {
      setCommitteeRole('Protocol Owner');
    } else if (isCommitteeMember) {
      setCommitteeRole('Committee Member');
    } else {
      setCommitteeRole('User');
    }
  }, [isOwner, isCommitteeMember]);

  // Refresh when transaction succeeds
  useEffect(() => {
    if (isTransactionSuccess && transactionReceipt) {
      console.log('🎉 Transaction confirmed! Refreshing data...');
      
      const refreshAttempts = [500, 1000, 2000, 3000, 5000];
      
      refreshAttempts.forEach((delay, index) => {
        setTimeout(async () => {
          console.log(`🔄 Refresh attempt ${index + 1}/${refreshAttempts.length}`);
          await refetchBalance();
          await refetchStats();
          await refetchCommitteeStatus();
          await refetchCommitteeMembers(); // 🆕 Refresh committee members
          await refetchProtocolStats(); // 🆕 Refresh protocol stats
          await refetchPrices();
          setForceRefreshCounter(prev => prev + 1);
        }, delay);
      });
    }
  }, [isTransactionSuccess, transactionReceipt, refetchBalance, refetchStats, refetchCommitteeStatus, refetchCommitteeMembers, refetchProtocolStats, refetchPrices]);

  // Manual refresh
  const refreshBalance = useCallback(async () => {
    console.log('🔄 Manual balance refresh:', CONTRACTS.MOCK_USDC);
    setForceRefreshCounter(prev => prev + 1);
    
    try {
      const result = await refetchBalance();
      console.log('✅ Refresh result:', result.data?.toString());
      return result;
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      throw error;
    }
  }, [refetchBalance]);

  // Get formatted balance
  const usdcBalance = rawUsdcBalance ? formatUnits(rawUsdcBalance as bigint, 6) : '0';

  // Format live price data from your contracts
  const liveMarketData: LivePriceData = {
    ethPrice: livePrices ? Number(livePrices[0]) / 1e8 : 3200,
    usdcPrice: livePrices ? Number(livePrices[1]) / 1e8 : 1.0,
    btcPrice: livePrices ? Number(livePrices[2]) / 1e8 : 65000,
    linkPrice: livePrices ? Number(livePrices[3]) / 1e8 : 25,
    lastUpdate: livePrices ? Number(livePrices[4]) : Date.now() / 1000,
    marketVolatility: marketVolatility ? Number(marketVolatility) / 100 : 0.5,
    initialPricesFetched: Boolean(initialPricesFetched),
  };

  // 🆕 Format protocol statistics
  const stats: ProtocolStats = protocolStats ? {
    totalInvoices: Number(protocolStats[0]),
    totalCommitteeMembers: Number(protocolStats[1]),
    totalFundsRaised: Number(formatUnits(protocolStats[2] as bigint, 6)),
    pendingInvoices: Number(protocolStats[3]),
    approvedInvoices: Number(protocolStats[4]),
    fundedInvoices: Number(protocolStats[5]),
  } : {
    totalInvoices: invoiceCounter ? Number(invoiceCounter) : 0,
    totalCommitteeMembers: committeeMembers ? (committeeMembers as any[]).length : 0,
    totalFundsRaised: 0,
    pendingInvoices: 0,
    approvedInvoices: 0,
    fundedInvoices: 0,
  };

  // Enhanced mint function
  const mintTestUSDC = useCallback(async (amount: string = '10000'): Promise<TransactionResult> => {
    console.log('🪙 Minting USDC:', CONTRACTS.MOCK_USDC);
    
    if (!isConnected || !address) {
      return { hash: '', success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const amountWei = parseUnits(amount, 6);
      
      console.log('🚀 Mint details:', {
        contractAddress: CONTRACTS.MOCK_USDC,
        to: address,
        amount,
        amountWei: amountWei.toString()
      });

      const hash = await writeContractAsync({
        address: CONTRACTS.MOCK_USDC,
        abi: MockUSDCABI,
        functionName: 'mint',
        args: [address, amountWei],
      });

      console.log('✅ Mint transaction submitted:', hash);
      setTxHash(hash);
      
      return { hash, success: true };
    } catch (error: any) {
      console.error('❌ Mint failed:', error);
      return {
        hash: '',
        success: false,
        error: error.shortMessage || error.message || 'Minting failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, writeContractAsync]);

  // Approve USDC spending
  const approveUSDC = useCallback(async (spender: string, amount: string): Promise<TransactionResult> => {
    if (!isConnected || !address) {
      return { hash: '', success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const amountWei = parseUnits(amount, 6);
      const hash = await writeContractAsync({
        address: CONTRACTS.MOCK_USDC,
        abi: MockUSDCABI,
        functionName: 'approve',
        args: [spender, amountWei],
      });
      setTxHash(hash);
      return { hash, success: true };
    } catch (error: any) {
      return {
        hash: '',
        success: false,
        error: error.shortMessage || error.message || 'Approval failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, writeContractAsync]);

  // Submit invoice - Updated for your enhanced contract structure
  const submitInvoice = useCallback(async (formData: SubmitInvoiceForm & { originCountry?: string; buyer?: string }): Promise<TransactionResult> => {
    console.log('📄 Submitting invoice to enhanced protocol:', CONTRACTS.PROTOCOL);
    
    if (!isConnected || !address) {
      return { hash: '', success: false, error: 'Wallet not connected' };
    }

    // Validate form data before submission
    if (!formData.commodity || !formData.amount || !formData.exporterName || !formData.buyerName) {
      return { hash: '', success: false, error: 'Required fields missing' };
    }

    setLoading(true);
    try {
      const amountWei = parseUnits(formData.amount, 6);
      const dueDate = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
      
      // Use provided buyer or connected address as default
      const buyerAddress = formData.buyer || address;
      
      console.log('🚀 Enhanced invoice submission details:', {
        buyer: buyerAddress,
        amount: formData.amount,
        commodity: formData.commodity,
        supplierCountry: formData.originCountry || 'kenya',
        buyerCountry: formData.destination || 'usa',
        exporterName: formData.exporterName,
        buyerName: formData.buyerName,
        dueDate,
      });

      const hash = await writeContractAsync({
        address: CONTRACTS.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'submitInvoice',
        args: [
          buyerAddress,                          // buyer address
          amountWei,                            // amount
          formData.commodity,                   // commodity
          formData.originCountry || 'kenya',    // supplierCountry
          formData.destination || 'usa',        // buyerCountry
          formData.exporterName,                // exporterName
          formData.buyerName,                   // buyerName
          BigInt(dueDate),                     // dueDate
        ],
        gas: BigInt(500000),
      });

      console.log('✅ Enhanced invoice submitted:', hash);
      setTxHash(hash);
      
      return { hash, success: true };
      
    } catch (error: any) {
      console.error('❌ Submit failed:', error);
      
      let errorMessage = error.shortMessage || error.message || 'Submission failed';
      
      if (errorMessage.includes('execution reverted')) {
        errorMessage = 'Contract execution reverted. Check all requirements are met.';
      } else if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees';
      }
      
      return {
        hash: '',
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, writeContractAsync]);

  // Add committee member (Owner only) - Enhanced
  const addCommitteeMember = useCallback(async (memberAddress: string): Promise<TransactionResult> => {
    console.log('👥 Adding committee member to enhanced contract:', memberAddress);
    
    if (!isConnected || !address) {
      return { hash: '', success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'addCommitteeMember',
        args: [memberAddress],
      });

      console.log('✅ Committee member added to enhanced contract:', hash);
      setTxHash(hash);
      
      return { hash, success: true };
    } catch (error: any) {
      console.error('❌ Add committee member failed:', error);
      return {
        hash: '',
        success: false,
        error: error.shortMessage || error.message || 'Failed to add committee member',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, writeContractAsync]);

  // 🆕 Remove committee member (Owner only) - Now implemented!
  const removeCommitteeMember = useCallback(async (memberAddress: string): Promise<TransactionResult> => {
    console.log('👥 Removing committee member from enhanced contract:', memberAddress);
    
    if (!isConnected || !address) {
      return { hash: '', success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'removeCommitteeMember',
        args: [memberAddress],
      });

      console.log('✅ Committee member removed from enhanced contract:', hash);
      setTxHash(hash);
      
      return { hash, success: true };
    } catch (error: any) {
      console.error('❌ Remove committee member failed:', error);
      return {
        hash: '',
        success: false,
        error: error.shortMessage || error.message || 'Failed to remove committee member',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, writeContractAsync]);

  // 🆕 Get enhanced invoice details
  const getInvoiceDetails = useCallback(async (invoiceId: number): Promise<InvoiceDetails | null> => {
    if (!publicClient) return null;

    try {
      console.log(`🔍 Fetching enhanced invoice details for ID ${invoiceId}`);
      
      const result = await publicClient.readContract({
        address: CONTRACTS.PROTOCOL,
        abi: YieldXCoreABI,
        functionName: 'getInvoiceDetails',
        args: [BigInt(invoiceId)],
      });
      
      if (result && Array.isArray(result)) {
        const data = result as any[];
        console.log(`✅ Enhanced invoice ${invoiceId} details:`, data);
        
        return {
          id: Number(data[0]),
          supplier: data[1] as string,
          buyer: data[2] as string,
          amount: Number(formatUnits(data[3] as bigint, 6)),
          commodity: data[4] as string,
          supplierCountry: data[5] as string,
          buyerCountry: data[6] as string,
          exporterName: data[7] as string,
          buyerName: data[8] as string,
          dueDate: Number(data[9]),
          aprBasisPoints: Number(data[10]),
          status: Number(data[12]),
          vrfFulfilled: Boolean(data[15]),
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error fetching enhanced invoice ${invoiceId}:`, error);
      return null;
    }
  }, [publicClient]);

  // Update live prices from Chainlink
  const updateLivePrices = useCallback(async (): Promise<TransactionResult> => {
    console.log('📊 Updating live prices from Chainlink...');
    
    if (!isConnected || !address) {
      return { hash: '', success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PRICE_MANAGER,
        abi: YieldXPriceManagerFixedABI,
        functionName: 'updateLivePrices',
        args: [],
      });

      console.log('✅ Price update triggered:', hash);
      setTxHash(hash);
      
      return { hash, success: true };
    } catch (error: any) {
      console.error('❌ Price update failed:', error);
      return {
        hash: '',
        success: false,
        error: error.shortMessage || error.message || 'Price update failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, writeContractAsync]);

  // Force update live prices (bypasses staleness check)
  const forceUpdateLivePrices = useCallback(async (): Promise<TransactionResult> => {
    console.log('🔄 Force updating live prices...');
    
    if (!isConnected || !address) {
      return { hash: '', success: false, error: 'Wallet not connected' };
    }

    setLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.PRICE_MANAGER,
        abi: YieldXPriceManagerFixedABI,
        functionName: 'forceUpdateLivePrices',
        args: [],
      });

      console.log('✅ Force price update triggered:', hash);
      setTxHash(hash);
      
      return { hash, success: true };
    } catch (error: any) {
      console.error('❌ Force price update failed:', error);
      return {
        hash: '',
        success: false,
        error: error.shortMessage || error.message || 'Force price update failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, writeContractAsync]);

  // Test individual price feeds
  const testPriceFeeds = useCallback(async () => {
    if (!publicClient) return null;

    try {
      const ethFeed = await publicClient.readContract({
        address: CONTRACTS.PRICE_MANAGER,
        abi: YieldXPriceManagerFixedABI,
        functionName: 'testEthFeed',
      });

      const btcFeed = await publicClient.readContract({
        address: CONTRACTS.PRICE_MANAGER,
        abi: YieldXPriceManagerFixedABI,
        functionName: 'testBtcFeed',
      });

      return {
        ethFeed: ethFeed as any[],
        btcFeed: btcFeed as any[],
      };
    } catch (error) {
      console.error('❌ Error testing price feeds:', error);
      return null;
    }
  }, [publicClient]);

  // Debug logging
  useEffect(() => {
    console.log('🚀 Enhanced YieldX Hook State:', {
      contractAddresses: CONTRACTS,
      userAddress: address,
      chainId: chain?.id,
      usdcBalance: Number(usdcBalance),
      isCommitteeMember,
      isOwner,
      committeeRole,
      committeeMembers: committeeMembers as string[] || [],
      liveMarketData,
      stats,
      refreshCounter: forceRefreshCounter,
    });
  }, [address, chain, usdcBalance, isCommitteeMember, isOwner, committeeRole, committeeMembers, liveMarketData, stats, forceRefreshCounter]);

  return {
    // Connection state
    isConnected,
    address,
    chain,
    loading: loading || isWritePending || isTransactionLoading,
    
    // Balance data
    usdcBalance: Number(usdcBalance),
    refreshBalance,
    balanceRefreshKey: forceRefreshCounter,
    isBalanceLoading,
    
    // Live market data from your contracts
    liveMarketData,
    stats,
    
    // User permissions
    isCommitteeMember,
    isOwner,
    committeeRole,
    committeeMembers: committeeMembers as string[] || [], // 🆕 Real committee members array
    
    // Transaction state
    isTransactionSuccess,
    txHash,
    
    // Core functions
    submitInvoice,
    mintTestUSDC,
    
    // 🆕 Enhanced committee functions
    addCommitteeMember,
    removeCommitteeMember, // Now implemented!
    
    // Price functions
    updateLivePrices,
    forceUpdateLivePrices,
    testPriceFeeds,
    
    // 🆕 Enhanced data functions
    getInvoiceDetails, // Now returns enhanced data
    
    // Debug info
    writeError,
    balanceError,
    
    // Contract addresses
    contracts: CONTRACTS,
    
    // Utility functions
    approveUSDC,
  };
}
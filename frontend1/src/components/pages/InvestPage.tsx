// Fixed InvestPage with Proper TypeScript Types & Null Safety
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Clock, ExternalLink, Loader2, RefreshCw, TrendingUp, DollarSign, AlertCircle, FileText, Zap, CheckCircle, MapPin, Building, Users, X, Check, AlertTriangle } from 'lucide-react';
import { useYieldX } from '../../hooks/useYieldX';

// ✅ FIXED: Updated interfaces with proper optional/required properties
interface InvestmentOpportunity {
  id: number; // Required - must exist
  status: number;
  supplier: string;
  buyer: string;
  totalAmount: number;
  targetFunding: number;
  currentFunding: number;
  remainingFunding: number;
  fundingProgress: number;
  apr: number;
  aprBasisPoints?: number; // Optional
  numInvestors: number;
  minInvestment: number;
  maxInvestment: number;
  commodity: string;
  exporterName: string;
  buyerName: string;
  supplierCountry: string;
  buyerCountry: string;
  daysToMaturity: number;
  submittedDate?: number; // Optional
  dueDate?: number; // Optional
  documentVerified: boolean;
  riskScore: number;
  riskCategory: string;
  creditRating: string;
  isAvailable: boolean;
  isFullyFunded?: boolean; // Optional
  tradeDuration?: number; // Optional
  formatted: {
    totalAmount: string;
    targetFunding: string;
    currentFunding: string;
    remainingFunding: string;
    apr: string;
    fundingProgress: string;
    tradeRoute: string;
    dueDate: string;
  };
}

interface PortfolioInvestment {
  id: number; // Required - must exist
  status: number;
  supplier: string;
  buyer: string;
  totalAmount: number;
  targetFunding: number;
  currentFunding: number;
  remainingFunding: number;
  fundingProgress: number;
  apr: number;
  aprBasisPoints?: number; // Optional
  numInvestors: number;
  minInvestment: number;
  maxInvestment: number;
  commodity: string;
  exporterName: string;
  buyerName: string;
  supplierCountry: string;
  buyerCountry: string;
  daysToMaturity: number;
  submittedDate?: number; // Optional
  dueDate?: number; // Optional
  documentVerified: boolean;
  riskScore: number;
  riskCategory: string;
  creditRating: string;
  isAvailable: boolean;
  isFullyFunded?: boolean; // Optional
  tradeDuration?: number; // Optional
  formatted?: { // Optional - might not exist initially
    totalAmount: string;
    targetFunding: string;
    currentFunding: string;
    remainingFunding: string;
    apr: string;
    fundingProgress: string;
    tradeRoute: string;
    dueDate: string;
  };
  investment: {
    amount: number;
    share: number;
    potentialReturn: number;
    potentialProfit: number;
    formatted: {
      amount: string;
      share: string;
      potentialReturn: string;
      potentialProfit: string;
    };
  };
}

interface TransactionStatus {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  txHash?: string;
  show: boolean;
}

// ✅ FIXED: Helper function to safely check if object is valid opportunity
const isValidOpportunity = (opp: any): opp is InvestmentOpportunity => {
  return opp && 
         typeof opp === 'object' && 
         typeof opp.id === 'number' && 
         typeof opp.status === 'number' &&
         opp.status === 2 && // Only verified invoices
         typeof opp.remainingFunding === 'number' &&
         opp.remainingFunding > 0; // Only invoices with remaining funding
};

// ✅ FIXED: Helper function to safely check if object is valid portfolio investment
const isValidPortfolioInvestment = (inv: any): inv is PortfolioInvestment => {
  return inv && 
         typeof inv === 'object' && 
         typeof inv.id === 'number' && 
         inv.investment &&
         typeof inv.investment === 'object' &&
         typeof inv.investment.amount === 'number' &&
         inv.investment.amount > 0;
};

const InvestPage: React.FC = () => {
  const {
    isConnected,
    address,
    isLoading,
    protocolStats,
    usdcBalance,
    getAllInvestmentOpportunities,
    getInvestorPortfolio,
    investInInvoice,
    approveUSDC,
    getUSDCAllowance,
    mintTestUSDC,
    contractAddresses,
    refreshBalance,
  } = useYieldX();

  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [processingStep, setProcessingStep] = useState<'idle' | 'checking' | 'approving' | 'investing'>('idle');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    type: 'info',
    message: '',
    show: false,
  });

  const showStatus = useCallback((type: TransactionStatus['type'], message: string, txHash?: string) => {
    setTransactionStatus({ type, message, txHash, show: true });
    if (type === 'success') {
      setTimeout(() => setTransactionStatus(prev => ({ ...prev, show: false })), 5000);
    }
  }, []);

  // ✅ FIXED: Enhanced data loading with proper null safety
  const loadData = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    if (!getAllInvestmentOpportunities || !getInvestorPortfolio) {
      console.log('❌ Required functions not available');
      showStatus('warning', 'Some required functions are not available. Please check your useYieldX hook.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('📊 Loading investment opportunities and portfolio...');
      
      const [opportunitiesData, portfolioData] = await Promise.all([
        getAllInvestmentOpportunities(),
        address ? getInvestorPortfolio(address) : Promise.resolve([])
      ]);
      
      console.log('✅ Loaded opportunities:', opportunitiesData);
      console.log('✅ Loaded portfolio:', portfolioData);
      
      // ✅ FIXED: Enhanced data validation and formatting with proper type guards
      const validOpportunities = (opportunitiesData || [])
        .filter(isValidOpportunity) // Use type guard function
        .map((opp): InvestmentOpportunity => {
          const safeOpp = opp!;
          return {
            ...safeOpp,
            // Set defaults for optional properties
            aprBasisPoints: safeOpp.aprBasisPoints ?? Math.floor((safeOpp.apr || 0) * 100),
            submittedDate: safeOpp.submittedDate ?? Math.floor(Date.now() / 1000),
            dueDate: safeOpp.dueDate ?? Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            isFullyFunded: safeOpp.isFullyFunded ?? (safeOpp.remainingFunding <= 0),
            tradeDuration: safeOpp.tradeDuration ?? 30,
            // Set defaults for required properties that might be missing
            minInvestment: safeOpp.minInvestment || 100,
            maxInvestment: safeOpp.maxInvestment || safeOpp.remainingFunding || 0,
            riskCategory: safeOpp.riskCategory || 'Medium',
            creditRating: safeOpp.creditRating || 'N/A',
            daysToMaturity: safeOpp.daysToMaturity || 0,
            formatted: {
              totalAmount: safeOpp.formatted?.totalAmount || `$${(safeOpp.totalAmount || 0).toLocaleString()}`,
              targetFunding: safeOpp.formatted?.targetFunding || `$${(safeOpp.targetFunding || 0).toLocaleString()}`,
              currentFunding: safeOpp.formatted?.currentFunding || `$${(safeOpp.currentFunding || 0).toLocaleString()}`,
              remainingFunding: safeOpp.formatted?.remainingFunding || `$${(safeOpp.remainingFunding || 0).toLocaleString()}`,
              apr: safeOpp.formatted?.apr || `${(safeOpp.apr || 0).toFixed(2)}%`,
              fundingProgress: safeOpp.formatted?.fundingProgress || `${(safeOpp.fundingProgress || 0).toFixed(1)}%`,
              tradeRoute: safeOpp.formatted?.tradeRoute || `${safeOpp.supplierCountry || ''} → ${safeOpp.buyerCountry || ''}`,
              dueDate: safeOpp.formatted?.dueDate || new Date((safeOpp.dueDate || 0) * 1000).toLocaleDateString(),
            }
          };
        });
      
      // ✅ FIXED: Portfolio processing with proper null safety
      const validPortfolio = (portfolioData || [])
        .filter(isValidPortfolioInvestment) // Use type guard function
        .map((inv): PortfolioInvestment => {
          const safeInv = inv!;
          return {
            ...safeInv,
            // Set defaults for optional properties
            aprBasisPoints: safeInv.aprBasisPoints ?? Math.floor((safeInv.apr || 0) * 100),
            submittedDate: safeInv.submittedDate ?? Math.floor(Date.now() / 1000),
            dueDate: safeInv.dueDate ?? Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            isFullyFunded: safeInv.isFullyFunded ?? (safeInv.remainingFunding <= 0),
            tradeDuration: safeInv.tradeDuration ?? 30,
            // Enhanced formatted section
            formatted: {
              totalAmount: safeInv.formatted?.totalAmount || `${(safeInv.totalAmount || 0).toLocaleString()}`,
              targetFunding: safeInv.formatted?.targetFunding || `${(safeInv.targetFunding || 0).toLocaleString()}`,
              currentFunding: safeInv.formatted?.currentFunding || `${(safeInv.currentFunding || 0).toLocaleString()}`,
              remainingFunding: safeInv.formatted?.remainingFunding || `${(safeInv.remainingFunding || 0).toLocaleString()}`,
              apr: safeInv.formatted?.apr || `${(safeInv.apr || 0).toFixed(2)}%`,
              fundingProgress: safeInv.formatted?.fundingProgress || `${(safeInv.fundingProgress || 0).toFixed(1)}%`,
              tradeRoute: safeInv.formatted?.tradeRoute || `${safeInv.supplierCountry || ''} → ${safeInv.buyerCountry || ''}`,
              dueDate: safeInv.formatted?.dueDate || new Date((safeInv.dueDate || 0) * 1000).toLocaleDateString(),
            },
            investment: {
              ...safeInv.investment,
              formatted: {
                amount: safeInv.investment.formatted?.amount || `${(safeInv.investment.amount || 0).toLocaleString()}`,
                share: safeInv.investment.formatted?.share || `${(safeInv.investment.share || 0).toFixed(2)}%`,
                potentialReturn: safeInv.investment.formatted?.potentialReturn || `${(safeInv.investment.potentialReturn || 0).toLocaleString()}`,
                potentialProfit: safeInv.investment.formatted?.potentialProfit || `${(safeInv.investment.potentialProfit || 0).toLocaleString()}`,
              }
            }
          };
        });
      
      setOpportunities(validOpportunities);
      setPortfolio(validPortfolio);

      if (validOpportunities.length === 0 && address) {
        showStatus('info', 'No investment opportunities available. Submit and verify invoices to create opportunities.');
      }
      
    } catch (error) {
      console.error('❌ Error loading investment data:', error);
      setOpportunities([]);
      setPortfolio([]);
      showStatus('error', `Failed to load investment data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, getAllInvestmentOpportunities, getInvestorPortfolio, showStatus]);

  // Refresh data with user feedback
  const handleRefresh = async () => {
    setRefreshing(true);
    showStatus('info', 'Refreshing data...');
    
    try {
      await loadData();
      if (refreshBalance) {
        await refreshBalance();
      }
      showStatus('success', 'Data refreshed successfully!');
    } catch (error) {
      showStatus('error', `Failed to refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ FIXED: Investment handler with better error handling
  const handleInvest = async (invoiceId: string, amount: string) => {
    if (!amount || !invoiceId || !investInInvoice || !approveUSDC || !getUSDCAllowance) {
      showStatus('error', 'Investment functions not available. Please check your wallet connection.');
      return;
    }

    try {
      setProcessingStep('checking');
      const amountNum = parseFloat(amount);
      
      if (isNaN(amountNum) || amountNum <= 0) {
        showStatus('error', 'Please enter a valid investment amount');
        return;
      }

      console.log(`🚀 Starting investment flow: ${amount} USDC in Invoice #${invoiceId}`);
      
      // Step 1: Check balance
      showStatus('info', 'Checking your USDC balance...');
      const userBalance = usdcBalance || 0;
      console.log(`💰 User balance: ${userBalance} USDC, Need: ${amountNum} USDC`);
      
      if (userBalance < amountNum) {
        if (userBalance < 1000) {
          // If they have very little USDC, offer to mint some
          showStatus('info', 'Low USDC balance detected. Minting 10,000 test USDC...');
          const mintResult = await mintTestUSDC('10000');
          if (!mintResult.success) {
            throw new Error('Failed to mint test USDC: ' + (mintResult.error || 'Unknown error'));
          }
          showStatus('success', 'Successfully minted 10,000 test USDC!', mintResult.txHash);
          
          // Wait a bit and refresh balance
          await new Promise(resolve => setTimeout(resolve, 3000));
          if (refreshBalance) {
            await refreshBalance();
          }
        } else {
          throw new Error(`Insufficient balance. You have ${userBalance.toFixed(2)} USDC but need ${amountNum} USDC`);
        }
      }

      // Step 2: Check allowance for CORE CONTRACT (correct - Core makes the transferFrom call)
      showStatus('info', 'Checking USDC allowance for Core Contract...');
      const allowance = await getUSDCAllowance(contractAddresses.PROTOCOL); // ✅ CORRECT: Core contract needs approval
      const amountWei = amountNum * 1e6;

      console.log(`💳 Core Contract (${contractAddresses.PROTOCOL}) allowance: ${allowance / 1e6} USDC`);
      console.log(`💳 Required: ${amountNum} USDC`);

      if (allowance < amountWei) {
        // Need approval for CORE CONTRACT
        setProcessingStep('approving');
        showStatus('info', 'Approving USDC for Core Contract. Please confirm in your wallet...');
        
        const approvalAmount = Math.max(amountNum * 5, 50000); // Approve 5x amount or 50k minimum for future investments
        console.log(`💳 Requesting approval for ${approvalAmount} USDC to Core Contract`);
        
        const approveResult = await approveUSDC(contractAddresses.PROTOCOL, approvalAmount.toString()); // ✅ CORRECT: Approve Core contract
        if (!approveResult.success) {
          throw new Error(approveResult.message || 'Failed to approve USDC');
        }
        
        showStatus('success', `USDC approved! You can now invest up to ${approvalAmount.toLocaleString()} USDC.`, approveResult.txHash);
        
        // Wait for approval to be confirmed
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Verify approval worked
        const newAllowance = await getUSDCAllowance(contractAddresses.PROTOCOL); // ✅ CORRECT: Check Core contract allowance
        console.log(`💳 New allowance after approval: ${newAllowance / 1e6} USDC`);
        
        if (newAllowance < amountWei) {
          throw new Error('Approval verification failed. Please try again.');
        }
      }

      // Step 3: Make investment through CORE CONTRACT (not Investment Module directly)
      setProcessingStep('investing');
      showStatus('info', `Making investment of ${amount} USDC. Please confirm in your wallet...`);

      // ✅ FIXED: Call Core contract's investInInvoice function, not Investment Module
      console.log('🎯 Calling Core contract investInInvoice function...');
      console.log(`📋 Core contract: ${contractAddresses.PROTOCOL}`);
      console.log(`📋 Invoice ID: ${invoiceId}`);
      console.log(`📋 Amount: ${amount} USDC`);

      const result = await investInInvoice(invoiceId, amount);

      if (result.success) {
        setProcessingStep('idle');
        showStatus('success', `Investment successful! ${amount} USDC invested in Invoice #${invoiceId}`, result.txHash);
        
        // Reset form
        setSelectedInvoice(null);
        setInvestmentAmount('');
        
        // Refresh data after a delay
        setTimeout(async () => {
          console.log('🔄 Refreshing data after investment...');
          await loadData();
          if (refreshBalance) {
            await refreshBalance();
          }
        }, 5000);
        
      } else {
        throw new Error(result.message || 'Investment transaction failed');
      }

    } catch (error) {
      console.error('❌ Investment error:', error);
      setProcessingStep('idle');
      
      let errorMessage = 'Investment failed';
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = error.message;
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user';
        } else if (error.message.includes('exceeds')) {
          errorMessage = 'Investment amount too high';
        } else if (error.message.includes('not available') || error.message.includes('not ready')) {
          errorMessage = 'Invoice not ready for investment';
        } else {
          errorMessage = error.message;
        }
      }
      
      showStatus('error', errorMessage);
    }
  };

  // Quick USDC mint for testing
  const handleMintUSDC = async () => {
    try {
      showStatus('info', 'Minting 10,000 test USDC...');
      const result = await mintTestUSDC('10000');
      if (result.success) {
        showStatus('success', 'Successfully minted 10,000 test USDC!', result.txHash);
        setTimeout(async () => {
          if (refreshBalance) await refreshBalance();
        }, 3000);
      } else {
        showStatus('error', result.error || 'Failed to mint USDC');
      }
    } catch (error) {
      showStatus('error', 'Failed to mint test USDC');
    }
  };

  // Load data on mount and when connection changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Transaction status component
  const TransactionStatusAlert = () => {
    if (!transactionStatus.show) return null;

    return (
      <div className={`fixed top-4 left-4 right-4 z-50 ${
        transactionStatus.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
        transactionStatus.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
        transactionStatus.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
        'bg-blue-100 border-blue-400 text-blue-700'
      } border rounded-lg p-4 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {transactionStatus.type === 'success' && <Check className="w-5 h-5" />}
            {transactionStatus.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {transactionStatus.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {transactionStatus.type === 'info' && <AlertCircle className="w-5 h-5" />}
            <div>
              <p className="font-medium">{transactionStatus.message}</p>
              {transactionStatus.txHash && (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${transactionStatus.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline hover:no-underline"
                >
                  View transaction ↗
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setTransactionStatus(prev => ({ ...prev, show: false }))}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Processing indicator
  const getProcessingMessage = () => {
    switch (processingStep) {
      case 'checking': return 'Checking balances and allowances...';
      case 'approving': return 'Approving USDC. Please confirm in wallet...';
      case 'investing': return 'Making investment. Please confirm in wallet...';
      default: return '';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to view investment opportunities.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TransactionStatusAlert />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          
          {/* Mobile-Optimized Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Investment Opportunities</h1>
                <p className="text-gray-600 text-sm sm:text-base">Invest in verified African trade receivables</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="text-center sm:text-right">
                  <p className="text-sm text-gray-500">Your Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">${(usdcBalance || 0).toFixed(2)} USDC</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleMintUSDC}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    🏦 Mint USDC
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Protocol Stats */}
          {protocolStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500">Funds Raised</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">${protocolStats.totalFundsRaised.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500">Available</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{opportunities.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500">Your Investments</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600">{portfolio.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 sm:p-4 col-span-2 sm:col-span-1">
                <p className="text-xs sm:text-sm text-gray-500">Verified</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">{protocolStats.verifiedInvoices}</p>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {processingStep !== 'idle' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Processing Investment</h3>
                  <p className="text-blue-700 text-sm">{getProcessingMessage()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading investment opportunities...</p>
            </div>
          )}

          {/* No Opportunities State */}
          {!loading && opportunities.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Investment Opportunities</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">There are currently no verified invoices available for investment.</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-blue-900 mb-2">📋 To create investment opportunities:</h4>
                <ol className="text-sm text-blue-800 space-y-1 text-left">
                  <li>1. Submit an invoice with trade documents</li>
                  <li>2. Complete Chainlink verification</li>
                  <li>3. Invoice becomes available for investment</li>
                </ol>
              </div>
            </div>
          )}

          {/* Investment Opportunities */}
          {!loading && opportunities.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Available Opportunities ({opportunities.length})</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 sm:p-6">
                      
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Invoice #{opportunity.id}</h3>
                            <p className="text-sm text-gray-500">{opportunity.commodity} Export</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between sm:justify-end sm:space-x-4">
                          <div className="text-center sm:text-right">
                            <p className="text-xl sm:text-2xl font-bold text-green-600">{opportunity.formatted.apr}</p>
                            <p className="text-xs sm:text-sm text-gray-500">Expected APR</p>
                          </div>
                          
                          <div className="text-center sm:text-right">
                            <p className="text-lg font-semibold text-gray-900">{opportunity.formatted.remainingFunding}</p>
                            <p className="text-xs sm:text-sm text-gray-500">Available</p>
                          </div>
                        </div>
                      </div>

                      {/* Trade Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-500">Trade Route</p>
                          <p className="font-medium">{opportunity.formatted.tradeRoute}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Maturity</p>
                          <p className="font-medium">{opportunity.daysToMaturity} days</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Risk Level</p>
                          <p className="font-medium">{opportunity.riskCategory}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Progress</p>
                          <p className="font-medium">{opportunity.formatted.fundingProgress}</p>
                        </div>
                      </div>

                      {/* Funding Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Funding Progress</span>
                          <span>{opportunity.formatted.fundingProgress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(opportunity.fundingProgress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{opportunity.formatted.currentFunding} raised</span>
                          <span>{opportunity.formatted.remainingFunding} needed</span>
                        </div>
                      </div>
                      
                      {/* Investment Section */}
                      {selectedInvoice === opportunity.id.toString() ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Invest in this opportunity</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Investment Amount (USDC)
                              </label>
                              <input
                                type="number"
                                value={investmentAmount}
                                onChange={(e) => setInvestmentAmount(e.target.value)}
                                placeholder={`Min: ${opportunity.minInvestment.toFixed(0)}`}
                                min={opportunity.minInvestment}
                                max={Math.min(opportunity.maxInvestment, usdcBalance || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                disabled={processingStep !== 'idle'}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Min: ${opportunity.minInvestment.toFixed(0)} • Max: ${Math.min(opportunity.maxInvestment, usdcBalance || 0).toFixed(2)} • Balance: ${(usdcBalance || 0).toFixed(2)} USDC
                              </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                              <button
                                onClick={() => handleInvest(opportunity.id.toString(), investmentAmount)}
                                disabled={
                                  processingStep !== 'idle' || 
                                  !investmentAmount || 
                                  parseFloat(investmentAmount) < opportunity.minInvestment ||
                                  parseFloat(investmentAmount) > Math.min(opportunity.maxInvestment, usdcBalance || 0)
                                }
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 text-base"
                              >
                                {processingStep !== 'idle' ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <DollarSign className="w-4 h-4" />
                                )}
                                <span>
                                  {processingStep !== 'idle' ? 'Processing...' : 'Invest Now'}
                                </span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedInvoice(null);
                                  setInvestmentAmount('');
                                }}
                                disabled={processingStep !== 'idle'}
                                className="px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedInvoice(opportunity.id.toString())}
                          disabled={processingStep !== 'idle'}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Invest in this Opportunity</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Section */}
          {portfolio.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Investment Portfolio ({portfolio.length})</h2>
              
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <div className="space-y-4">
                  {portfolio.map((investment) => (
                    <div key={investment.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <h4 className="font-semibold text-gray-900">Invoice #{investment.id}</h4>
                          <p className="text-sm text-gray-600">
                            Invested: {investment.investment.formatted.amount}
                          </p>
                          <p className="text-xs text-gray-500">
                            {investment.commodity} • {investment.formatted?.tradeRoute || `${investment.supplierCountry} → ${investment.buyerCountry}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Expected Return</p>
                          <p className="font-semibold text-green-600">
                            {investment.investment.formatted.potentialReturn}
                          </p>
                          <p className="text-xs text-gray-500">
                            {investment.formatted?.apr || `${(investment.apr || 0).toFixed(2)}%`} APR
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold mb-2">How YieldX Investments Work</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">1. Real Trade Finance</p>
                    <p className="opacity-90">Invest in verified invoices from African exporters backed by real trade transactions.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">2. Chainlink Verified</p>
                    <p className="opacity-90">All invoices are verified through Chainlink oracles using real trade documentation.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">3. Automated Returns</p>
                    <p className="opacity-90">Earn yield when buyers pay invoices, with returns automatically distributed to investors.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default InvestPage;
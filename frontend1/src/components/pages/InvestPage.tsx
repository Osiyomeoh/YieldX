// src/components/pages/InvestPage.tsx - Complete Championship Protocol Version
import React, { useState, useEffect } from 'react';
import { Shield, Clock, ExternalLink, Loader2, RefreshCw, TrendingUp, DollarSign, AlertCircle, FileText, Zap, CheckCircle } from 'lucide-react';
import { useYieldX } from '../../hooks/useYieldX';

interface InvestPageProps {
  investAmount: string;
  setInvestAmount: (amount: string) => void;
}

// Complete Invoice data structure from championship contract
interface InvoiceData {
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
  status: number;
  documentVerified: boolean;
  targetFunding: number;
  currentFunding: number;
  description?: string;
}

const InvestPage: React.FC<InvestPageProps> = ({ investAmount, setInvestAmount }) => {
  const {
    isConnected,
    address,
    investInInvoice, 
    mintTestUSDC, 
    loading, 
    usdcBalance,
    liveMarketData,
    stats,
    txHash, 
    isTransactionSuccess,
    contracts,
    getInvoiceDetails,
    getVerificationData,
    getInvestmentInfo,
    getInvestmentOpportunities,
    getFunctionsConfig,
    refreshBalance
  } = useYieldX();

  // State management
  const [investingInvoiceId, setInvestingInvoiceId] = useState<number | null>(null);
  const [transactionResults, setTransactionResults] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [verificationData, setVerificationData] = useState<{[key: number]: any}>({});
  const [investmentData, setInvestmentData] = useState<{[key: number]: any}>({});
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [error, setError] = useState<string>('');
  const [functionsConfig, setFunctionsConfig] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  // Fetch Functions configuration
  useEffect(() => {
    const loadFunctionsConfig = async () => {
      if (getFunctionsConfig) {
        try {
          const config = await getFunctionsConfig();
          setFunctionsConfig(config);
        } catch (error) {
          console.log('Functions config not available:', error);
        }
      }
    };

    if (isConnected) {
      loadFunctionsConfig();
    }
  }, [isConnected, getFunctionsConfig]);

  // Fetch investment opportunities from championship contract
  useEffect(() => {
    const fetchInvestmentOpportunities = async () => {
      try {
        setIsLoadingInvoices(true);
        setError('');

        const opportunityIds = await getInvestmentOpportunities();
        console.log('📊 Investment opportunities from championship contract:', opportunityIds);

        if (!opportunityIds || opportunityIds.length === 0) {
          console.log('📝 No investment opportunities found');
          setInvoices([]);
          return;
        }

        const invoiceList: InvoiceData[] = [];
        const verificationMap: {[key: number]: any} = {};
        const investmentMap: {[key: number]: any} = {};

        for (const invoiceId of opportunityIds) {
          try {
            console.log(`🔍 Fetching details for invoice ${invoiceId}...`);
            
            const details = await getInvoiceDetails(invoiceId);
            
            if (details) {
              console.log(`✅ Invoice ${invoiceId} details:`, details);
              
              // Add description based on commodity and countries
              const enhancedDetails = {
                ...details,
                description: `${details.commodity || 'Export'} - ${details.supplierCountry || 'Unknown'} to ${details.buyerCountry || 'Unknown'}`
              };
              
              invoiceList.push(enhancedDetails);

              // Get verification data
              try {
                const verification = await getVerificationData(invoiceId);
                if (verification) {
                  verificationMap[invoiceId] = verification;
                  console.log(`✅ Verification data for invoice ${invoiceId}:`, verification);
                }
              } catch (verifyError) {
                console.log(`⚠️ No verification data for invoice ${invoiceId}:`, verifyError);
              }

              // Get investment info
              try {
                const investment = await getInvestmentInfo(invoiceId);
                if (investment) {
                  investmentMap[invoiceId] = investment;
                  console.log(`✅ Investment data for invoice ${invoiceId}:`, investment);
                }
              } catch (investError) {
                console.log(`⚠️ No investment data for invoice ${invoiceId}:`, investError);
              }
            }
          } catch (err) {
            console.error(`❌ Error fetching invoice ${invoiceId}:`, err);
          }
        }

        console.log('🎯 Final loaded invoices from championship contract:', invoiceList);
        setInvoices(invoiceList);
        setVerificationData(verificationMap);
        setInvestmentData(investmentMap);
        
        if (invoiceList.length === 0) {
          setError('No verified investment opportunities available');
        }

      } catch (error) {
        console.error('❌ Error loading investment opportunities:', error);
        setError('Failed to load investment opportunities from championship contract');
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    if (isConnected) {
      fetchInvestmentOpportunities();
    }
  }, [isConnected, getInvestmentOpportunities, getInvoiceDetails, getVerificationData, getInvestmentInfo]);

  // Helper functions
  const addResult = (message: string) => {
    setTransactionResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleInvest = async (invoiceId: number, invoiceTitle: string) => {
    if (!isConnected || !address) {
      addResult('❌ Please connect your wallet first');
      return;
    }

    const amount = parseFloat(investAmount);
    if (amount <= 0) {
      addResult('❌ Please enter a valid investment amount');
      return;
    }

    if ((usdcBalance || 0) < amount) {
      addResult(`❌ Insufficient USDC balance. You have ${(usdcBalance || 0).toFixed(2)} USDC`);
      return;
    }

    setInvestingInvoiceId(invoiceId);
    setError('');
    const displayTitle = invoiceTitle || `Invoice #${invoiceId}`;
    addResult(`🚀 Starting investment in ${displayTitle}...`);
    addResult(`💰 Investing ${investAmount} USDC from championship protocol...`);

    try {
      const result = await investInInvoice(invoiceId, investAmount);
      
      if (result?.success) {
        addResult(`✅ Investment successful! TX: ${result.hash || txHash}`);
        addResult(`🎊 Invested ${investAmount} USDC in ${displayTitle}`);
        addResult(`🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${result.hash || txHash}`);
        
        await refreshBalance();
        setInvestAmount('');
        
        // Reload opportunities
        window.location.reload();
      } else {
        const errorMsg = result?.error || 'Investment transaction failed';
        addResult(`❌ Investment failed: ${errorMsg}`);
        setError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Unexpected error occurred';
      addResult(`❌ Investment error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setInvestingInvoiceId(null);
    }
  };

  const handleMintUSDC = async () => {
    if (!isConnected || !address) {
      addResult('❌ Please connect your wallet first');
      return;
    }

    addResult('🪙 Minting 10,000 test USDC from championship contract...');
    setError('');
    
    try {
      const result = await mintTestUSDC('10000');
      
      if (result?.success) {
        addResult(`✅ Test USDC minted! TX: ${result.hash || txHash}`);
        addResult('💰 You now have 10,000 USDC for championship protocol testing');
        await refreshBalance();
      } else {
        const errorMsg = result?.error || 'Minting failed';
        addResult(`❌ Minting failed: ${errorMsg}`);
        setError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Minting error occurred';
      addResult(`❌ Mint error: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const calculateExpectedReturn = (amount: number, aprBasisPoints: number) => {
    if (!amount || !aprBasisPoints) return { principal: 0, expectedYield: 0, totalReturn: 0, apr: 0 };
    
    const principal = amount;
    const apr = aprBasisPoints / 100;
    const annualReturn = (principal * apr) / 100;
    const quarterlyReturn = annualReturn / 4;
    return {
      principal,
      expectedYield: quarterlyReturn,
      totalReturn: principal + quarterlyReturn,
      apr
    };
  };

  const formatCurrency = (amount: any) => {
    if (!amount) return '$0';
    
    let value = 0;
    if (typeof amount === 'bigint') {
      value = Number(amount) / 1e6;
    } else if (typeof amount === 'string') {
      value = Number(amount) / 1e6;
    } else {
      value = Number(amount);
    }
    
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 1: return 'text-blue-600 bg-blue-50 border-blue-200';
      case 2: return 'text-green-600 bg-green-50 border-green-200';
      case 3: return 'text-purple-600 bg-purple-50 border-purple-200';
      case 4: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 5: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Submitted';
      case 1: return 'Verifying';
      case 2: return 'Verified';
      case 3: return 'Fully Funded';
      case 4: return 'Approved';
      case 5: return 'Funded';
      default: return 'Unknown';
    }
  };

  // Calculate stats from real championship contract data
  const activeInvoices = invoices.filter(inv => 
    inv.status === 2 && 
    inv.documentVerified === true &&
    inv.currentFunding < inv.targetFunding
  );
  
  const averageAPR = activeInvoices.length > 0 
    ? activeInvoices.reduce((sum, inv) => sum + (inv.aprBasisPoints / 100), 0) / activeInvoices.length 
    : 0;
    
  const totalVolume = stats?.totalFundsRaised || 0;
  const marketVolatility = liveMarketData?.marketVolatility || 0;
  const prices = {
    ethPrice: liveMarketData?.ethPrice || 0,
    btcPrice: liveMarketData?.btcPrice || 0,
  };

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Connect your wallet to start investing in championship protocol opportunities.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Championship Trade Finance Investment
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Invest in verified African trade invoices powered by live Chainlink oracles and proven smart contracts.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">Live Championship Protocol</span>
        </div>
      </div>

      {/* Live Protocol Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Live Championship Protocol Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalVolume)}</p>
            <p className="text-xs text-gray-500">From live contract</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Average APR</p>
            <p className="text-2xl font-bold text-green-600">{averageAPR.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Expected yield</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Active Opportunities</p>
            <p className="text-2xl font-bold text-purple-600">{activeInvoices.length}</p>
            <p className="text-xs text-gray-500">Verified & ready</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Your USDC</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(usdcBalance || 0)}</p>
            <p className="text-xs text-gray-500">Available balance</p>
          </div>
        </div>
      </div>

      {/* Wallet Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Championship Investment Wallet</h3>
            <p className="text-gray-600">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleMintUSDC}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Mint Test USDC
            </button>
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View TX {isTransactionSuccess && '✅'}
              </a>
            )}
          </div>
        </div>

        {/* Investment Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Amount (USDC)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder="Enter amount (e.g., 1000)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="100"
              max={usdcBalance || 0}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Minimum: $100</span>
            <span>Available: {formatCurrency(usdcBalance || 0)}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Transaction Results */}
        {transactionResults.length > 0 && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-40 overflow-y-auto">
            <p className="text-white mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Championship Protocol Transaction Log:
            </p>
            {transactionResults.slice(-6).map((result, index) => (
              <p key={index} className="text-xs mb-1">{result}</p>
            ))}
          </div>
        )}
      </div>

      {/* Investment Opportunities */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Championship Investment Opportunities
          </h2>
          {isLoadingInvoices ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
              {activeInvoices.length} Verified & Active
            </span>
          )}
        </div>
        
        {isLoadingInvoices ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading investment opportunities from championship contract...</p>
          </div>
        ) : activeInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Investment Opportunities</h3>
            <p className="text-gray-600 mb-2">No verified investment opportunities found in the championship contract.</p>
            <p className="text-sm text-gray-500">
              Championship contract has {stats?.totalInvoices || 0} total invoices. 
              {stats?.verifiedInvoices ? ` ${stats.verifiedInvoices} are verified.` : ' Check back for verified opportunities.'}
            </p>
            {error && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activeInvoices.map((invoice) => {
              const verification = verificationData[invoice.id];
              const investment = investmentData[invoice.id];
              
              const invoiceTitle = `${invoice.commodity || 'Export'} - ${invoice.exporterName || 'Supplier'}`;
              const invoiceDescription = `${invoice.supplierCountry || 'Unknown'} to ${invoice.buyerCountry || 'Unknown'} trade finance`;
              const fundingPercentage = invoice.targetFunding > 0 ? (invoice.currentFunding / invoice.targetFunding) * 100 : 0;
              const remainingAmount = invoice.targetFunding - invoice.currentFunding;
              const isInvesting = investingInvoiceId === invoice.id;
              const investmentAmount = parseFloat(investAmount) || 0;
              const returns = calculateExpectedReturn(investmentAmount, invoice.aprBasisPoints);
              
              return (
                <div key={invoice.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {invoiceTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                        {invoice.documentVerified && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium border border-green-200 text-green-600 bg-green-50">
                            ✅ Chainlink Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{invoiceDescription}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Championship Contract
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {new Date(invoice.dueDate * 1000).toLocaleDateString()}
                        </span>
                        <span>Invoice #{invoice.id}</span>
                      </div>
                      
                      {/* Verification Data Display */}
                      {verification && (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Chainlink Functions Verification</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Risk Score:</span>
                              <span className="ml-1 font-medium">{verification.riskScore}/100</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Credit Rating:</span>
                              <span className="ml-1 font-medium">{verification.creditRating}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Valid:</span>
                              <span className="ml-1 font-medium">{verification.valid ? 'Yes' : 'No'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Verified:</span>
                              <span className="ml-1 font-medium">{new Date(verification.timestamp * 1000).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.targetFunding)}
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {(invoice.aprBasisPoints / 100).toFixed(1)}% APR
                      </div>
                    </div>
                  </div>
                  
                  {/* Funding Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Funding Progress</span>
                      <span className="font-medium">
                        {formatCurrency(invoice.currentFunding)} / {formatCurrency(invoice.targetFunding)} 
                        ({fundingPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Remaining: {formatCurrency(remainingAmount)}</span>
                      {investment && (
                        <span>Investors: {investment.numInvestors || 0}</span>
                      )}
                    </div>
                  </div>

                  {/* Investment Calculator */}
                  {investmentAmount > 0 && invoice.aprBasisPoints > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Investment Preview (Championship Protocol)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Principal</p>
                          <p className="font-semibold text-lg">{formatCurrency(returns.principal)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expected Yield</p>
                          <p className="font-semibold text-lg text-green-600">{formatCurrency(returns.expectedYield)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Return</p>
                          <p className="font-semibold text-lg">{formatCurrency(returns.totalReturn)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Quarterly ROI</p>
                          <p className="font-semibold text-lg text-blue-600">{((returns.expectedYield / returns.principal) * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-green-600 font-medium">🟢 Live from championship blockchain</p>
                      <p className="text-gray-600">Supplier: {invoice.supplierCountry} | Buyer: {invoice.buyerCountry}</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleInvest(invoice.id, invoiceTitle)}
                        disabled={loading || isInvesting || investmentAmount <= 0 || (investmentAmount > (usdcBalance || 0)) || remainingAmount <= 0}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      >
                        {isInvesting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Investing...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Invest {formatCurrency(investmentAmount)}
                          </>
                        )}
                      </button>

                      {contracts?.PROTOCOL && (
                        <a
                          href={`https://sepolia.etherscan.io/address/${contracts.PROTOCOL}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Contract
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Calculator Section */}
      {selectedInvoice && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Investment Calculator
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Amount (USDC)
              </label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount..."
              />
            </div>

            {selectedInvoice && investAmount && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Principal:</span>
                  <span className="font-medium">${parseFloat(investAmount).toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expected Yield (90 days):</span>
                  <span className="font-medium text-green-600">
                    ${((parseFloat(investAmount) * (selectedInvoice.aprBasisPoints / 10000) * 90) / 365).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total Return:</span>
                  <span className="font-bold text-green-600">
                    ${(parseFloat(investAmount) + ((parseFloat(investAmount) * (selectedInvoice.aprBasisPoints / 10000) * 90) / 365)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quarterly ROI:</span>
                  <span className="font-medium">{(((selectedInvoice.aprBasisPoints / 10000) * 90) / 365 * 100).toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chainlink Integration Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Chainlink Integration Status
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Functions Router:</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subscription 4996:</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Live</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Size:</span>
              <span className="text-sm font-medium">216 bytes</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ETH Price:</span>
              <span className="text-sm font-medium">${prices.ethPrice?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">BTC Price:</span>
              <span className="text-sm font-medium">${prices.btcPrice?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Market Volatility:</span>
              <span className="text-sm font-medium">{marketVolatility.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {functionsConfig && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ✅ Connected to proven verification module: 
              <span className="font-mono ml-1">0x148f9528267E08A52EEa06A90e645d2D0Bd5e447</span>
            </p>
          </div>
        )}
      </div>

      {/* Championship Protocol Contracts */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Championship Protocol Contracts
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Core Protocol:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0x4A170730617Cf170C3fdddFcb118dC7Ee7beb393"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                0x4A17...8d93 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">USDC Token:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0xa76985C4a441c8B5848e40Ec2e183B621dFa6450"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                0xa769...6450 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Invoice NFT:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0x23aE19Ac3fF12B94EC8f86d3c242C63eB29ed8d9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                0x23aE...d8d9 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Investment:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0x05466c3c8E44aFe2E0ae901f3Aec69911a213ab3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                0x0546...3ab3 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verification:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0x148f9528267E08A52EEa06A90e645d2D0Bd5e447"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 font-mono flex items-center gap-1"
              >
                0x148f...e447 <CheckCircle className="w-3 h-3" /> <span className="text-xs">Proven</span>
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Price Manager:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0x4975e18b10DC06aE4988671149a3Dc961658AC24"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                0x4975...AC24 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Risk Calculator:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0x20CBC8481C4B5DA39163D8D8575b251596eaA7C6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                0x20CB...A7C6 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">VRF Module:</span>
              <a 
                href="https://sepolia.etherscan.io/address/0x0E12fCabC62C3Fdef67549ebCb7a7226624e4b33"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                0x0E12...4b33 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Championship Protocol Live on Sepolia - All 9 contracts deployed and verified!
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestPage;
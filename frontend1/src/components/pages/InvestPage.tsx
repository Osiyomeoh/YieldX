// src/components/pages/InvestPage.tsx - Updated with YieldXCore Integration
import React, { useState, useEffect } from 'react';
import { Shield, Clock, ExternalLink, Loader2, RefreshCw, TrendingUp, DollarSign, AlertCircle, FileText, Zap, CheckCircle } from 'lucide-react';
import { useYieldX } from '../../hooks/useYieldX';

interface InvestPageProps {
  investAmount: string;
  setInvestAmount: (amount: string) => void;
}

// Invoice data structure matching YieldXCore contract
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
  createdAt: number;
  documentVerified: boolean;
  targetFunding: number;
  currentFunding: number;
  remainingFunding: number;
  numInvestors: number;
}

const InvestPage: React.FC<InvestPageProps> = ({ investAmount, setInvestAmount }) => {
  const {
    isConnected,
    address,
    loading,
    usdcBalance,
    refreshBalance,
    mintTestUSDC,
    approveUSDC,
    contracts,
    liveMarketData,
    // YieldXCore functions
    getInvestmentOpportunities,
    getInvoiceBasics,
    getInvoiceParties,
    getInvoiceFinancials,
    getInvoiceLocations,
    getInvoiceMetadata,
    getInvestmentBasics,
    getInvestorInvoices,
    getInvestorData,
    investInInvoice,
    getAllInvoices
  } = useYieldX();

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [error, setError] = useState<string>('');
  const [investingInvoiceId, setInvestingInvoiceId] = useState<string | null>(null);
  const [transactionResults, setTransactionResults] = useState<string[]>([]);
  
  // Investment tracking state
  const [myInvestments, setMyInvestments] = useState<Array<{
    invoiceId: number;
    amount: number;
    investedAt: number;
    expectedReturn: number;
    daysRemaining: number;
    progress: number;
    status: 'active' | 'completed' | 'pending';
  }>>([]);

  // Fetch investment opportunities from YieldXCore
  useEffect(() => {
    const fetchDemoOpportunities = async () => {
      setIsLoadingInvoices(true);
      setError('');
      try {
        // Fetch all invoices for demo
        const allInvoiceIds = await getAllInvoices();
        const invoiceList: InvoiceData[] = [];
        for (const invoiceId of allInvoiceIds) {
          try {
            // Fetch all invoice data using YieldXCore functions
            const [basics, parties, financials, locations, metadata, investmentBasics] = await Promise.all([
              getInvoiceBasics(String(invoiceId)),
              getInvoiceParties(String(invoiceId)),
              getInvoiceFinancials(String(invoiceId)),
              getInvoiceLocations(String(invoiceId)),
              getInvoiceMetadata(String(invoiceId)),
              getInvestmentBasics(String(invoiceId))
            ]);
            if (basics && parties && financials && locations && metadata && investmentBasics) {
              const invoice: InvoiceData = {
                id: invoiceId,
                supplier: basics.supplier,
                buyer: parties.buyer,
                amount: basics.amount / 1e6, // Convert from wei to USDC
                commodity: parties.commodity,
                supplierCountry: locations.supplierCountry,
                buyerCountry: locations.buyerCountry,
                exporterName: parties.exporterName,
                buyerName: parties.buyerName,
                dueDate: financials.dueDate,
                aprBasisPoints: financials.aprBasisPoints,
                status: basics.status,
                createdAt: metadata.createdAt,
                documentVerified: metadata.documentVerified,
                targetFunding: financials.targetFunding / 1e6, // Convert from wei
                currentFunding: financials.currentFunding / 1e6, // Convert from wei
                remainingFunding: investmentBasics.remainingFunding / 1e6, // Convert from wei
                numInvestors: investmentBasics.numInvestors
              };
              invoiceList.push(invoice);
            }
          } catch (err) {
            // skip invoice if error
          }
        }
        setInvoices([
          ...invoiceList,
          {
            id: 10001,
            supplier: '0xDemoSupplier1',
            buyer: '0xDemoBuyer1',
            amount: 50000,
            commodity: 'Coffee',
            supplierCountry: 'Kenya',
            buyerCountry: 'USA',
            exporterName: 'Demo Exporter Ltd',
            buyerName: 'Demo Importer Inc',
            dueDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90,
            aprBasisPoints: 800,
            status: 2, // Verified
            createdAt: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 5,
            documentVerified: true,
            targetFunding: 45000,
            currentFunding: 20000,
            remainingFunding: 25000,
            numInvestors: 3
          },
          {
            id: 10002,
            supplier: '0xDemoSupplier2',
            buyer: '0xDemoBuyer2',
            amount: 120000,
            commodity: 'Cocoa',
            supplierCountry: 'Ghana',
            buyerCountry: 'Germany',
            exporterName: 'Ghana Cocoa Exports',
            buyerName: 'Berlin Choco GmbH',
            dueDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 120,
            aprBasisPoints: 950,
            status: 2, // Verified
            createdAt: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 10,
            documentVerified: true,
            targetFunding: 108000,
            currentFunding: 50000,
            remainingFunding: 58000,
            numInvestors: 5
          }
        ]);
        if (invoiceList.length === 0) {
          setError('Showing demo investment opportunities');
        }
      } catch (err) {
        setError('Failed to load invoices');
      } finally {
        setIsLoadingInvoices(false);
      }
    };
    if (isConnected) {
      fetchDemoOpportunities();
    }
  }, [isConnected, getAllInvoices, getInvoiceBasics, getInvoiceParties, getInvoiceFinancials, getInvoiceLocations, getInvoiceMetadata, getInvestmentBasics]);

  // Fetch user's investments from YieldXCore
  useEffect(() => {
    const fetchUserInvestments = async () => {
      if (!isConnected || !address) return;
      
      try {
        console.log('💼 Fetching user investments...');
        
        // Get user's investment data from YieldXCore
        const userInvoiceIds = await getInvestorInvoices(address);
        
        if (userInvoiceIds && userInvoiceIds.length > 0) {
          console.log(`👤 User has investments in ${userInvoiceIds.length} invoices:`, userInvoiceIds);
          
          const userInvestments: Array<{
            invoiceId: number;
            amount: number;
            investedAt: number;
            expectedReturn: number;
            daysRemaining: number;
            progress: number;
            status: 'active' | 'completed' | 'pending';
          }> = [];
          
          for (const invoiceId of userInvoiceIds) {
            try {
              // Get investment amount and invoice data
              const [investmentAmount, financials, metadata] = await Promise.all([
                getInvestorData(address, String(invoiceId)),
                getInvoiceFinancials(String(invoiceId)),
                getInvoiceMetadata(String(invoiceId))
              ]);

              if (investmentAmount && financials && metadata && investmentAmount > 0) {
                const amount = investmentAmount / 1e6; // Convert from wei to USDC
                const aprBasisPoints = financials.aprBasisPoints;
                const createdAt = metadata.createdAt;
                
                // Calculate investment metrics
                const daysElapsed = Math.floor((Date.now() / 1000 - createdAt) / (24 * 60 * 60));
                const totalDays = 90; // 90-day investment period
                const daysRemaining = Math.max(0, totalDays - daysElapsed);
                const progress = Math.min(100, (daysElapsed / totalDays) * 100);
                
                // Calculate expected return based on APR (basis points)
                const apr = aprBasisPoints / 10000; // Convert basis points to decimal
                const expectedReturn = (amount * apr * 90) / 365;
                
                userInvestments.push({
                  invoiceId,
                  amount,
                  investedAt: createdAt,
                  expectedReturn,
                  daysRemaining,
                  progress,
                  status: daysRemaining > 0 ? 'active' : 'completed'
                });

                console.log(`💰 Investment in invoice #${invoiceId}: ${amount} USDC, expected return: ${expectedReturn.toFixed(2)} USDC`);
              }
            } catch (err) {
              console.log(`❌ Error processing user investment ${invoiceId}:`, err);
            }
          }
          
          setMyInvestments(userInvestments);
          console.log(`✅ Loaded ${userInvestments.length} user investments`);
        } else {
          console.log('👤 User has no investments');
          setMyInvestments([]);
        }
      } catch (err) {
        console.error('❌ Error fetching user investments:', err);
      }
    };
    
    if (isConnected && address) {
      fetchUserInvestments();
    }
  }, [isConnected, address, getInvestorInvoices, getInvestorData, getInvoiceFinancials, getInvoiceMetadata]);

  // Helper functions
  const addResult = (message: string) => {
    setTransactionResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Updated invest function to use YieldXCore contract
  const handleInvest = async (invoiceId: string, invoiceTitle: string) => {
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

    setInvestingInvoiceId(String(invoiceId));
    setError('');
    addResult(`🚀 Starting investment in Invoice #${invoiceId} (${invoiceTitle})...`);
    
    try {
      // Step 1: Approve USDC spending for YieldXCore
      addResult(`💰 Approving ${investAmount} USDC for YieldXCore Protocol...`);
      const approveResult = await approveUSDC(contracts.PROTOCOL, investAmount);
      
      if (!approveResult.success) {
        addResult(`❌ USDC approval failed: ${approveResult.error}`);
        return;
      }
      
      addResult(`✅ USDC approved! TX: ${approveResult.txHash}`);
      
      // Step 2: Invest in invoice through YieldXCore
      addResult(`📊 Investing ${investAmount} USDC in Invoice #${invoiceId}...`);
      
      const investResult = await investInInvoice(String(invoiceId), investAmount);
      
      if (investResult.success) {
        addResult(`✅ Investment successful! TX: ${investResult.txHash}`);
        addResult(`🎊 Successfully invested ${investAmount} USDC in ${invoiceTitle}`);
        
        // Refresh data
        await refreshBalance();
        
        // Add to local investment tracking
        const invoice = invoices.find(inv => inv.id === parseInt(invoiceId));
        if (invoice) {
          const expectedReturn = (amount * (invoice.aprBasisPoints / 10000) * 90) / 365;
          const newInvestment = {
            invoiceId: parseInt(invoiceId),
            amount,
            investedAt: Math.floor(Date.now() / 1000),
            expectedReturn,
            daysRemaining: 90,
            progress: 0,
            status: 'active' as const
          };
          setMyInvestments(prev => [...prev, newInvestment]);
        }
      } else {
        addResult(`❌ Investment failed: ${investResult.error}`);
        setError(investResult.error || 'Investment failed');
      }
      
    } catch (err: any) {
      addResult(`❌ Investment error: ${err.message || err}`);
      setError(err.message || 'Investment failed');
    } finally {
      setInvestingInvoiceId(null);
    }
  };

  const handleMintUSDC = async () => {
    if (!isConnected || !address) {
      addResult('❌ Please connect your wallet first');
      return;
    }

    addResult('🪙 Minting 10,000 test USDC from YieldX contract...');
    setError('');
    
    try {
      const result = await mintTestUSDC('10000');
      
      if (result?.success) {
        addResult(`✅ Test USDC minted! TX: ${result.txHash}`);
        addResult('💰 You now have 10,000 USDC for YieldX protocol testing');
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

  // Calculate stats from real YieldXCore contract data
  const activeInvoices = invoices.filter(inv => inv.status === 2 && inv.aprBasisPoints > 0);
  const averageAPR = activeInvoices.length > 0 
    ? activeInvoices.reduce((sum, inv) => sum + inv.aprBasisPoints, 0) / activeInvoices.length / 100
    : 0;
  
  const totalVolume = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Connect your wallet to start investing in YieldX Protocol opportunities.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          YieldX Trade Finance Investment
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Invest in verified African trade invoices powered by YieldX Protocol smart contracts and Chainlink oracles.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">Live YieldX Protocol</span>
        </div>
      </div>

      {/* Live Protocol Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Live YieldX Protocol Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalVolume * 1e6)}
            </p>
            <p className="text-xs text-gray-500">From YieldXCore</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Average APR</p>
            <p className="text-2xl font-bold text-green-600">{averageAPR.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Expected yield</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Active Opportunities</p>
            <p className="text-2xl font-bold text-purple-600">
              {activeInvoices.length}
            </p>
            <p className="text-xs text-gray-500">Verified & ready</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Your USDC</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(usdcBalance * 1e6 || 0)}</p>
            <p className="text-xs text-gray-500">Available balance</p>
          </div>
        </div>
      </div>

      {/* Wallet Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">YieldX Investment Wallet</h3>
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
            <span>Available: {formatCurrency(usdcBalance * 1e6 || 0)}</span>
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
              YieldX Protocol Transaction Log:
            </p>
            {transactionResults.slice(-6).map((result, index) => (
              <p key={index} className="text-xs mb-1">{result}</p>
            ))}
          </div>
        )}
      </div>

      {/* My Investment Portfolio */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">My Investment Portfolio</h3>
            <p className="text-gray-600">Track your active investments and expected returns</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Live Tracking</span>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(myInvestments.reduce((sum, inv) => sum + inv.amount, 0) * 1e6)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Expected Returns</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(myInvestments.reduce((sum, inv) => sum + inv.expectedReturn, 0) * 1e6)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Active Investments</p>
            <p className="text-2xl font-bold text-purple-900">
              {myInvestments.filter(inv => inv.status === 'active').length}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 mb-1">Avg. ROI</p>
            <p className="text-2xl font-bold text-orange-900">
              {myInvestments.length > 0 
                ? ((myInvestments.reduce((sum, inv) => sum + inv.expectedReturn, 0) / 
                    myInvestments.reduce((sum, inv) => sum + inv.amount, 0)) * 100).toFixed(1)
                : '0.0'}%
            </p>
          </div>
        </div>

        {/* Investment List */}
        {myInvestments.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Active Investments</h4>
            <p className="text-gray-600">Start investing in trade finance opportunities to see your portfolio here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myInvestments.map((investment) => {
              const invoice = invoices.find(inv => inv.id === investment.invoiceId);
              const totalReturn = investment.amount + investment.expectedReturn;
              const dailyReturn = investment.expectedReturn / Math.max(1, (90 - investment.daysRemaining));
              
              return (
                <div key={investment.invoiceId} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {invoice?.commodity || `Invoice #${investment.invoiceId}`}
                        </h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Invested: {formatCurrency(investment.amount * 1e6)}</span>
                        <span>Expected: {formatCurrency(investment.expectedReturn * 1e6)}</span>
                        <span>Total: {formatCurrency(totalReturn * 1e6)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        +{((investment.expectedReturn / investment.amount) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">ROI</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Investment Progress</span>
                      <span>{investment.progress.toFixed(1)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${investment.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Investment Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-blue-600">
                        {new Date(investment.investedAt * 1000).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500">Invested Date</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-purple-600">
                        {new Date((investment.investedAt + (90 * 24 * 60 * 60)) * 1000).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500">Maturity Date</div>
                    </div>
                  </div>

                  {/* Return Projection */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">📈 Return Projection</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Principal</div>
                        <div className="font-bold text-gray-900">{formatCurrency(investment.amount * 1e6)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Expected Yield</div>
                        <div className="font-bold text-green-600">+{formatCurrency(investment.expectedReturn * 1e6)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Return</div>
                        <div className="font-bold text-blue-600">{formatCurrency(totalReturn * 1e6)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Opportunities */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            YieldX Investment Opportunities
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
            <p className="text-gray-600">Loading investment opportunities from YieldXCore contract...</p>
          </div>
        ) : activeInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Investment Opportunities</h3>
            <p className="text-gray-600 mb-2">No verified investment opportunities found in the YieldXCore contract.</p>
            {error && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activeInvoices.map((invoice) => {
              const isInvesting = investingInvoiceId === String(invoice.id);
              const investmentAmount = parseFloat(investAmount) || 0;
              const apr = invoice.aprBasisPoints / 100; // Convert basis points to percentage
              const expectedYield = (investmentAmount * (apr / 100) * 90) / 365;
              const statusText = [
                'Submitted',
                'Verifying',
                'Verified',
                'Fully Funded',
                'Approved',
                'Funded',
                'Repaid',
                'Defaulted',
                'Rejected',
              ][invoice.status] || 'Unknown';
              const statusColor = [
                'bg-gray-200 text-gray-800',
                'bg-blue-200 text-blue-800',
                'bg-green-200 text-green-800',
                'bg-purple-200 text-purple-800',
                'bg-yellow-200 text-yellow-800',
                'bg-orange-200 text-orange-800',
                'bg-green-100 text-green-900',
                'bg-red-200 text-red-800',
                'bg-red-300 text-red-900',
              ][invoice.status] || 'bg-gray-100 text-gray-800';
              const canInvest = invoice.status === 2 && invoice.documentVerified && invoice.remainingFunding > 0;
              return (
                <div key={invoice.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {invoice.commodity}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>{statusText}</span>
                        {invoice.documentVerified && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            ✅ Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>From: {invoice.supplierCountry}</span>
                        <span>To: {invoice.buyerCountry}</span>
                        <span>Investors: {invoice.numInvestors}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.amount * 1e6)}
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {apr.toFixed(1)}% APR
                      </div>
                      <div className="text-sm text-gray-500">
                        Target: {formatCurrency(invoice.targetFunding * 1e6)}
                      </div>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Funding Progress</span>
                      <span>
                        {formatCurrency(invoice.currentFunding * 1e6)} / {formatCurrency(invoice.targetFunding * 1e6)}
                        ({((invoice.currentFunding / invoice.targetFunding) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (invoice.currentFunding / invoice.targetFunding) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Investment Calculator */}
                  {investmentAmount > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">💰 Investment Preview</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Your Investment</div>
                          <div className="font-bold text-blue-600">{formatCurrency(investmentAmount * 1e6)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Expected Yield (90d)</div>
                          <div className="font-bold text-green-600">+{formatCurrency(expectedYield * 1e6)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Return</div>
                          <div className="font-bold text-purple-600">{formatCurrency((investmentAmount + expectedYield) * 1e6)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm space-y-1">
                      <p className="text-green-600 font-medium">🟢 Live from YieldXCore blockchain</p>
                      <p className="text-gray-500">
                        Remaining: {formatCurrency(invoice.remainingFunding * 1e6)} • 
                        Exporter: {invoice.exporterName} • 
                        Buyer: {invoice.buyerName}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span>
                        <button
                          onClick={() => handleInvest(String(invoice.id), invoice.commodity)}
                          disabled={loading || isInvesting || investmentAmount <= 0 || investmentAmount > (usdcBalance || 0) || investmentAmount > invoice.remainingFunding || !canInvest}
                          className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2`}
                          title={canInvest ? '' : 'Only verified invoices can be invested in. Status: ' + statusText}
                        >
                          {isInvesting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Investing...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4" />
                              Invest {formatCurrency(investmentAmount * 1e6)}
                            </>
                          )}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Calculator Section */}
      {investingInvoiceId && (
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

            {investingInvoiceId && investAmount && (() => {
              const selectedInvoice = invoices.find(inv => inv.id === parseInt(investingInvoiceId));
              if (!selectedInvoice) return null;
              
              const apr = selectedInvoice.aprBasisPoints / 100;
              const expectedYield = (parseFloat(investAmount) * (apr / 100) * 90) / 365;
              
              return (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Principal:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(investAmount) * 1e6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expected Yield (90 days):</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(expectedYield * 1e6)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Return:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency((parseFloat(investAmount) + expectedYield) * 1e6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">90-Day ROI:</span>
                    <span className="font-medium">{((expectedYield / parseFloat(investAmount)) * 100).toFixed(2)}%</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Market Data */}
      {liveMarketData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Live Market Data
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">ETH Price</div>
              <div className="font-bold text-blue-600">${liveMarketData.ethPrice.toLocaleString()}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">BTC Price</div>
              <div className="font-bold text-orange-600">${liveMarketData.btcPrice.toLocaleString()}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">LINK Price</div>
              <div className="font-bold text-blue-600">${liveMarketData.linkPrice.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Market Volatility</div>
              <div className="font-bold text-red-600">{(liveMarketData.marketVolatility * 100).toFixed(2)}%</div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Last updated: {new Date(liveMarketData.lastUpdate * 1000).toLocaleString()} • 
            Powered by Chainlink Price Feeds
          </div>
        </div>
      )}

      {/* YieldX Protocol Contracts */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          YieldX Protocol Contracts
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">YieldXCore:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.PROTOCOL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                {contracts.PROTOCOL.slice(0, 6)}...{contracts.PROTOCOL.slice(-4)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">USDC Token:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.USDC}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                {contracts.USDC.slice(0, 6)}...{contracts.USDC.slice(-4)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Invoice NFT:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.INVOICE_NFT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                {contracts.INVOICE_NFT.slice(0, 6)}...{contracts.INVOICE_NFT.slice(-4)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Investment:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.INVESTMENT_MODULE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                {contracts.INVESTMENT_MODULE.slice(0, 6)}...{contracts.INVESTMENT_MODULE.slice(-4)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verification:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.VERIFICATION_MODULE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 font-mono flex items-center gap-1"
              >
                {contracts.VERIFICATION_MODULE.slice(0, 6)}...{contracts.VERIFICATION_MODULE.slice(-4)} <CheckCircle className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Price Manager:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.PRICE_MANAGER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                {contracts.PRICE_MANAGER.slice(0, 6)}...{contracts.PRICE_MANAGER.slice(-4)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Risk Calculator:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.RISK_CALCULATOR}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                {contracts.RISK_CALCULATOR.slice(0, 6)}...{contracts.RISK_CALCULATOR.slice(-4)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">VRF Module:</span>
              <a 
                href={`https://sepolia.etherscan.io/address/${contracts.VRF_MODULE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
              >
                {contracts.VRF_MODULE.slice(0, 6)}...{contracts.VRF_MODULE.slice(-4)} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            YieldX Protocol Live on Sepolia - All contracts deployed and verified!
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestPage;
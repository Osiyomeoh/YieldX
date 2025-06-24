// src/components/pages/InvestPage.tsx - Real Contract Data Only
import React, { useState, useEffect } from 'react';
import { Shield, Clock, ExternalLink, Loader2, RefreshCw, TrendingUp, DollarSign, AlertCircle, FileText } from 'lucide-react';
import { useYieldX } from '../../hooks/useYieldX';

interface InvestPageProps {
  investAmount: string;
  setInvestAmount: (amount: string) => void;
}

// Invoice data structure from contract
interface InvoiceData {
  id: number;
  [key: string]: any; // Allow any property from contract
}

const InvestPage: React.FC<InvestPageProps> = ({ investAmount, setInvestAmount }) => {
  const {
    isConnected,
    address,
    investInInvoice, 
    mintTestUSDC, 
    loading, 
    usdcBalance,
    marketData,
    stats,
    txHash, 
    isTransactionSuccess,
    contracts,
    getInvoiceDetails,
    refreshBalance
  } = useYieldX();

  const [investingInvoiceId, setInvestingInvoiceId] = useState<number | null>(null);
  const [transactionResults, setTransactionResults] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch invoices from contract only
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoadingInvoices(true);
        const invoiceList: InvoiceData[] = [];

        // Only fetch from contract if totalInvoices exists
        if (stats?.totalInvoices && stats.totalInvoices > 0) {
        for (let i = 1; i <= stats.totalInvoices; i++) {
          try {
            const details = await getInvoiceDetails(i);
              console.log(`Contract invoice ${i}:`, details);
              
              if (details) {
                invoiceList.push({
                id: i,
                  ...details // All properties from contract
              });
            }
          } catch (err) {
            console.error(`Error fetching invoice ${i}:`, err);
          }
        }
        }

        console.log('Loaded invoices from contract:', invoiceList);
        setInvoices(invoiceList);
      } catch (error) {
        console.error('Error loading invoices:', error);
        setError('Failed to load investment opportunities from contract');
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    if (isConnected) {
    fetchInvoices();
    }
  }, [isConnected, stats?.totalInvoices, getInvoiceDetails]);

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

    if (usdcBalance < amount) {
      addResult(`❌ Insufficient USDC balance. You have ${usdcBalance.toFixed(2)} USDC`);
      return;
    }

    setInvestingInvoiceId(invoiceId);
    setError('');
    const displayTitle = invoiceTitle || `Invoice #${invoiceId}`;
    addResult(`🚀 Starting investment in ${displayTitle}...`);

    try {
      const result = await investInInvoice(invoiceId, investAmount);
      
      if (result?.success) {
        addResult(`✅ Investment successful! TX: ${result.hash || txHash}`);
        addResult(`💰 Invested ${investAmount} USDC in ${displayTitle}`);
        
        // Refresh balance and invoices
        await refreshBalance();
        setInvestAmount('');
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

    addResult('🪙 Minting 10,000 test USDC...');
    setError('');
    
    try {
      const result = await mintTestUSDC('10000');
      
      if (result?.success) {
        addResult(`✅ Test USDC minted! TX: ${result.hash || txHash}`);
        addResult('💰 You now have 10,000 USDC for testing');
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

  const calculateExpectedReturn = (amount: number, apr: number) => {
    if (!amount || !apr) return { principal: 0, expectedYield: 0, totalReturn: 0, apr: 0 };
    
    const principal = amount;
    const annualReturn = (principal * apr) / 100;
    const quarterlyReturn = annualReturn / 4; // 90-day period
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

  const getRiskColor = (risk: string) => {
    if (!risk) return 'text-gray-600 bg-gray-50 border-gray-200';
    
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Calculate stats from real invoices only
  const activeInvoices = invoices.filter(inv => 
    inv.isActive !== false && inv.active !== false
  );
  
  const averageAPR = activeInvoices.length > 0 
    ? activeInvoices.reduce((sum, inv) => {
        const apr = Number(inv.apr || inv.yieldRate || inv.yield || 0);
        return sum + apr;
      }, 0) / activeInvoices.length 
    : 0;
    
  const totalVolume = activeInvoices.reduce((sum, inv) => {
    const amount = inv.amount || inv.targetAmount || 0;
    return sum + (Number(amount) / 1e6);
  }, 0);

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Connect your wallet to start investing in real-world assets.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Real-World Asset Investment
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Invest in tokenized real-world assets with transparent yields backed by blockchain technology.
        </p>
      </div>

      {/* Live Protocol Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Live Protocol Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalVolume)}</p>
            <p className="text-xs text-gray-500">From contracts</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Average APR</p>
            <p className="text-2xl font-bold text-green-600">{averageAPR.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Expected yield</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Active Investments</p>
            <p className="text-2xl font-bold text-purple-600">{activeInvoices.length}</p>
            <p className="text-xs text-gray-500">Available now</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Your USDC</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(usdcBalance)}</p>
            <p className="text-xs text-gray-500">Available balance</p>
          </div>
        </div>
      </div>

      {/* Wallet Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Investment Wallet</h3>
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
              max={usdcBalance}
                  />
                </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Minimum: $100</span>
            <span>Available: {formatCurrency(usdcBalance)}</span>
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
              Transaction Log:
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
          <h2 className="text-2xl font-bold text-gray-900">Investment Opportunities</h2>
          {isLoadingInvoices ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
              {activeInvoices.length} Active
            </span>
          )}
        </div>
        
        {isLoadingInvoices ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading investment opportunities...</p>
          </div>
        ) : activeInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Investments</h3>
            <p className="text-gray-600 mb-2">No investment opportunities found in the smart contract.</p>
            <p className="text-sm text-gray-500">
              Contract has {stats?.totalInvoices || 0} total invoices. 
              {stats?.totalInvoices ? ' Check if any are active.' : ' Invoices will appear here when added to the contract.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeInvoices.map((invoice) => {
              // Get properties from contract with safe fallbacks
              const invoiceTitle = invoice.title || invoice.name || invoice.commodity || `Investment #${invoice.id}`;
              const invoiceDescription = invoice.description || invoice.exporter || invoice.company || 'Investment opportunity from smart contract';
              const invoiceAmount = invoice.amount || invoice.targetAmount || 0;
              const invoiceFunded = invoice.funded || invoice.currentInvestments || invoice.raised || 0;
              const invoiceAPR = Number(invoice.apr || invoice.yieldRate || invoice.yield || 0);
              const invoiceRisk = invoice.riskLevel || invoice.risk || 'Unknown';
              const invoiceTimestamp = Number(invoice.timestamp || invoice.createdAt || Date.now());
              const invoiceMaturity = Number(invoice.maturityDate || invoice.endDate || (Date.now() / 1000 + 90 * 24 * 60 * 60));
              
              const amountUSD = Number(invoiceAmount) / 1e6;
              const fundedUSD = Number(invoiceFunded) / 1e6;
              const fundingPercentage = amountUSD > 0 ? (fundedUSD / amountUSD) * 100 : 0;
              const remainingAmount = amountUSD - fundedUSD;
              const isInvesting = investingInvoiceId === invoice.id;
              const investmentAmount = parseFloat(investAmount) || 0;
              const returns = calculateExpectedReturn(investmentAmount, invoiceAPR);
              
              return (
                <div key={invoice.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {invoiceTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(invoiceRisk)}`}>
                          {invoiceRisk} Risk
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{invoiceDescription}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          From Contract
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Live Data
                        </span>
                        <span>Invoice #{invoice.id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoiceAmount)}
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {invoiceAPR.toFixed(1)}% APR
                      </div>
                    </div>
                  </div>
                  
                  {/* Funding Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Funding Progress</span>
                      <span className="font-medium">
                        {formatCurrency(fundedUSD)} / {formatCurrency(amountUSD)} 
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
                      <span>From Contract: {new Date(invoiceTimestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Investment Calculator */}
                  {investmentAmount > 0 && invoiceAPR > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Investment Preview</h4>
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
                          <p className="text-gray-600">ROI</p>
                          <p className="font-semibold text-lg text-blue-600">{((returns.expectedYield / returns.principal) * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-green-600 font-medium">🟢 Live from blockchain</p>
                      <p className="text-gray-600">Maturity: {new Date(invoiceMaturity * 1000).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex gap-3">
              <button
                        onClick={() => handleInvest(invoice.id, invoiceTitle)}
                        disabled={loading || isInvesting || investmentAmount <= 0 || investmentAmount > usdcBalance}
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
                          Verify
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

      {/* Market Data */}
      {marketData && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-orange-600" />
            Live Market Data (Chainlink Oracles)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-600 mb-1">ETH Price</p>
              <p className="text-xl font-bold text-gray-900">${marketData.ethPrice?.toFixed(2) || 'N/A'}</p>
              <p className="text-xs text-gray-500">Live from oracle</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-600 mb-1">USDC Price</p>
              <p className="text-xl font-bold text-gray-900">${marketData.usdcPrice?.toFixed(4) || 'N/A'}</p>
              <p className="text-xs text-gray-500">Live from oracle</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-600 mb-1">Market Risk</p>
              <p className="text-xl font-bold text-gray-900">{marketData.marketRisk ? (marketData.marketRisk * 100).toFixed(1) : 'N/A'}%</p>
              <p className="text-xs text-gray-500">Risk assessment</p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Information */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">YieldX Protocol</p>
            <div className="flex items-center gap-2">
              <code className="bg-white px-2 py-1 rounded font-mono text-xs">
                {contracts?.PROTOCOL?.slice(0, 20)}...{contracts?.PROTOCOL?.slice(-6)}
              </code>
              {contracts?.PROTOCOL && (
                <a
                  href={`https://sepolia.etherscan.io/address/${contracts.PROTOCOL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          <div>
            <p className="text-gray-500">Network</p>
            <p className="font-semibold">Sepolia Testnet</p>
          </div>
          <div>
            <p className="text-gray-500">Total Active Investments</p>
            <p className="font-semibold">{activeInvoices.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Data Source</p>
            <p className="font-semibold">Smart Contract + Chainlink Oracles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestPage;
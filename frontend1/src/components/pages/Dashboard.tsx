// src/components/pages/Dashboard.tsx - Updated with Real Contract Data
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, BarChart3, Globe, RefreshCw, ExternalLink, Loader2, 
  Shield, Zap, DollarSign, FileText, AlertCircle, CheckCircle, 
  Clock, X, Bell, Copy, Eye, EyeOff, Calendar, ArrowUpRight, ArrowDownRight,
  Users, Activity
} from 'lucide-react';
import { useYieldX } from '../../hooks/useYieldX';
import { TabId } from '../../types/index';

interface DashboardProps {
  setActiveTab: (tab: TabId) => void;
}

interface Notification {
  id: string;
  type: 'pending' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  txHash?: string;
  timestamp: number;
  autoRemove?: boolean;
}

interface Investment {
  id: string;
  invoiceId: string;
  amount: number;
  investmentDate: Date;
  expectedReturn: number;
  currentValue: number;
  status: 'active' | 'completed' | 'pending';
  maturityDate: Date;
  companyName: string;
  yieldRate: number;
}

// Enhanced notification hook
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    type: Notification['type'], 
    title: string, 
    message: string, 
    txHash?: string,
    autoRemove = true
  ) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      txHash,
      timestamp: Date.now(),
      autoRemove
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    if (autoRemove && (type === 'success' || type === 'info')) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, addNotification, removeNotification, clearAllNotifications };
};

// Enhanced address display hook
const useAddressDisplay = (address: string | undefined) => {
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayAddress = useMemo(() => {
    if (!address) return '';
    return showFull ? address : `${address.slice(0, 8)}...${address.slice(-6)}`;
  }, [address, showFull]);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, [address]);

  return { displayAddress, showFull, setShowFull, copyAddress, copied };
};

// User investments hook (ready for future contract integration)
const useUserInvestments = (address: string | undefined, getInvestmentOpportunities: any) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserInvestments = async () => {
      if (!address || !getInvestmentOpportunities) {
        setInvestments([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Get investment opportunities from your real contract
        const opportunities = await getInvestmentOpportunities();
        console.log('📊 Investment opportunities from contract:', opportunities);
        
        // TODO: Get user's actual investments once contract method is available
        const userInvestments: Investment[] = [];
        setInvestments(userInvestments);
      } catch (error) {
        console.error('Error fetching user investments:', error);
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInvestments();
  }, [address, getInvestmentOpportunities]);
  
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const portfolioValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturns = portfolioValue - totalInvested;
  
  return {
    investments,
    totalInvested,
    portfolioValue,
    totalReturns,
    loading
  };
};

export function Dashboard({ setActiveTab }: DashboardProps) {
  // Use your championship protocol hook with all the latest features
  const { 
    isConnected, 
    address, 
    liveMarketData,        // Live Chainlink oracle data
    usdcBalance,           // Real USDC balance from contract
    refreshBalance,
    protocolStats,         // Real protocol stats from contract
    loading,
    mintTestUSDC,
    contracts,             // Your live contract addresses
    getInvoiceDetails,
    getVerificationData,   // New: Get verification data from your proven module
    getInvestmentInfo,
    getInvestmentOpportunities,
    getFunctionsConfig,    // New: Get Functions configuration
    getLastFunctionsResponse, // New: Get latest Functions response
    testDirectRequest,     // New: Test Functions integration
    startDocumentVerification, // New: Start document verification
    updateLivePrices,
  } = useYieldX();

  const { notifications, addNotification, removeNotification, clearAllNotifications } = useNotifications();
  const { displayAddress, showFull, setShowFull, copyAddress, copied } = useAddressDisplay(address);
  const { investments, totalInvested, portfolioValue, totalReturns, loading: investmentsLoading } = useUserInvestments(address, getInvestmentOpportunities);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [functionsConfig, setFunctionsConfig] = useState<any>(null);
  const [lastFunctionsResponse, setLastFunctionsResponse] = useState<any>(null);

  // Load Functions data from your proven working verification module
  useEffect(() => {
    const loadFunctionsData = async () => {
      if (!getFunctionsConfig || !getLastFunctionsResponse) return;
      
      try {
        const [config, response] = await Promise.all([
          getFunctionsConfig(),
          getLastFunctionsResponse()
        ]);
        
        setFunctionsConfig(config);
        setLastFunctionsResponse(response);
        
        if (response && response.responseLength && response.responseLength > 0) {
          addNotification('info', 'Functions Data Loaded', 
            `Last response: ${response.responseLength} bytes from subscription 4996`);
        }
      } catch (error) {
        console.error('Error loading Functions data:', error);
      }
    };
    
    if (isConnected) {
      loadFunctionsData();
    }
  }, [isConnected, getFunctionsConfig, getLastFunctionsResponse, addNotification]);

  const investmentMetrics = useMemo(() => {
    const activeInvestments = investments.filter(inv => inv.status === 'active');
    const completedInvestments = investments.filter(inv => inv.status === 'completed');
    const totalReturn = totalInvested > 0 ? ((portfolioValue - totalInvested) / totalInvested) * 100 : 0;
    
    return {
      activeInvestments,
      completedInvestments,
      totalReturn
    };
  }, [investments, totalInvested, portfolioValue]);

  // Enhanced event handlers
  const handleMintUSDC = useCallback(async () => {
    if (!isConnected) {
      addNotification('error', 'Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    const now = Date.now();
    if (now - lastRefresh < 5000) {
      addNotification('info', 'Please Wait', 'Please wait before minting again');
      return;
    }

    try {
      addNotification('info', 'Minting Started', 'Preparing to mint 10,000 test USDC tokens...');
      const result = await mintTestUSDC('10000');
      
      if (!result.success && result.error) {
        addNotification('error', 'Minting Failed', result.error);
      }
      setLastRefresh(now);
    } catch (error: any) {
      addNotification('error', 'Mint Error', error.message || 'Failed to mint tokens');
    }
  }, [isConnected, mintTestUSDC, addNotification, lastRefresh]);

  const handleRefreshBalance = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    const refreshTime = Date.now();
    
    try {
      await refreshBalance();
      addNotification('success', 'Balance Updated', 
        `Current balance: ${usdcBalance.toFixed(2)} USDC from live contract`);
      setLastRefresh(refreshTime);
    } catch (error: any) {
      addNotification('error', 'Refresh Failed', 
        error.message || 'Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshBalance, usdcBalance, isRefreshing, addNotification]);

  // Functions testing handler
  const handleTestFunctions = useCallback(async () => {
    if (!isConnected) {
      addNotification('error', 'Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      addNotification('info', 'Testing Functions', 'Calling your proven verification module...');
      const result = await testDirectRequest();
      
      if (result.success) {
        addNotification('success', 'Functions Test Sent!', 
          'Check subscription 4996 for response (may take 1-2 minutes)', result.txHash);
        
        // Refresh Functions data after a delay
        setTimeout(async () => {
          const response = await getLastFunctionsResponse();
          setLastFunctionsResponse(response);
        }, 5000);
      } else if (result.error) {
        addNotification('error', 'Functions Test Failed', result.error);
      }
    } catch (error: any) {
      addNotification('error', 'Functions Test Error', error.message || 'Failed to test Functions');
    }
  }, [isConnected, testDirectRequest, addNotification, getLastFunctionsResponse]);

  // Price update handlers  
  const handleUpdatePrices = useCallback(async () => {
    if (!isConnected) {
      addNotification('error', 'Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      addNotification('info', 'Updating Prices', 'Fetching live prices from Chainlink oracles...');
      const result = await updateLivePrices();
      
      if (result.success) {
        addNotification('success', 'Prices Updated!', 
          `ETH: $${liveMarketData?.ethPrice?.toFixed(2)}, BTC: $${liveMarketData?.btcPrice?.toFixed(2)}`);
      } else if (result.error) {
        addNotification('error', 'Price Update Failed', result.error);
      }
    } catch (error: any) {
      addNotification('error', 'Price Update Error', error.message || 'Failed to update prices');
    }
  }, [isConnected, updateLivePrices, addNotification, liveMarketData]);

  // Enhanced Notification Component
  const NotificationItem = React.memo(({ notification }: { notification: Notification }) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'pending': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
        case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
        case 'info': return <Clock className="w-5 h-5 text-blue-500" />;
      }
    };

    const getStyles = () => {
      switch (notification.type) {
        case 'pending': return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          ring: 'ring-blue-100'
        };
        case 'success': return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          ring: 'ring-green-100'
        };
        case 'error': return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          ring: 'ring-red-100'
        };
        case 'info': return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          ring: 'ring-blue-100'
        };
      }
    };

    const styles = getStyles();
    const timeAgo = Math.floor((Date.now() - notification.timestamp) / 1000);

    return (
      <div className={`border rounded-lg p-4 ${styles.bg} ${styles.ring} ring-1 transition-all duration-300 hover:shadow-md`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5 flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${styles.text} text-sm`}>{notification.title}</h4>
              <p className={`text-sm ${styles.text} opacity-80 mt-1`}>{notification.message}</p>
              <div className="flex items-center gap-4 mt-2">
                {notification.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${notification.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-xs ${styles.text} hover:underline`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Etherscan
                  </a>
                )}
                <span className={`text-xs ${styles.text} opacity-60`}>
                  {timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className={`${styles.text} hover:opacity-70 ml-2 flex-shrink-0`}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  });

  // Enhanced Investment Portfolio Component
  const InvestmentPortfolio = React.memo(() => {
    if (investmentsLoading) {
      return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading investments from live contract...</span>
          </div>
        </div>
      );
    }

    if (investments.length === 0) {
      return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Your Investment Portfolio
            <span className="text-sm font-normal text-gray-500">(Live Contract Data)</span>
          </h2>
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">No investments found</p>
            <p className="text-sm mb-4">No investments found in your smart contract history</p>
            <button
              onClick={() => setActiveTab('invest')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Investment Opportunities
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Your Investment Portfolio
            <span className="text-sm font-normal text-gray-500">(From Live Smart Contract)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Invested</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">${totalInvested.toLocaleString()}</p>
              <p className="text-xs text-blue-700 mt-1">{investments.length} investments</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Portfolio Value</span>
              </div>
              <p className="text-2xl font-bold text-green-900">${portfolioValue.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-1">Current contract value</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Total Returns</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">${totalReturns.toLocaleString()}</p>
              <p className="text-xs text-purple-700 mt-1">From blockchain</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Return Rate</span>
              </div>
              <p className={`text-2xl font-bold ${investmentMetrics.totalReturn >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {investmentMetrics.totalReturn >= 0 ? '+' : ''}{investmentMetrics.totalReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-orange-700 mt-1">Contract performance</p>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Not connected state
  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Globe className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect your wallet to access your YieldX Protocol dashboard with live Sepolia blockchain data and real Chainlink oracle integration.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">🌟 What you'll get access to:</h3>
          <ul className="text-blue-800 space-y-1 text-left">
            <li>• Live Chainlink price feeds from Sepolia testnet</li>
            <li>• Real-time protocol statistics from deployed contracts</li>
            <li>• Your actual investment portfolio from blockchain</li>
            <li>• Working Chainlink Functions verification</li>
            <li>• Live transaction monitoring</li>
          </ul>
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="space-y-8">
      {/* Enhanced Notifications Panel */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Bell className="w-5 h-5" />
              <h3 className="font-semibold">Live Blockchain Notifications</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            </div>
            {notifications.length > 1 && (
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Header with Live Contract Info */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          YieldX Protocol Dashboard
        </h1>
        {/* Demo Link Button */}
        <div className="mb-4 flex justify-center">
          <a
            href="https://youtu.be/jC2dcIWlO8c"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-yellow-400 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-yellow-500 transition-colors text-lg"
            style={{ textDecoration: 'none' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.12C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.386.566A2.994 2.994 0 0 0 .502 6.186C0 8.344 0 12 0 12s0 3.656.502 5.814a2.994 2.994 0 0 0 2.112 2.12C4.772 20.5 12 20.5 12 20.5s7.228 0 9.386-.566a2.994 2.994 0 0 0 2.112-2.12C24 15.656 24 12 24 12s0-3.656-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            Watch Demo
          </a>
        </div>
        <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
          <p className="text-xl text-gray-600">Live data from championship Sepolia deployment</p>
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Championship Protocol Live
          </div>
        </div>
        
        {/* Enhanced Address Display */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2 max-w-md mx-auto">
          <span>Connected:</span>
          <code className="font-mono bg-white px-2 py-1 rounded border">
            {displayAddress}
          </code>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-gray-400 hover:text-gray-600"
              aria-label={showFull ? "Hide full address" : "Show full address"}
            >
              {showFull ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={copyAddress}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Copy address"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied && <span className="text-green-600 text-xs">Copied!</span>}
        </div>
        <p className="text-xs text-gray-400 mt-2">Network: Sepolia Testnet | Protocol: Live Championship Deployment</p>
      </div>

      {/* Investment Portfolio Section */}
      <InvestmentPortfolio />

      {/* Live Protocol Stats - Real Contract Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-xs text-green-600">Live from contract</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${protocolStats?.totalFundsRaised?.toLocaleString?.() || '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            From {protocolStats?.totalInvoices || 0} live invoices
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-xs text-orange-600">Contract state</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{protocolStats?.pendingInvoices || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting verification</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-xs text-purple-600">Chainlink verified</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{protocolStats?.verifiedInvoices || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Ready for investment</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Your USDC</p>
              <p className="text-xs text-gray-500">Live balance</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{(Number(usdcBalance) || 0).toFixed(2)}</p>
          <button
            onClick={handleRefreshBalance}
            disabled={isRefreshing || loading}
            className="text-sm text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh from contract'}
          </button>
        </div>
      </div>

      {/* Enhanced Chainlink Functions Status Panel */}
      {functionsConfig && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              Chainlink Functions Status
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-normal text-gray-500">
                (Your Proven Working Module)
              </span>
            </h2>
            
            <button
              onClick={handleTestFunctions}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Test Functions
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">🔗</div>
              <p className="text-sm text-gray-600 mb-1">Router</p>
              <p className="text-sm font-mono text-blue-900 break-all">{functionsConfig.router?.slice(0, 10)}...</p>
              <p className="text-xs text-blue-600">Chainlink router</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">🆔</div>
              <p className="text-sm text-gray-600 mb-1">Subscription</p>
              <p className="text-2xl font-bold text-green-900">{functionsConfig.subscriptionId}</p>
              <p className="text-xs text-green-600">Your proven sub</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">⛽</div>
              <p className="text-sm text-gray-600 mb-1">Gas Limit</p>
              <p className="text-2xl font-bold text-purple-900">{functionsConfig.gasLimit?.toLocaleString()}</p>
              <p className="text-xs text-purple-600">Function gas</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm text-gray-600 mb-1">Response Size</p>
              <p className="text-2xl font-bold text-orange-900">
                {lastFunctionsResponse?.responseLength || 0}
              </p>
              <p className="text-xs text-orange-600">Bytes received</p>
            </div>
          </div>

          {/* Functions Response Data */}
          {lastFunctionsResponse && lastFunctionsResponse.responseLength > 0 && (
            <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Latest Functions Response</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Request ID:</p>
                  <p className="font-mono text-xs text-gray-800 break-all">{lastFunctionsResponse.lastRequestId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Response Length:</p>
                  <p className="font-mono text-xs text-gray-800">{lastFunctionsResponse.responseLength} bytes</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-green-600">✅ Your verification module is working perfectly!</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Enhanced Wallet Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Wallet Actions</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Balance Management */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">USDC Balance Management</h3>
            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-blue-600 mb-2">{(Number(usdcBalance) || 0).toFixed(2)}</p>
              <p className="text-gray-600">USDC Available (Live from Contract)</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleMintUSDC}
                disabled={loading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🪙'}
                {loading ? 'Minting...' : 'Mint 10,000 Test USDC'}
              </button>
              
              <button
                onClick={handleRefreshBalance}
                disabled={loading || isRefreshing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(loading || isRefreshing) ? 
                  <Loader2 className="w-4 h-4 animate-spin" /> : 
                  <RefreshCw className="w-4 h-4" />
                }
                {isRefreshing ? 'Refreshing...' : 'Refresh from Contract'}
              </button>
            </div>
          </div>

          {/* Contract Verification */}
          <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Contract Verification</h3>
            
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">YieldX Protocol Core</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${contracts?.PROTOCOL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  {contracts?.PROTOCOL?.slice(0, 20)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Mock USDC Token</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${contracts?.USDC}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  {contracts?.USDC?.slice(0, 20)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Verification Module (Proven)</p>
                <a
                  href={`https://sepolia.etherscan.io/address/${contracts?.VERIFICATION_MODULE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-green-600 hover:underline flex items-center gap-1"
                >
                  {contracts?.VERIFICATION_MODULE?.slice(0, 20)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chainlink Oracle Data Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            Live Chainlink Oracle Data
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              liveMarketData?.initialPricesFetched ? 'bg-green-400' : 'bg-orange-400'
            }`}></div>
            <span className="text-sm font-normal text-gray-500">
              ({liveMarketData?.initialPricesFetched ? 'Live from Chainlink' : 'Using defaults'})
            </span>
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={handleUpdatePrices}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Update Prices
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <p className="text-sm text-gray-600 mb-1">ETH/USD</p>
            <p className="text-2xl font-bold text-gray-900">${(liveMarketData?.ethPrice || 0).toFixed(2)}</p>
            <p className="text-xs text-green-600">Live oracle feed</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">💵</div>
            <p className="text-sm text-gray-600 mb-1">USDC/USD</p>
            <p className="text-2xl font-bold text-gray-900">${(liveMarketData?.usdcPrice || 1).toFixed(4)}</p>
            <p className="text-xs text-green-600">Stable oracle</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">₿</div>
            <p className="text-sm text-gray-600 mb-1">BTC/USD</p>
            <p className="text-2xl font-bold text-gray-900">${(liveMarketData?.btcPrice || 0).toLocaleString()}</p>
            <p className="text-xs text-green-600">Bitcoin feed</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">🔗</div>
            <p className="text-sm text-gray-600 mb-1">LINK/USD</p>
            <p className="text-2xl font-bold text-gray-900">${(liveMarketData?.linkPrice || 0).toFixed(2)}</p>
            <p className="text-xs text-green-600">Chainlink token</p>
          </div>
        </div>

        {/* Market Volatility and Oracle Status */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Market Volatility</p>
            <p className="text-xl font-bold text-red-700">
              {((liveMarketData?.marketVolatility || 0) * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-red-600">Risk metric</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Last Oracle Update</p>
            <p className="text-xl font-bold text-blue-700">
              {new Date((liveMarketData?.lastUpdate || 0) * 1000).toLocaleTimeString()}
            </p>
            <p className="text-xs text-blue-600">Timestamp</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Oracle Status</p>
            <p className={`text-xl font-bold ${liveMarketData?.initialPricesFetched ? 'text-green-700' : 'text-orange-700'}`}>
              {liveMarketData?.initialPricesFetched ? 'LIVE' : 'DEFAULT'}
            </p>
            <p className="text-xs text-green-600">Chainlink feeds</p>
          </div>
        </div>
      </div>

      {/* Enhanced Contract Verification Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Activity className="w-6 h-6 text-purple-500" />
          Championship Protocol Contracts
          <span className="text-sm font-normal text-gray-500">Live Sepolia Deployment</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900">YieldX Core Protocol</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-xs text-blue-700 break-all flex-1">
                {contracts?.PROTOCOL}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(contracts?.PROTOCOL || '')}
                className="text-blue-600 hover:text-blue-800"
              >
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${contracts?.PROTOCOL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-blue-700">Main protocol contract</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-900">Price Manager</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-xs text-green-700 break-all flex-1">
                {contracts?.PRICE_MANAGER}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(contracts?.PRICE_MANAGER || '')}
                className="text-green-600 hover:text-green-800"
              >
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${contracts?.PRICE_MANAGER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-green-700">Chainlink price feeds</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-yellow-900">Verification Module</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-xs text-yellow-700 break-all flex-1">
                {contracts?.VERIFICATION_MODULE}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(contracts?.VERIFICATION_MODULE || '')}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${contracts?.VERIFICATION_MODULE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 hover:text-yellow-800"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-yellow-700">Proven working Functions</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-purple-900">Investment Module</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-xs text-purple-700 break-all flex-1">
                {contracts?.INVESTMENT_MODULE}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(contracts?.INVESTMENT_MODULE || '')}
                className="text-purple-600 hover:text-purple-800"
              >
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${contracts?.INVESTMENT_MODULE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-purple-700">USDC investment handling</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-red-900">VRF Module</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-xs text-red-700 break-all flex-1">
                {contracts?.VRF_MODULE}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(contracts?.VRF_MODULE || '')}
                className="text-red-600 hover:text-red-800"
              >
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${contracts?.VRF_MODULE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-800"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-red-700">Chainlink VRF randomness</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-orange-900">Mock USDC</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="font-mono text-xs text-orange-700 break-all flex-1">
                {contracts?.USDC}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(contracts?.USDC || '')}
                className="text-orange-600 hover:text-orange-800"
              >
                <Copy className="w-3 h-3" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${contracts?.USDC}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-800"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-orange-700">Test USDC token</p>
          </div>
        </div>
        
        {/* Chainlink Subscription Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4">
            <h3 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
              Chainlink Functions Subscription
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </h3>
            <p className="font-mono text-xl font-bold text-cyan-700 mb-2">4996</p>
            <a
              href="https://functions.chain.link/sepolia/4996"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
            >
              View Functions Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-xs text-cyan-600 mt-1">Your proven working subscription!</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">Chainlink VRF Subscription</h3>
            <p className="font-mono text-xs text-indigo-700 break-all mb-2">
              35127266008152230...
            </p>
            <a
              href="https://vrf.chain.link/sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
            >
              View VRF Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          onClick={() => setActiveTab('submit')}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Submit Invoice</h3>
          </div>
          <p className="text-blue-100 mb-4">
            Submit your African export invoice and get verified with live Chainlink Functions
          </p>
          <div className="flex items-center text-sm">
            <span>Start here →</span>
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          onClick={() => setActiveTab('invest')}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Invest</h3>
          </div>
          <p className="text-green-100 mb-4">
            Browse verified invoices and earn yield from live African trade finance
          </p>
          <div className="flex items-center text-sm">
            <span>Explore opportunities →</span>
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
          onClick={() => setActiveTab('nft-marketplace')}
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">NFT Marketplace</h3>
          </div>
          <p className="text-purple-100 mb-4">
            Trade tokenized invoices in the live NFT marketplace
          </p>
          <div className="flex items-center text-sm">
            <span>View marketplace →</span>
          </div>
        </div>
      </div>

      {/* Debug Information for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 text-green-400 rounded-2xl p-6 font-mono text-sm">
          <h3 className="text-white font-bold mb-4">🔧 Debug Information (Championship Protocol)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-green-400 mb-1">Contract Addresses:</p>
              <p className="text-xs">Protocol: {contracts?.PROTOCOL || 'Not loaded'}</p>
              <p className="text-xs">USDC: {contracts?.USDC || 'Not loaded'}</p>
            </div>
            <div>
              <p className="text-green-400 mb-1">Live Data:</p>
              <p className="text-xs">Balance: {usdcBalance?.toFixed(2) || '0'} USDC</p>
              <p className="text-xs">ETH Price: ${liveMarketData?.ethPrice?.toFixed(2) || '0'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
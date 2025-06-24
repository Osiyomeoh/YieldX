import React from 'react';
import { Zap } from 'lucide-react';
import { MarketData } from '@/types';
import { formatCurrency } from '@/utils/format';

interface LiveMarketDataProps {
  marketData: MarketData | null;
  loading?: boolean;
  error?: string | null;
}

export function LiveMarketData({ marketData, loading, error }: LiveMarketDataProps) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
          <Zap className="mr-2 text-emerald-500" size={20} />
          Live Chainlink Data
        </h3>
        <div className="flex items-center text-emerald-600 text-sm font-medium">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
          {loading ? 'Loading...' : 'Live'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="text-sm text-slate-600 mb-1">ETH Price</div>
          <div className="text-2xl font-bold text-slate-900">
            {marketData ? formatCurrency(marketData.ethPrice) : '$2,516.23'}
          </div>
          <div className="text-xs text-emerald-600 mt-1">+0.8% today</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="text-sm text-slate-600 mb-1">USDC Price</div>
          <div className="text-2xl font-bold text-slate-900">
            {marketData ? `$${marketData.usdcPrice.toFixed(4)}` : '$0.9998'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Stable</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="text-sm text-slate-600 mb-1">Market Risk</div>
          <div className="text-2xl font-bold text-slate-900">
            {marketData ? `${marketData.marketRisk} bps` : '0 bps'}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Low volatility</div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
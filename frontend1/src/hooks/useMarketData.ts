import { useState, useEffect } from 'react';
import { MarketData } from '@/types';

export function useMarketData() {
  const [marketData, setMarketData] = useState<MarketData>({
    ethPrice: 2516.23,
    usdcPrice: 0.9998,
    timestamp: Date.now() / 1000,
    marketRisk: 0,
  });

  // Simulate live price updates for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        ethPrice: prev.ethPrice + (Math.random() - 0.5) * 10,
        timestamp: Date.now() / 1000,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return marketData;
}

import React, { useMemo } from 'react';
import { InvestmentCalculation } from '@/types';
import { calculateInvestmentReturn } from '@/utils/calculations';
import { formatCurrency } from '@/utils/format';

interface InvestmentCalculatorProps {
  investAmount: string;
  setInvestAmount: (amount: string) => void;
  isConnected: boolean;
  onInvest?: () => void;
}

export function InvestmentCalculator({ 
  investAmount, 
  setInvestAmount, 
  isConnected, 
  onInvest 
}: InvestmentCalculatorProps) {
  const calculation: InvestmentCalculation = useMemo(() => {
    const principal = parseFloat(investAmount) || 0;
    return calculateInvestmentReturn(principal, 10);
  }, [investAmount]);

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 sticky top-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Investment Calculator</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Investment Amount (USDC)
          </label>
          <input
            type="number"
            placeholder="1,000"
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex justify-between mb-2">
            <span className="text-slate-600">Principal</span>
            <span className="font-medium">{formatCurrency(calculation.principal)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-slate-600">Expected Yield (10% APR)</span>
            <span className="font-medium text-emerald-600">
              {formatCurrency(calculation.expectedYield)}
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between">
            <span className="font-semibold">Total Return</span>
            <span className="font-bold text-lg">{formatCurrency(calculation.totalReturn)}</span>
          </div>
        </div>
        
        <button 
          onClick={onInvest}
          disabled={!isConnected}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
        >
          {isConnected ? 'Invest Now' : 'Connect Wallet to Invest'}
        </button>
      </div>
    </div>
  );
}
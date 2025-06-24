import { InvestmentCalculation } from '@/types';

export function calculateInvestmentReturn(
  principal: number, 
  apr: number, 
  termDays: number = 90
): InvestmentCalculation {
  const annualizedReturn = principal * (apr / 100);
  const termReturn = (annualizedReturn * termDays) / 365;
  
  return {
    principal,
    expectedYield: termReturn,
    totalReturn: principal + termReturn,
    apr,
  };
}

export function calculateAPR(
  baseAPR: number,
  riskScore: number,
  marketRisk: number = 0
): number {
  const riskPremium = riskScore * 10; // Convert to basis points
  return baseAPR + riskPremium + marketRisk;
}

export function calculateFundingProgress(
  currentAmount: number,
  targetAmount: number
): number {
  if (targetAmount === 0) return 0;
  return Math.min((currentAmount / targetAmount) * 100, 100);
}

export function calculatePlatformFee(
  amount: number,
  feeBasisPoints: number = 250
): number {
  return (amount * feeBasisPoints) / 10000;
}
import { SubmitInvoiceForm } from '@/types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateInvoiceForm(form: SubmitInvoiceForm): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!form.commodity.trim()) {
    errors.push({ field: 'commodity', message: 'Commodity is required' });
  }

  const amount = parseFloat(form.amount);
  if (!form.amount || isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'Valid amount is required' });
  } else if (amount < 1000) {
    errors.push({ field: 'amount', message: 'Minimum amount is $1,000' });
  } else if (amount > 10000000) {
    errors.push({ field: 'amount', message: 'Maximum amount is $10,000,000' });
  }

  if (!form.exporterName.trim()) {
    errors.push({ field: 'exporterName', message: 'Exporter name is required' });
  } else if (form.exporterName.length < 2) {
    errors.push({ field: 'exporterName', message: 'Exporter name too short' });
  }

  if (!form.buyerName.trim()) {
    errors.push({ field: 'buyerName', message: 'Buyer name is required' });
  }

  if (!form.destination.trim()) {
    errors.push({ field: 'destination', message: 'Destination is required' });
  }

  return errors;
}

export function validateInvestmentAmount(amount: string): string | null {
  const numAmount = parseFloat(amount);
  
  if (!amount || isNaN(numAmount)) {
    return 'Valid amount is required';
  }
  
  if (numAmount < 100) {
    return 'Minimum investment is $100';
  }
  
  if (numAmount > 1000000) {
    return 'Maximum investment is $1,000,000';
  }
  
  return null;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
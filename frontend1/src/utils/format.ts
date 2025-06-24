export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  
  export function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
  
  export function formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  export function formatTimeAgo(timestamp: number): string {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
  
  export function formatBigInt(value: bigint, decimals: number = 18): string {
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    if (remainder === BigInt(0)) {
      return quotient.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    
    return `${quotient}.${trimmedRemainder}`;
  }
  
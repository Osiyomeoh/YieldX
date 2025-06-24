export interface ContractConfig {
  address: string;
  abi: any[];
}

export interface ChainlinkFeeds {
  ETH_USD: string;
  USDC_USD: string;
}

export const CHAIN_CONFIG = {
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/demo',
  }
};

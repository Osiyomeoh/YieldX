// src/wagmi.ts - Wagmi v2.9+ Config
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'YieldX Protocol',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '2f05a7cde2bb14fabf75a97db2e9023f',
  chains: [sepolia],
  ssr: false,
});
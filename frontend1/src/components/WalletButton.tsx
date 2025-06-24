// src/components/ui/WalletButton.tsx - Simple RainbowKit Button
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletButton() {
  return (
    <ConnectButton 
      label="Connect Wallet"
      chainStatus="icon"
      accountStatus="address"
      showBalance={true}
    />
  );
}
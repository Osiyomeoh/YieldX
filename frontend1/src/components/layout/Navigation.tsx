// src/components/layout/Navigation.tsx - Fully Responsive Tab Navigation
import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Home, BarChart3, TrendingUp, FileText, Coins, Users, Shield,
  Sparkles, Menu, X
} from 'lucide-react';
import { TabId } from '../../types/index';

interface NavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isCommitteeMember?: boolean;
  committeeRole?: string | null;
}

export function Navigation({ 
  activeTab, 
  setActiveTab, 
  isCommitteeMember = false,
  committeeRole = null 
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'home' as TabId,
      label: 'Home',
      shortLabel: 'Home',
      icon: Home,
    },
    {
      id: 'dashboard' as TabId,
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      icon: BarChart3,
    },
    {
      id: 'invest' as TabId,
      label: 'Invest',
      shortLabel: 'Invest',
      icon: TrendingUp,
    },
    {
      id: 'submit' as TabId,
      label: 'Submit Invoice',
      shortLabel: 'Submit',
      icon: FileText,
    },
    {
      id: 'nft-marketplace' as TabId,
      label: 'NFT Gallery',
      shortLabel: 'NFT',
      icon: Sparkles,
    },
  ];

  // Add committee tab for committee members
  if (isCommitteeMember) {
    navigationItems.splice(2, 0, {
      id: 'committee' as TabId,
      label: 'Committee',
      shortLabel: 'Committee',
      icon: Shield,
    });
  }

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full max-w-none px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Responsive */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 sm:p-2 rounded-lg">
              <Coins className="w-4 h-4 sm:w-5 lg:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                <span className="hidden sm:inline">YieldX Protocol</span>
                <span className="sm:hidden">YieldX</span>
              </h1>
              <p className="text-xs text-gray-500 hidden lg:block">Trade Finance Platform</p>
            </div>
          </div>

          {/* Navigation Tabs - Responsive */}
          <div className="hidden sm:flex items-center justify-center flex-1 mx-4">
            <div className="flex items-center space-x-1 lg:space-x-2 max-w-4xl">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-xs sm:text-sm lg:text-base ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    {/* Show full label on larger screens, short on smaller */}
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.shortLabel}</span>
                    {item.id === 'committee' && (
                      <span className="hidden xl:inline text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded ml-1">
                        {committeeRole?.split(' ')[0] || 'Member'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side - Responsive */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
            {/* Committee Badge - Responsive */}
            {isCommitteeMember && (
              <div className="hidden xl:flex items-center gap-2 bg-purple-50 text-purple-700 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-purple-200">
                <Shield className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="text-xs lg:text-sm font-medium">Committee</span>
              </div>
            )}

            {/* Committee Badge - Mobile/Tablet */}
            {isCommitteeMember && (
              <div className="xl:hidden flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Committee</span>
              </div>
            )}

            {/* Wallet Connect - Responsive */}
            <div className="min-w-0">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-xs sm:text-sm lg:text-base whitespace-nowrap"
                            >
                              <span className="hidden md:inline">Connect Wallet</span>
                              <span className="md:hidden">Connect</span>
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              className="bg-red-600 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                            >
                              Wrong Network
                            </button>
                          );
                        }

                        return (
                          <div className="flex items-center gap-1 sm:gap-2">
                            {/* Chain Button - Hide on small screens */}
                            <button
                              onClick={openChainModal}
                              className="hidden lg:flex bg-gray-100 text-gray-700 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs lg:text-sm font-medium hover:bg-gray-200 transition-colors items-center gap-1 lg:gap-2"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 14,
                                    height: 14,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 14, height: 14 }}
                                    />
                                  )}
                                </div>
                              )}
                              <span className="hidden xl:inline">{chain.name}</span>
                              <span className="xl:hidden">{chain.name?.slice(0, 4)}</span>
                            </button>

                            {/* Account Button - Responsive */}
                            <button
                              onClick={openAccountModal}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-xs sm:text-sm lg:text-base min-w-0"
                            >
                              <span className="hidden lg:inline truncate">
                                {account.displayName}
                                {account.displayBalance ? ` (${account.displayBalance})` : ''}
                              </span>
                              <span className="hidden sm:inline lg:hidden truncate">
                                {account.displayName}
                              </span>
                              <span className="sm:hidden truncate">
                                {account.displayName?.slice(0, 4)}...
                              </span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Only for very small screens */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 py-3">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.id === 'committee' && (
                      <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        {committeeRole?.split(' ')[0] || 'Member'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Committee Info */}
            {isCommitteeMember && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Committee Member</span>
                  {committeeRole && (
                    <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      {committeeRole}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar - Responsive */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-1.5 sm:py-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-4 text-gray-600 min-w-0">
              <span className="flex items-center gap-1 flex-shrink-0">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                <span className="hidden sm:inline">Live on Sepolia</span>
                <span className="sm:hidden">Live</span>
              </span>
              <span className="hidden md:inline whitespace-nowrap">Powered by Chainlink</span>
            </div>
            <div className="text-gray-500 text-xs sm:text-sm text-right min-w-0 truncate">
              {activeTab === 'home' && (
                <>
                  <span className="hidden sm:inline">Welcome to YieldX Protocol</span>
                  <span className="sm:hidden">Welcome</span>
                </>
              )}
              {activeTab === 'dashboard' && (
                <>
                  <span className="hidden sm:inline">Your Investment Overview</span>
                  <span className="sm:hidden">Dashboard</span>
                </>
              )}
              {activeTab === 'invest' && (
                <>
                  <span className="hidden sm:inline">Investment Opportunities</span>
                  <span className="sm:hidden">Invest</span>
                </>
              )}
              {activeTab === 'submit' && (
                <>
                  <span className="hidden sm:inline">Submit Trade Finance Invoice</span>
                  <span className="sm:hidden">Submit Invoice</span>
                </>
              )}
              {activeTab === 'committee' && (
                <>
                  <span className="hidden sm:inline">Committee Dashboard</span>
                  <span className="sm:hidden">Committee</span>
                </>
              )}
              {activeTab === 'nft-marketplace' && (
                <>
                  <span className="hidden sm:inline">NFT Invoice Gallery</span>
                  <span className="sm:hidden">NFT Gallery</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
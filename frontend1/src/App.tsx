// src/App.tsx - Complete YieldX App with URL Persistence
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import { TabId } from './types/index';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/pages/LandingPage';
import { Dashboard } from './components/pages/Dashboard';
import  InvestPage  from './components/pages/InvestPage';
import { SubmitInvoice } from './components/pages/SubmitInvoice';
// import { NFTInvoiceGallery } from './components/NFTInvoiceGallery';

import { VideoModal } from './components/ui/VideoModal';
import { useYieldX } from './hooks/useYieldX';
import { useInvestmentCommittee } from './hooks/useInvestmentCommittee';
// import { useNFTInvoiceSystem } from './hooks/useNFTIvoiceSystem';

const queryClient = new QueryClient();

// Map URL paths to tab IDs
const PATH_TO_TAB: Record<string, TabId> = {
  '/': 'home',
  '/dashboard': 'dashboard',
  '/invest': 'invest',
  '/submit': 'submit',
  '/nft-marketplace': 'nft-marketplace',
  '/committee': 'committee',
};

// Map tab IDs to URL paths
const TAB_TO_PATH: Record<TabId, string> = {
  'home': '/',
  'dashboard': '/dashboard',
  'invest': '/invest',
  'submit': '/submit',
  'nft-marketplace': '/nft-marketplace',
  'committee': '/committee',
};

function AppContent() {
  // Get initial tab from URL
  const getInitialTab = (): TabId => {
    const currentPath = window.location.pathname;
    return PATH_TO_TAB[currentPath] || 'home';
  };

  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);
  const [investAmount, setInvestAmount] = useState<string>('1000');
  const [showVideo, setShowVideo] = useState<boolean>(false);

  // Hooks for blockchain integration
  const { isConnected, submitInvoice, loading } = useYieldX();
  // const { isCommitteeMember, committeeRole } = useInvestmentCommittee();
  // const { getNFTStats } = useNFTInvoiceSystem();

  // Sync tab changes with URL
  const handleTabChange = (newTab: TabId) => {
    setActiveTab(newTab);
    const newPath = TAB_TO_PATH[newTab];
    window.history.pushState({}, '', newPath);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const newTab = PATH_TO_TAB[currentPath] || 'home';
      setActiveTab(newTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL on initial load if needed
  useEffect(() => {
    const currentPath = window.location.pathname;
    const expectedPath = TAB_TO_PATH[activeTab];
    
    if (currentPath !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }
  }, []); // Only run on mount

  // Get real data from hooks
  // const nftStats = getNFTStats();
  // const totalVolume = nftStats.totalValue || 2450000;
  // const currentAPR = nftStats.averageAPR || 10.0;
  // const activeInvoices = nftStats.totalNFTs || 12;

  const handleVideoClose = () => setShowVideo(false);
  const handleTryDemo = () => handleTabChange('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} // Use the new handler
       
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'home' && (
          <LandingPage 
            setActiveTab={handleTabChange} // Use the new handler
            setShowVideo={setShowVideo}
            totalVolume={0}
            currentAPR={0}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard 
          setActiveTab={handleTabChange}
        />
        )}
        
        {activeTab === 'invest' && (
          <InvestPage 
            investAmount={investAmount}
            setInvestAmount={setInvestAmount}
          />
        )}
        
        {activeTab === 'submit' && (
          <SubmitInvoice />
        )}

        {/* {activeTab === 'nft-marketplace' && (
          <NFTInvoiceGallery />
        )} */}

        
      </main>

      <VideoModal 
        isOpen={showVideo}
        onClose={handleVideoClose}
        onTryDemo={handleTryDemo}
      />

      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
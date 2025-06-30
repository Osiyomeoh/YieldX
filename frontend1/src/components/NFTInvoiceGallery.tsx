// // src/components/NFTInvoiceGallery.tsx - Seamless Investment Experience
// import React, { useState } from 'react';
// import {
//   FileText, Shield, TrendingUp, ExternalLink, Hash, Clock, DollarSign,
//   Award, Users, MapPin, Calendar, Target, Zap, Eye, ShoppingCart,
//   Download, Upload, CheckCircle, AlertCircle, XCircle, Loader2, X, 
//   Calculator, ArrowRight, Wallet
// } from 'lucide-react';
// import { useNFTInvoiceSystem } from '../hooks/useNFTIvoiceSystem';
// import { formatUnits } from 'viem';
// import { NFTInvoiceData, NFTInvoiceStatus } from '../types';

// export function NFTInvoiceGallery() {
//   const {
//     invoiceNFTs,
//     ownedNFTs,
//     loading,
//     txHash,
//     totalSupply,
//     submitInvoiceAndMintNFT,
//     verifyInvoiceNFT,
//     investInNFTInvoice,
//     transferNFTInvoice,
//     getNFTStats,
//     CONTRACTS
//   } = useNFTInvoiceSystem();

//   const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
//   const [showMintForm, setShowMintForm] = useState(false);
//   const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'marketplace'>('all');
//   const [processingTx, setProcessingTx] = useState<string | null>(null);
  
//   // Investment Modal State
//   const [investmentModal, setInvestmentModal] = useState<{
//     isOpen: boolean;
//     nft: NFTInvoiceData | null;
//     amount: string;
//     calculatedYield: number;
//     calculatedReturn: number;
//   }>({
//     isOpen: false,
//     nft: null,
//     amount: '',
//     calculatedYield: 0,
//     calculatedReturn: 0
//   });

//   // Transfer Modal State
//   const [transferModal, setTransferModal] = useState<{
//     isOpen: boolean;
//     tokenId: number | null;
//     recipientAddress: string;
//   }>({
//     isOpen: false,
//     tokenId: null,
//     recipientAddress: ''
//   });

//   const [newInvoice, setNewInvoice] = useState({
//     commodity: '',
//     amount: '',
//     exporterName: '',
//     buyerName: '',
//     destination: '',
//     documentHash: ''
//   });

//   const stats = getNFTStats();

//   // Add default values for missing properties in NFTInvoiceData
//   const defaultNFT: NFTInvoiceData = {
//     tokenId: '',
//     owner: '',
//     amount: 0,
//     commodity: '',
//     exporterName: '',
//     status: 0,
//     fundingProgress: 0,
//     finalAPR: 0,
//     investorCount: 0,
//     chainlinkVerified: false,
//     buyerName: '',
//     destination: '',
//     documentHash: '',
//     committeeApproved: false,
//     totalYieldPaid: 0,
//     dueDate: 0,
//     createdAt: 0,
//     riskScore: 0,
//   };

//   const getStatusIcon = (status: NFTInvoiceStatus) => {
//     switch (status) {
//       case NFTInvoiceStatus.PENDING: return <Clock className="w-5 h-5 text-orange-500" />;
//       case NFTInvoiceStatus.VERIFIED: return <Shield className="w-5 h-5 text-blue-500" />;
//       case NFTInvoiceStatus.FUNDED: return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case NFTInvoiceStatus.PAID: return <Award className="w-5 h-5 text-purple-500" />;
//       default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
//     }
//   };

//   const getStatusText = (status: NFTInvoiceStatus) => {
//     switch (status) {
//       case NFTInvoiceStatus.PENDING: return 'Pending Verification';
//       case NFTInvoiceStatus.VERIFIED: return 'Verified & Open';
//       case NFTInvoiceStatus.FUNDED: return 'Fully Funded';
//       case NFTInvoiceStatus.PAID: return 'Completed';
//       default: return 'Unknown';
//     }
//   };

//   const getStatusColor = (status: NFTInvoiceStatus) => {
//     switch (status) {
//       case NFTInvoiceStatus.PENDING: return 'bg-orange-100 text-orange-800 border-orange-200';
//       case NFTInvoiceStatus.VERIFIED: return 'bg-blue-100 text-blue-800 border-blue-200';
//       case NFTInvoiceStatus.FUNDED: return 'bg-green-100 text-green-800 border-green-200';
//       case NFTInvoiceStatus.PAID: return 'bg-purple-100 text-purple-800 border-purple-200';
//       default: return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   // Calculate investment yield and return
//   const calculateInvestmentReturns = (amount: string, apr: number) => {
//     const principal = parseFloat(amount) || 0;
//     const annualYield = (principal * apr) / 10000; // APR is in basis points
//     const quarterlyYield = annualYield / 4; // Assuming 90-day terms
//     const totalReturn = principal + quarterlyYield;
    
//     return {
//       yield: quarterlyYield,
//       totalReturn: totalReturn
//     };
//   };

//   // Open investment modal
//   const openInvestmentModal = (nft: NFTInvoiceData) => {
//     setInvestmentModal({
//       isOpen: true,
//       nft,
//       amount: '1000',
//       calculatedYield: 0,
//       calculatedReturn: 0
//     });
//   };

//   // Update investment calculations when amount changes
//   const updateInvestmentAmount = (amount: string) => {
//     if (!investmentModal.nft) return;
    
//     const calculations = calculateInvestmentReturns(amount, investmentModal.nft.finalAPR);
//     setInvestmentModal(prev => ({
//       ...prev,
//       amount,
//       calculatedYield: calculations.yield,
//       calculatedReturn: calculations.totalReturn
//     }));
//   };

//   // Open transfer modal
//   const openTransferModal = (tokenId: number) => {
//     setTransferModal({
//       isOpen: true,
//       tokenId,
//       recipientAddress: ''
//     });
//   };

//   // REAL BLOCKCHAIN INTERACTION: Mint NFT Invoice
//   const handleMintNFT = async () => {
//     if (!newInvoice.commodity || !newInvoice.amount || !newInvoice.exporterName) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     setProcessingTx('minting');
//     console.log('🪙 Starting NFT mint transaction...', {
//       commodity: newInvoice.commodity,
//       amount: newInvoice.amount,
//       exporter: newInvoice.exporterName,
//       contracts: CONTRACTS
//     });

//     try {
//       const result = await submitInvoiceAndMintNFT(
//         newInvoice.commodity,
//         newInvoice.amount,
//         newInvoice.exporterName,
//         newInvoice.buyerName || 'International Buyer',
//         newInvoice.destination || 'Global Markets',
//         newInvoice.documentHash || `0x${Math.random().toString(16).substr(2, 40)}`
//       );

//       if ('tokenId' in result) {
//         console.log('✅ NFT minted successfully!', {
//           tokenId: result.tokenId,
//           txHash: result.hash
//         });

//         setNewInvoice({
//           commodity: '',
//           amount: '',
//           exporterName: '',
//           buyerName: '',
//           destination: '',
//           documentHash: ''
//         });
//         setShowMintForm(false);
        
//         alert(`🎉 NFT Invoice minted successfully!\n\nToken ID: ${result.tokenId}\nTX: ${result.hash}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${result.hash}`);
//       } else {
//         console.error('❌ Minting failed:', result.error);
//         alert(`❌ Minting failed: ${result.error}`);
//       }
//     } catch (error: any) {
//       console.error('❌ Mint transaction error:', error);
//       alert(`❌ Transaction failed: ${error.message}`);
//     } finally {
//       setProcessingTx(null);
//     }
//   };

//   // REAL BLOCKCHAIN INTERACTION: Verify NFT with Committee/Chainlink
//   const handleVerifyNFT = async (tokenId: number) => {
//     setProcessingTx('verifying');
//     console.log('🔗 Starting NFT verification...', { tokenId });

//     try {
//       const result = await verifyInvoiceNFT(tokenId, 25); // Risk score of 25
      
//       if ('tokenId' in result) {
//         console.log('✅ NFT verified successfully!', result.hash);
//         alert(`🔗 NFT verified with Chainlink!\n\nTX: ${result.hash}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${result.hash}`);
//       } else {
//         console.error('❌ Verification failed:', result.error);
//         alert(`❌ Verification failed: ${result.error}`);
//       }
//     } catch (error: any) {
//       console.error('❌ Verification error:', error);
//       alert(`❌ Verification failed: ${error.message}`);
//     } finally {
//       setProcessingTx(null);
//     }
//   };

//   // REAL BLOCKCHAIN INTERACTION: Seamless Investment
//   const handleInvestment = async () => {
//     if (!investmentModal.nft || !investmentModal.amount.trim()) {
//       return;
//     }

//     setProcessingTx('investing');
//     console.log('💰 Starting investment transaction...', {
//       tokenId: investmentModal.nft.tokenId,
//       amount: investmentModal.amount,
//       contracts: CONTRACTS
//     });

//     try {
//       const result = await investInNFTInvoice(investmentModal.nft.tokenId, investmentModal.amount);
      
//       if ('tokenId' in result) {
//         console.log('✅ Investment successful!', result.hash);
//         setInvestmentModal({ isOpen: false, nft: null, amount: '', calculatedYield: 0, calculatedReturn: 0 });
//         alert(`💰 Investment successful!\n\nAmount: ${investmentModal.amount} USDC\nTX: ${result.hash}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${result.hash}`);
//       } else {
//         console.error('❌ Investment failed:', result.error);
//         alert(`❌ Investment failed: ${result.error}`);
//       }
//     } catch (error: any) {
//       console.error('❌ Investment error:', error);
//       alert(`❌ Investment failed: ${error.message}`);
//     } finally {
//       setProcessingTx(null);
//     }
//   };

//   // REAL BLOCKCHAIN INTERACTION: Seamless Transfer
//   const handleTransfer = async () => {
//     if (!transferModal.tokenId || !transferModal.recipientAddress.trim()) {
//       return;
//     }

//     setProcessingTx('transferring');
//     console.log('🔄 Starting NFT transfer...', { 
//       tokenId: transferModal.tokenId, 
//       toAddress: transferModal.recipientAddress 
//     });

//     try {
//       const result = await transferNFTInvoice(transferModal.tokenId, transferModal.recipientAddress);
      
//       if ('tokenId' in result) {
//         console.log('✅ NFT transfer successful!');
//         setTransferModal({ isOpen: false, tokenId: null, recipientAddress: '' });
//         alert(`🔄 NFT transferred successfully!\n\nTo: ${transferModal.recipientAddress}\nToken ID: ${transferModal.tokenId}`);
//       } else {
//         console.error('❌ Transfer failed:', result.error);
//         alert(`❌ Transfer failed: ${result.error}`);
//       }
//     } catch (error: any) {
//       console.error('❌ Transfer error:', error);
//       alert(`❌ Transfer failed: ${error.message}`);
//     } finally {
//       setProcessingTx(null);
//     }
//   };

//   const filteredNFTs = () => {
//     switch (activeTab) {
//       case 'owned': return ownedNFTs;
//       case 'marketplace': return invoiceNFTs.filter((nft: NFTInvoiceData) => 
//         nft.status === NFTInvoiceStatus.VERIFIED && nft.fundingProgress < 100
//       );
//       default: return invoiceNFTs;
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto p-6 space-y-6">
//       {/* Header with Real Blockchain Stats */}
//       <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg p-6">
//         <h1 className="text-3xl font-bold mb-2">NFT Invoice Marketplace</h1>
//         <p className="text-indigo-100">Tokenized African trade invoices on the blockchain</p>
        
//         {/* Real Blockchain Data */}
//         <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//           <div className="bg-white/20 rounded-lg p-3">
//             <p className="text-indigo-200">Total NFTs</p>
//             <p className="text-xl font-bold">{stats.totalNFTs}</p>
//           </div>
//           <div className="bg-white/20 rounded-lg p-3">
//             <p className="text-indigo-200">You Own</p>
//             <p className="text-xl font-bold">{stats.ownedCount}</p>
//           </div>
//           <div className="bg-white/20 rounded-lg p-3">
//             <p className="text-indigo-200">Total Value</p>
//             <p className="text-xl font-bold">${stats.totalValue.toLocaleString()}</p>
//           </div>
//           <div className="bg-white/20 rounded-lg p-3">
//             <p className="text-indigo-200">Avg APR</p>
//             <p className="text-xl font-bold">{stats.averageAPR.toFixed(1)}%</p>
//           </div>
//         </div>

//         {/* Live Blockchain Status */}
//         <div className="mt-4 flex items-center gap-4 text-sm">
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//             <span>Live on Base Sepolia</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Zap className="w-4 h-4 text-orange-300" />
//             <span>Chainlink Powered</span>
//           </div>
//           {totalSupply > 0 && (
//             <div className="flex items-center gap-2">
//               <FileText className="w-4 h-4 text-blue-300" />
//               <span>{totalSupply} NFTs Minted</span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Processing Status */}
//       {processingTx && (
//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//           <div className="flex items-center gap-3">
//             <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
//             <div>
//               <p className="font-medium text-blue-900">
//                 {processingTx === 'minting' && 'Minting NFT Invoice...'}
//                 {processingTx === 'verifying' && 'Verifying with Chainlink...'}
//                 {processingTx === 'investing' && 'Processing Investment...'}
//                 {processingTx === 'transferring' && 'Transferring NFT...'}
//               </p>
//               <p className="text-sm text-blue-700">Please confirm transaction in your wallet</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Navigation Tabs */}
//       <div className="bg-white rounded-lg shadow-lg">
//         <div className="border-b border-gray-200">
//           <nav className="flex space-x-8 px-6" aria-label="Tabs">
//             {[
//               { id: 'all', name: 'All NFTs', count: invoiceNFTs.length },
//               { id: 'owned', name: 'My NFTs', count: ownedNFTs.length },
//               { id: 'marketplace', name: 'Marketplace', count: invoiceNFTs.filter((nft: NFTInvoiceData) => nft.status === NFTInvoiceStatus.VERIFIED).length }
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id as any)}
//                 className={`${
//                   activeTab === tab.id
//                     ? 'border-indigo-500 text-indigo-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
//               >
//                 {tab.name}
//                 <span className={`${
//                   activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'
//                 } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
//                   {tab.count}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Action Bar with Real TX Links */}
//         <div className="p-6 border-b border-gray-200 flex justify-between items-center">
//           <div className="flex items-center gap-4">
//             <h3 className="text-lg font-semibold">
//               {activeTab === 'all' && 'All Invoice NFTs'}
//               {activeTab === 'owned' && 'Your Invoice NFTs'}
//               {activeTab === 'marketplace' && 'Investment Marketplace'}
//             </h3>
//             {txHash && (
//               <a
//                 href={`https://sepolia.etherscan.io/tx/${txHash}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm bg-blue-50 px-3 py-1 rounded-lg"
//               >
//                 <ExternalLink className="w-4 h-4" />
//                 Latest TX: {txHash.slice(0, 6)}...{txHash.slice(-4)}
//               </a>
//             )}
//           </div>
//           <button
//             onClick={() => setShowMintForm(!showMintForm)}
//             disabled={loading || processingTx !== null}
//             className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
//           >
//             {processingTx === 'minting' ? (
//               <Loader2 className="w-4 h-4 animate-spin" />
//             ) : (
//               <Upload className="w-4 h-4" />
//             )}
//             Mint Invoice NFT
//           </button>
//         </div>

//         {/* Mint Form with Blockchain Integration */}
//         {showMintForm && (
//           <div className="p-6 bg-gray-50 border-b border-gray-200">
//             <h4 className="font-semibold mb-4">Create New Invoice NFT</h4>
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
//               <p className="text-sm text-blue-800">
//                 <Shield className="w-4 h-4 inline mr-2" />
//                 This will create a real NFT on Base Sepolia blockchain
//               </p>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Commodity *</label>
//                 <input
//                   type="text"
//                   value={newInvoice.commodity}
//                   onChange={(e) => setNewInvoice({...newInvoice, commodity: e.target.value})}
//                   placeholder="Ethiopian Coffee Beans"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USDC) *</label>
//                 <input
//                   type="number"
//                   value={newInvoice.amount}
//                   onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
//                   placeholder="25000"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Exporter Name *</label>
//                 <input
//                   type="text"
//                   value={newInvoice.exporterName}
//                   onChange={(e) => setNewInvoice({...newInvoice, exporterName: e.target.value})}
//                   placeholder="Highland Coffee Co."
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Name</label>
//                 <input
//                   type="text"
//                   value={newInvoice.buyerName}
//                   onChange={(e) => setNewInvoice({...newInvoice, buyerName: e.target.value})}
//                   placeholder="European Coffee Roasters"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
//                 <input
//                   type="text"
//                   value={newInvoice.destination}
//                   onChange={(e) => setNewInvoice({...newInvoice, destination: e.target.value})}
//                   placeholder="Hamburg, Germany"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Document Hash</label>
//                 <input
//                   type="text"
//                   value={newInvoice.documentHash}
//                   onChange={(e) => setNewInvoice({...newInvoice, documentHash: e.target.value})}
//                   placeholder="0xa1b2c3d4e5f6..."
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//             </div>
            
//             <div className="mt-4 flex gap-2">
//               <button
//                 onClick={handleMintNFT}
//                 disabled={loading || processingTx !== null}
//                 className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
//               >
//                 {processingTx === 'minting' ? (
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <FileText className="w-4 h-4" />
//                 )}
//                 {processingTx === 'minting' ? 'Minting...' : 'Mint Invoice NFT'}
//               </button>
//               <button
//                 onClick={() => setShowMintForm(false)}
//                 disabled={processingTx !== null}
//                 className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* NFT Grid with Seamless Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredNFTs().map((nft: NFTInvoiceData) => (
//           <div key={nft.tokenId} className="bg-white rounded-lg shadow-lg overflow-hidden border hover:shadow-xl transition-shadow">
//             {/* NFT Header */}
//             <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-sm font-medium opacity-90">Token ID #{nft.tokenId}</span>
//                 {getStatusIcon(nft.status)}
//               </div>
//               <h3 className="text-lg font-bold">{nft.commodity}</h3>
//               <p className="text-blue-100 text-sm">{nft.exporterName}</p>
//             </div>

//             {/* NFT Content */}
//             <div className="p-4 space-y-4">
//               {/* Status Badge */}
//               <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(nft.status)}`}>
//                 {getStatusIcon(nft.status)}
//                 {getStatusText(nft.status)}
//               </div>

//               {/* Key Metrics from Blockchain */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-gray-600 text-sm">Invoice Amount</p>
//                   <p className="font-semibold text-lg">${Number(formatUnits(nft.amount, 6)).toLocaleString()}</p>
//                 </div>
//                 {nft.finalAPR > 0 && (
//                   <div>
//                     <p className="text-gray-600 text-sm">APR</p>
//                     <p className="font-semibold text-lg text-green-600">{(nft.finalAPR / 100).toFixed(1)}%</p>
//                   </div>
//                 )}
//               </div>

//               {/* Live Funding Progress */}
//               {nft.status >= NFTInvoiceStatus.VERIFIED && (
//                 <div>
//                   <div className="flex justify-between text-sm text-gray-600 mb-2">
//                     <span>Funding Progress</span>
//                     <span>{nft.fundingProgress.toFixed(1)}%</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-2">
//                     <div 
//                       className="bg-green-500 h-2 rounded-full transition-all duration-300"
//                       style={{ width: `${Math.min(nft.fundingProgress, 100)}%` }}
//                     />
//                   </div>
//                   <div className="flex justify-between text-xs text-gray-500 mt-1">
//                     <span>{nft.investorCount} investors</span>
//                     <span>${(Number(formatUnits(nft.amount, 6)) * 0.85).toLocaleString()} target</span>
//                   </div>
//                 </div>
//               )}

//               {/* Blockchain Verification Badges */}
//               <div className="flex gap-2 flex-wrap">
//                 {nft.chainlinkVerified && (
//                   <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
//                     <Zap className="w-3 h-3" />
//                     Chainlink Verified
//                   </span>
//                 )}
//                 {nft.committeeApproved && (
//                   <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
//                     <Shield className="w-3 h-3" />
//                     Committee Approved
//                   </span>
//                 )}
//                 <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
//                   <FileText className="w-3 h-3" />
//                   On-Chain
//                 </span>
//               </div>
//             </div>

//             {/* Seamless Blockchain Actions */}
//             <div className="px-4 pb-4">
//               <div className="flex gap-2 flex-wrap">
//                 <button
//                   onClick={() => setSelectedNFT(selectedNFT === nft.tokenId ? null : nft.tokenId)}
//                   className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
//                 >
//                   <Eye className="w-4 h-4" />
//                   Details
//                 </button>
                
//                 {/* Verify NFT (for pending NFTs) */}
//                 {nft.status === NFTInvoiceStatus.PENDING && (
//                   <button
//                     onClick={() => handleVerifyNFT(nft.tokenId)}
//                     disabled={processingTx !== null}
//                     className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
//                   >
//                     {processingTx === 'verifying' ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Zap className="w-4 h-4" />
//                     )}
//                     Verify
//                   </button>
//                 )}

//                 {/* Seamless Investment Button */}
//                 {nft.status === NFTInvoiceStatus.VERIFIED && nft.fundingProgress < 100 && (
//                   <button
//                     onClick={() => openInvestmentModal(nft)}
//                     disabled={processingTx !== null}
//                     className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
//                   >
//                     {processingTx === 'investing' ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <ShoppingCart className="w-4 h-4" />
//                     )}
//                     Invest
//                   </button>
//                 )}
                
//                 {/* Seamless Transfer Button */}
//                 {ownedNFTs.some((owned: NFTInvoiceData) => owned.tokenId === nft.tokenId) && (
//                   <button
//                     onClick={() => openTransferModal(nft.tokenId)}
//                     disabled={processingTx !== null}
//                     className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
//                   >
//                     {processingTx === 'transferring' ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Upload className="w-4 h-4" />
//                     )}
//                     Transfer
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Expanded Details with Blockchain Links */}
//             {selectedNFT === nft.tokenId && (
//               <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
//                 <h4 className="font-semibold text-gray-900">Blockchain Information</h4>
                
//                 {/* Real Contract Links */}
//                 <div>
//                   <p className="text-sm font-medium text-gray-700 mb-2">Smart Contract Verification</p>
//                   <div className="space-y-2">
//                     <a
//                       href={`https://sepolia.etherscan.io/address/${CONTRACTS.INVOICE_NFT}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
//                     >
//                       <ExternalLink className="w-3 h-3" />
//                       NFT Contract: {CONTRACTS.INVOICE_NFT.slice(0, 8)}...{CONTRACTS.INVOICE_NFT.slice(-6)}
//                     </a>
//                     <a
//                       href={`https://sepolia.etherscan.io/address/${CONTRACTS.PROTOCOL}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
//                     >
//                       <ExternalLink className="w-3 h-3" />
//                       Protocol Contract: {CONTRACTS.PROTOCOL.slice(0, 8)}...{CONTRACTS.PROTOCOL.slice(-6)}
//                     </a>
//                     <a
//                       href={`https://sepolia.etherscan.io/address/${nft.owner}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 bg-green-50 px-2 py-1 rounded"
//                     >
//                       <ExternalLink className="w-3 h-3" />
//                       Owner Address: {nft.owner.slice(0, 8)}...{nft.owner.slice(-6)}
//                     </a>
//                   </div>
//                 </div>

//                 {/* Quick Investment Interface */}
//                 {nft.status === NFTInvoiceStatus.VERIFIED && nft.fundingProgress < 100 && (
//                   <div className="border-t border-gray-200 pt-4">
//                     <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
//                       <Calculator className="w-4 h-4 text-green-600" />
//                       Quick Investment Calculator
//                     </h5>
//                     <div className="grid grid-cols-3 gap-2 mb-3">
//                       {['500', '1000', '2500'].map((amount) => {
//                         const calculations = calculateInvestmentReturns(amount, nft.finalAPR);
//                         return (
//                           <button
//                             key={amount}
//                             onClick={() => openInvestmentModal(nft)}
//                             className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-3 text-left transition-colors"
//                           >
//                             <p className="text-sm font-medium text-green-800">${amount}</p>
//                             <p className="text-xs text-green-600">+${calculations.yield.toFixed(0)} yield</p>
//                           </button>
//                         );
//                       })}
//                     </div>
//                     <button
//                       onClick={() => openInvestmentModal(nft)}
//                       className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
//                     >
//                       <Calculator className="w-4 h-4" />
//                       Calculate Custom Investment
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Empty State */}
//       {filteredNFTs().length === 0 && (
//         <div className="text-center py-12">
//           <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">
//             {activeTab === 'owned' ? 'No NFTs Owned' : 
//              activeTab === 'marketplace' ? 'No Investments Available' : 
//              'No NFTs Found'}
//           </h3>
//           <p className="text-gray-500 mb-4">
//             {activeTab === 'owned' ? 'You haven\'t minted or received any invoice NFTs yet.' :
//              activeTab === 'marketplace' ? 'No verified invoices are currently open for investment.' :
//              'No invoice NFTs have been created yet.'}
//           </p>
//           {activeTab !== 'marketplace' && (
//             <div className="space-y-2">
//               <button
//                 onClick={() => setShowMintForm(true)}
//                 className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
//               >
//                 Create First Invoice NFT
//               </button>
//               <p className="text-xs text-gray-500">
//                 Real NFT minting on Base Sepolia blockchain
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Seamless Investment Modal */}
//       {investmentModal.isOpen && investmentModal.nft && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               {/* Modal Header */}
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-xl font-semibold text-gray-900">Invest in Invoice NFT</h3>
//                 <button
//                   onClick={() => setInvestmentModal({ isOpen: false, nft: null, amount: '', calculatedYield: 0, calculatedReturn: 0 })}
//                   className="text-gray-400 hover:text-gray-600"
//                 >
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>

//               {/* NFT Info */}
//               <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm opacity-90">Token ID #{investmentModal.nft.tokenId}</span>
//                   <span className="text-sm bg-white/20 px-2 py-1 rounded">
//                     {(investmentModal.nft.finalAPR / 100).toFixed(1)}% APR
//                   </span>
//                 </div>
//                 <h4 className="text-lg font-bold">{investmentModal.nft.commodity}</h4>
//                 <p className="text-blue-100 text-sm">{investmentModal.nft.exporterName}</p>
//               </div>

//               {/* Investment Amount Input */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Investment Amount (USDC)
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     value={investmentModal.amount}
//                     onChange={(e) => updateInvestmentAmount(e.target.value)}
//                     placeholder="1000"
//                     className="w-full p-4 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg"
//                   />
//                   <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
//                     USDC
//                   </div>
//                 </div>
//               </div>

//               {/* Quick Amount Buttons */}
//               <div className="grid grid-cols-4 gap-2 mb-6">
//                 {['500', '1000', '2500', '5000'].map((amount) => (
//                   <button
//                     key={amount}
//                     onClick={() => updateInvestmentAmount(amount)}
//                     className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
//                       investmentModal.amount === amount
//                         ? 'bg-green-600 text-white'
//                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                     }`}
//                   >
//                     ${amount}
//                   </button>
//                 ))}
//               </div>

//               {/* Investment Calculations */}
//               {parseFloat(investmentModal.amount) > 0 && (
//                 <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
//                   <h5 className="font-medium text-green-900 mb-3 flex items-center gap-2">
//                     <Calculator className="w-4 h-4" />
//                     Investment Projection
//                   </h5>
//                   <div className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Principal:</span>
//                       <span className="font-medium">${parseFloat(investmentModal.amount).toLocaleString()}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Expected Yield (90 days):</span>
//                       <span className="font-medium text-green-600">+${investmentModal.calculatedYield.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between border-t border-green-200 pt-2">
//                       <span className="font-medium text-green-900">Total Return:</span>
//                       <span className="font-bold text-green-900">${investmentModal.calculatedReturn.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">ROI:</span>
//                       <span className="font-medium text-green-600">
//                         {((investmentModal.calculatedYield / parseFloat(investmentModal.amount)) * 100).toFixed(2)}%
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Blockchain Warning */}
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
//                 <div className="flex items-start gap-2">
//                   <Wallet className="w-4 h-4 text-blue-600 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <p className="font-medium">Blockchain Transaction</p>
//                     <p>This will create real USDC transactions on Base Sepolia. Please ensure you have sufficient USDC balance.</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setInvestmentModal({ isOpen: false, nft: null, amount: '', calculatedYield: 0, calculatedReturn: 0 })}
//                   className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleInvestment}
//                   disabled={!investmentModal.amount || parseFloat(investmentModal.amount) <= 0 || processingTx !== null}
//                   className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {processingTx === 'investing' ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <ArrowRight className="w-4 h-4" />
//                   )}
//                   {processingTx === 'investing' ? 'Processing...' : 'Confirm Investment'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Seamless Transfer Modal */}
//       {transferModal.isOpen && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl max-w-md w-full">
//             <div className="p-6">
//               {/* Modal Header */}
//               <div className="flex items-center justify-between mb-6">
//                 <h3 className="text-xl font-semibold text-gray-900">Transfer NFT</h3>
//                 <button
//                   onClick={() => setTransferModal({ isOpen: false, tokenId: null, recipientAddress: '' })}
//                   className="text-gray-400 hover:text-gray-600"
//                 >
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>

//               {/* Transfer Info */}
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center gap-2 mb-2">
//                   <Upload className="w-4 h-4 text-blue-600" />
//                   <span className="font-medium text-blue-900">Token ID #{transferModal.tokenId}</span>
//                 </div>
//                 <p className="text-sm text-blue-800">
//                   This will transfer ownership of the NFT to another address on the blockchain.
//                 </p>
//               </div>

//               {/* Recipient Address Input */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Recipient Address
//                 </label>
//                 <input
//                   type="text"
//                   value={transferModal.recipientAddress}
//                   onChange={(e) => setTransferModal(prev => ({ ...prev, recipientAddress: e.target.value }))}
//                   placeholder="0x742d35Cc6634C0532925a3b8D6Dc24B3aa231a99"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
//                 />
//               </div>

//               {/* Blockchain Warning */}
//               <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
//                 <div className="flex items-start gap-2">
//                   <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
//                   <div className="text-sm text-orange-800">
//                     <p className="font-medium">Permanent Transfer</p>
//                     <p>This action cannot be undone. Please verify the recipient address carefully.</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setTransferModal({ isOpen: false, tokenId: null, recipientAddress: '' })}
//                   className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleTransfer}
//                   disabled={!transferModal.recipientAddress.trim() || processingTx !== null}
//                   className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {processingTx === 'transferring' ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Upload className="w-4 h-4" />
//                   )}
//                   {processingTx === 'transferring' ? 'Transferring...' : 'Transfer NFT'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Real Blockchain Status Footer */}
//       <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-blue-500">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
//               <span className="text-sm font-medium">Connected to Base Sepolia</span>
//             </div>
//             <div className="flex items-center gap-2 text-sm text-gray-600">
//               <Zap className="w-4 h-4 text-orange-500" />
//               <span>Chainlink Oracles Active</span>
//             </div>
//             <div className="flex items-center gap-2 text-sm text-gray-600">
//               <Shield className="w-4 h-4 text-purple-500" />
//               <span>Smart Contracts Verified</span>
//             </div>
//           </div>
          
//           {/* Contract Links */}
//           <div className="flex items-center gap-2">
//             <a
//               href={`https://sepolia.etherscan.io/address/${CONTRACTS.PROTOCOL}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
//             >
//               <ExternalLink className="w-4 h-4" />
//               View Contracts
//             </a>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
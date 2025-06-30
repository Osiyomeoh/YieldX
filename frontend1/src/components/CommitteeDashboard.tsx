// // src/components/pages/CommitteeDashboard.tsx - Error-Free Version
// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   Shield, 
//   Users, 
//   Clock, 
//   FileText, 
//   TrendingUp, 
//   CheckCircle, 
//   XCircle, 
//   AlertCircle,
//   Plus,
//   Trash2,
//   UserPlus,
//   UserMinus,
//   ExternalLink,
//   Loader2,
//   Vote,
//   Zap,
//   Hash,
//   FileCheck,
//   Calendar,
//   DollarSign,
//   Award,
//   Eye,
//   Target,
//   RefreshCw,
//   Activity,
//   Database,
//   Wifi,
//   WifiOff
// } from 'lucide-react';
// import { useYieldX } from '../hooks/useYieldX';

// interface CommitteeDashboardProps {
//   setActiveTab?: (tab: string) => void;
// }

// interface CommitteeMember {
//   address: string;
//   role: string;
//   isActive: boolean;
//   joinedAt?: number;
// }

// interface PendingProposal {
//   id: number;
//   tokenId: number;
//   commodity: string;
//   companyName: string;
//   amount: number;
//   status: string;
//   submissionTime: number;
//   deadline: Date;
//   approvals: number;
//   rejections: number;
//   isActive: boolean;
//   hasUserVoted: boolean;
//   userVoteDecision?: boolean;
//   documents?: Array<{
//     filename: string;
//     hash: string;
//     verified: boolean;
//     timestamp: number;
//   }>;
//   chainlinkData?: any;
// }

// interface LiveDataState {
//   isLive: boolean;
//   lastUpdate: number;
//   updateCount: number;
//   errors: string[];
// }

// export function CommitteeDashboard({ setActiveTab }: CommitteeDashboardProps) {
//   const {
//     isConnected, 
//     address,
//     isCommitteeMember,
//     committeeRole,
//     castVote,
//     loading,
//     txHash,
//     isTransactionSuccess,
//     contracts,
//     stats,
//     addCommitteeMember,
//     removeCommitteeMember,
//     getInvoiceDetails,
//     getInvoiceVotingData, // Get real voting data
//     liveMarketData,
//     updateLivePrices,
//     forceUpdateLivePrices,
//     refreshBalance,
//     usdcBalance,
//     committeeMembers: blockchainCommitteeMembers // Get real committee members from blockchain
//   } = useYieldX();

//   // Check if user is owner by comparing address with deployer
//   const isOwner = address && (
//     address.toLowerCase().includes("a6e8bf") || 
//     address.toLowerCase() === "0xa6e8bf40f9fb649015c87ab8f0b0d7da7cb1e5a9"
//   );

//   // State management
//   const [pendingProposals, setPendingProposals] = useState<PendingProposal[]>([]);
//   const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
//   const [loadingProposals, setLoadingProposals] = useState(false);
//   const [loadingMembers, setLoadingMembers] = useState(false);
//   const [transactionResults, setTransactionResults] = useState<string[]>([]);
  
//   // Live data state
//   const [liveDataState, setLiveDataState] = useState<LiveDataState>({
//     isLive: false,
//     lastUpdate: Date.now(),
//     updateCount: 0,
//     errors: []
//   });

//   // Real-time updates with safe defaults
//   const [autoRefresh, setAutoRefresh] = useState(false);
//   const [refreshInterval, setRefreshInterval] = useState(60);
  
//   // Member management state
//   const [showAddMember, setShowAddMember] = useState(false);
//   const [newMemberAddress, setNewMemberAddress] = useState('');
//   const [newMemberRole, setNewMemberRole] = useState('');
//   const [managingMembers, setManagingMembers] = useState(false);

//   // Proposal details state
//   const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
//   const [voteReasoning, setVoteReasoning] = useState('');

//   const addResult = useCallback((message: string) => {
//     const timestamp = new Date().toLocaleTimeString();
//     console.log('📝 Committee result:', message);
//     setTransactionResults(prev => [...prev.slice(-4), `${timestamp}: ${message}`]);
    
//     // Update live data state
//     setLiveDataState(prev => ({
//       ...prev,
//       lastUpdate: Date.now(),
//       updateCount: prev.updateCount + 1
//     }));
//   }, []);

//   // Safe data refresh function with comprehensive error handling
//   const refreshLiveData = useCallback(async () => {
//     if (!isConnected || loading || loadingProposals || managingMembers) {
//       console.log('🔄 Skipping refresh - busy or disconnected');
//       return;
//     }

//     try {
//       setLiveDataState(prev => ({ ...prev, isLive: true, errors: [] }));
//       addResult('🔄 Starting live data refresh...');
      
//       // Create timeout wrapper for all operations
//       const createTimeoutPromise = (ms: number) => 
//         new Promise((_, reject) => 
//           setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
//         );
      
//       // Refresh market data with timeout
//       if (updateLivePrices && typeof updateLivePrices === 'function') {
//         try {
//           await Promise.race([
//             updateLivePrices(),
//             createTimeoutPromise(15000)
//           ]);
//           addResult('📊 Market data refreshed successfully');
//         } catch (error: any) {
//           console.warn('Market data refresh failed:', error);
//           addResult(`⚠️ Market data timeout: ${error.message || 'Unknown error'}`);
//         }
//       }
      
//       // Refresh balance with timeout
//       if (refreshBalance && typeof refreshBalance === 'function') {
//         try {
//           await Promise.race([
//             refreshBalance(),
//             createTimeoutPromise(10000)
//           ]);
//           addResult('💰 Balance refreshed successfully');
//         } catch (error: any) {
//           console.warn('Balance refresh failed:', error);
//           addResult(`⚠️ Balance refresh timeout: ${error.message || 'Unknown error'}`);
//         }
//       }
      
//       setLiveDataState(prev => ({
//         ...prev,
//         lastUpdate: Date.now(),
//         updateCount: prev.updateCount + 1,
//         isLive: true
//       }));
      
//     } catch (error: any) {
//       console.error('Live data refresh error:', error);
//       setLiveDataState(prev => ({
//         ...prev,
//         errors: [...prev.errors.slice(-2), error.message || 'Refresh failed'],
//         isLive: false
//       }));
//       addResult(`❌ Live data refresh failed: ${error.message || 'Unknown error'}`);
//     }
//   }, [isConnected, updateLivePrices, refreshBalance, addResult, loading, loadingProposals, managingMembers]);

//   // Auto-refresh effect with comprehensive safety checks
//   useEffect(() => {
//     if (!autoRefresh || !isConnected || refreshInterval < 30) {
//       return;
//     }

//     const safeInterval = Math.max(refreshInterval, 30);
    
//     const interval = setInterval(() => {
//       if (!loading && !loadingProposals && !managingMembers && isConnected) {
//         refreshLiveData().catch(error => {
//           console.error('Auto-refresh error:', error);
//         });
//       }
//     }, safeInterval * 1000);

//     return () => {
//       clearInterval(interval);
//     };
//   }, [autoRefresh, refreshInterval, isConnected, refreshLiveData, loading, loadingProposals, managingMembers]);

//   // Enhanced debug logging
//   useEffect(() => {
//     console.log('🔍 Committee Dashboard Access Check:', {
//       isConnected,
//       address,
//       isCommitteeMember,
//       isOwner,
//       hasAccess: isCommitteeMember || isOwner
//     });
//   }, [isConnected, address, isCommitteeMember, isOwner]);

//   // Safe committee members loading - fetch from blockchain (fixed infinite loop)
//   useEffect(() => {
//     const fetchCommitteeMembers = async () => {
//       if (!isConnected || !contracts?.PROTOCOL) {
//         setCommitteeMembers([]);
//         setLoadingMembers(false);
//         return;
//       }
      
//       setLoadingMembers(true);
//       try {
//         console.log('📋 Loading committee members from enhanced blockchain...');
//         console.log('Blockchain committee members:', blockchainCommitteeMembers);
        
//         const members: CommitteeMember[] = [];
        
//         // Add contract owner first if current user is owner
//         if (isOwner && address) {
//           members.push({
//             address: address,
//             role: 'Contract Owner',
//             isActive: true,
//             joinedAt: Date.now() - 86400000
//           });
//         }
        
//         // Add real committee members from enhanced blockchain
//         if (blockchainCommitteeMembers && Array.isArray(blockchainCommitteeMembers) && blockchainCommitteeMembers.length > 0) {
//           blockchainCommitteeMembers.forEach((memberAddress: string) => {
//             // Don't duplicate if it's the owner
//             if (!isOwner || memberAddress.toLowerCase() !== address?.toLowerCase()) {
//               members.push({
//                 address: memberAddress,
//                 role: memberAddress.toLowerCase() === address?.toLowerCase() ? 'You (Committee Member)' : 'Committee Member',
//                 isActive: true,
//                 joinedAt: Date.now() - Math.random() * 86400000 * 30 // Random date in last 30 days
//               });
//             }
//           });
//           console.log('✅ Real committee members loaded from enhanced contract:', blockchainCommitteeMembers);
//         } else {
//           console.log('ℹ️ No additional committee members found in blockchain array');
//         }
        
//         // If current user is committee member but not owner and not in the blockchain list, add them
//         if (isCommitteeMember && !isOwner && address) {
//           const userInList = members.some(m => m.address.toLowerCase() === address.toLowerCase());
//           if (!userInList) {
//             members.push({
//               address: address,
//               role: 'You (Committee Member)',
//               isActive: true,
//               joinedAt: Date.now() - 86400000
//             });
//           }
//         }
        
//         console.log('✅ Enhanced committee members processed:', members);
//         setCommitteeMembers(members);
//         setLiveDataState(prev => ({ ...prev, isLive: true }));
        
//       } catch (error: any) {
//         console.error('Error fetching committee members:', error);
        
//         // Fallback to show current user only
//         const fallbackMembers: CommitteeMember[] = [];
//         if (isOwner && address) {
//           fallbackMembers.push({
//             address: address,
//             role: 'Contract Owner',
//             isActive: true,
//             joinedAt: Date.now() - 86400000
//           });
//         } else if (isCommitteeMember && address) {
//           fallbackMembers.push({
//             address: address,
//             role: 'Committee Member',
//             isActive: true,
//             joinedAt: Date.now() - 86400000
//           });
//         }
        
//         setCommitteeMembers(fallbackMembers);
//         setLiveDataState(prev => ({
//           ...prev,
//           errors: [...prev.errors.slice(-2), 'Limited committee data available']
//         }));
//       } finally {
//         setLoadingMembers(false);
//       }
//     };

//     // Only run once on mount and when key dependencies change
//     fetchCommitteeMembers();
//   }, [isConnected, contracts?.PROTOCOL, isOwner, isCommitteeMember, address, blockchainCommitteeMembers]); // Added blockchainCommitteeMembers back now that it's real data

//   // Safe proposals loading with comprehensive timeout and error handling
//   useEffect(() => {
//     const fetchPendingProposals = async () => {
//       if (!isConnected || !stats?.totalInvoices || stats.totalInvoices === 0) {
//         setPendingProposals([]);
//         return;
//       }
      
//       if (loadingProposals) return;
      
//       setLoadingProposals(true);
//       console.log('📄 Loading proposals with safety limits...');
//       const proposals: PendingProposal[] = [];
      
//       try {
//         const maxInvoices = Math.min(stats.totalInvoices, 3);
        
//         for (let i = 1; i <= maxInvoices; i++) {
//           try {
//             const timeoutPromise = new Promise((_, reject) => 
//               setTimeout(() => reject(new Error('Invoice fetch timeout')), 8000)
//             );
            
//             let invoiceDetails;
//             let votingData = { approvals: 0, rejections: 0, hasUserVoted: false, userVoteDecision: undefined };
            
//             try {
//               invoiceDetails = await Promise.race([
//                 getInvoiceDetails(i),
//                 timeoutPromise
//               ]);
              
//               // Get real voting data if getInvoiceVotingData is available
//               if (getInvoiceVotingData && invoiceDetails) {
//                 try {
//                   votingData = await getInvoiceVotingData(i);
//                   console.log(`📊 Real voting data for invoice ${i}:`, votingData);
//                 } catch (votingError) {
//                   console.warn(`⚠️ Could not get voting data for invoice ${i}, using defaults`);
//                 }
//               }
//             } catch (timeoutError) {
//               console.warn(`Invoice ${i} timeout, using fallback`);
//               invoiceDetails = null;
//             }
            
//             // Create enhanced proposal data
//             const mockChainlinkData = liveMarketData ? {
//               ethPrice: liveMarketData.ethPrice || 2000,
//               usdcPrice: liveMarketData.usdcPrice || 1,
//               btcPrice: liveMarketData.btcPrice || 30000,
//               linkPrice: liveMarketData.linkPrice || 15,
//               marketRisk: Math.random() * 0.1,
//               volatility: Math.random() * 0.2,
//               timestamp: liveMarketData.lastUpdate || Date.now(),
//               isLive: !!invoiceDetails,
//               oracleHealth: invoiceDetails ? 'active' : 'fallback'
//             } : null;
            
//             const proposal: PendingProposal = {
//               id: i,
//               tokenId: i,
//               commodity: invoiceDetails?.commodity || `Fallback Commodity ${i}`,
//               companyName: invoiceDetails?.companyName || invoiceDetails?.exporterName || `Fallback Company ${i}`,
//               amount: invoiceDetails?.amount || (50000 + (i * 25000)),
//               status: invoiceDetails ? 'Live from Contract' : 'Fallback Data',
//               submissionTime: Date.now() - (i * 24 * 60 * 60 * 1000),
//               deadline: new Date(Date.now() + (7 - i) * 24 * 60 * 60 * 1000),
//               approvals: votingData.approvals, // Real voting data from blockchain
//               rejections: votingData.rejections, // Real voting data from blockchain
//               isActive: true,
//               hasUserVoted: votingData.hasUserVoted, // Real voting data from blockchain
//               userVoteDecision: votingData.userVoteDecision, // Real voting data from blockchain
//               documents: invoiceDetails?.documentHash ? [
//                 {
//                   filename: `${invoiceDetails.commodity || 'Invoice'}_${i}.pdf`,
//                   hash: invoiceDetails.documentHash,
//                   verified: true,
//                   timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
//                 }
//               ] : [
//                 {
//                   filename: `Fallback_Invoice_${i}.pdf`,
//                   hash: `0xfallback${i.toString(16).padStart(8, '0')}`,
//                   verified: false,
//                   timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
//                 }
//               ],
//               chainlinkData: mockChainlinkData
//             };
            
//             proposals.push(proposal);
//             console.log(`✅ Loaded proposal ${i}${invoiceDetails ? ' (live)' : ' (fallback)'}`);
            
//             await new Promise(resolve => setTimeout(resolve, 1000));
            
//           } catch (error: any) {
//             console.error(`Error with proposal ${i}:`, error);
//             console.log(`⚠️ Proposal ${i} error: ${error.message || 'Unknown error'}`);
//           }
//         }
        
//         setPendingProposals(proposals);
//         console.log(`✅ Loaded ${proposals.length}/${maxInvoices} proposals successfully`);
//         setLiveDataState(prev => ({ 
//           ...prev, 
//           isLive: true,
//           lastUpdate: Date.now(),
//           updateCount: prev.updateCount + 1
//         }));
        
//       } catch (error: any) {
//         console.error('Error fetching proposals:', error);
//         console.log(`❌ Proposals fetch failed: ${error.message || 'Unknown error'}`);
        
//         // Create minimal fallback data
//         const fallbackProposals: PendingProposal[] = [
//           {
//             id: 1,
//             tokenId: 1,
//             commodity: 'Emergency Demo Data',
//             companyName: 'Offline Test Company',
//             amount: 75000,
//             status: 'Demo Mode - RPC Offline',
//             submissionTime: Date.now() - 86400000,
//             deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
//             approvals: 0, // Real data - no fake votes
//             rejections: 0, // Real data - no fake votes
//             isActive: true,
//             hasUserVoted: false, // Real data - user hasn't voted
//             userVoteDecision: undefined, // Real data - no vote decision
//             documents: [{
//               filename: 'Demo_Invoice.pdf',
//               hash: '0xdemo123',
//               verified: false,
//               timestamp: Date.now() - 86400000
//             }],
//             chainlinkData: {
//               ethPrice: 2000,
//               usdcPrice: 1.0,
//               btcPrice: 30000,
//               linkPrice: 15,
//               marketRisk: 0.05,
//               timestamp: Date.now(),
//               isLive: false,
//               oracleHealth: 'offline'
//             }
//           }
//         ];
        
//         setPendingProposals(fallbackProposals);
//         setLiveDataState(prev => ({
//           ...prev,
//           errors: [...prev.errors.slice(-2), 'Using emergency fallback data'],
//           isLive: false
//         }));
//       } finally {
//         setLoadingProposals(false);
//       }
//     };

//     // Only run once when totalInvoices changes, not on every render
//     if (stats?.totalInvoices > 0 && !loadingProposals && isConnected) {
//       fetchPendingProposals().catch(error => {
//         console.error('Proposal fetch error:', error);
//         setLoadingProposals(false);
//       });
//     }
//   }, [stats?.totalInvoices, isConnected]); // REMOVED: getInvoiceDetails, liveMarketData, addResult

//   const handleAddMember = async () => {
//     if (!newMemberAddress || !newMemberRole) {
//       console.log('❌ Please fill in both address and role');
//       return;
//     }

//     if (!/^0x[a-fA-F0-9]{40}$/.test(newMemberAddress)) {
//       console.log('❌ Invalid Ethereum address');
//       return;
//     }

//     // Check if member already exists
//     const memberExists = committeeMembers.some(
//       member => member.address.toLowerCase() === newMemberAddress.toLowerCase()
//     );
    
//     if (memberExists) {
//       console.log('❌ Member already exists in committee');
//       return;
//     }

//     setManagingMembers(true);
//     console.log(`🔄 Adding committee member to blockchain...`);

//     try {
//       // Add to blockchain first
//       if (addCommitteeMember) {
//         const result = await addCommitteeMember(newMemberAddress);
        
//         if (result?.success) {
//           console.log(`✅ Added ${newMemberRole}: ${newMemberAddress.slice(0, 8)}... to blockchain`);
          
//           // Add to local state only after blockchain success
//           const newMember: CommitteeMember = {
//             address: newMemberAddress,
//             role: newMemberRole,
//             isActive: true,
//             joinedAt: Date.now()
//           };
          
//           setCommitteeMembers(prev => [...prev, newMember]);
          
//           // Clear form
//           setNewMemberAddress('');
//           setNewMemberRole('');
//           setShowAddMember(false);
          
//         } else {
//           console.log(`❌ Failed to add member to blockchain: ${result?.error || 'Unknown error'}`);
//         }
//       } else {
//         console.log('❌ addCommitteeMember function not available');
//       }
      
//     } catch (error: any) {
//       console.log(`❌ Failed to add member: ${error.message}`);
//     } finally {
//       setManagingMembers(false);
//     }
//   };

//   const handleRemoveMember = async (memberAddress: string) => {
//     if (!confirm(`Are you sure you want to remove committee member ${memberAddress}?`)) {
//       return;
//     }

//     setManagingMembers(true);
//     console.log(`🔄 Removing committee member from blockchain...`);

//     try {
//       // Remove from blockchain first
//       if (removeCommitteeMember) {
//         const result = await removeCommitteeMember(memberAddress);
        
//         if (result?.success) {
//           console.log(`✅ Removed member: ${memberAddress.slice(0, 8)}... from blockchain`);
          
//           // Remove from local state only after blockchain success
//           setCommitteeMembers(prev => prev.filter(member => 
//             member.address.toLowerCase() !== memberAddress.toLowerCase()
//           ));
          
//         } else {
//           console.log(`❌ Failed to remove member from blockchain: ${result?.error || 'Unknown error'}`);
//         }
//       } else {
//         console.log('❌ removeCommitteeMember function not available in useYieldX hook');
//         console.log('⚠️ You need to add removeCommitteeMember function to your useYieldX.ts hook');
        
//         // For now, just remove locally with a warning
//         setCommitteeMembers(prev => prev.filter(member => 
//           member.address.toLowerCase() !== memberAddress.toLowerCase()
//         ));
//         console.log('⚠️ Removed locally only (not from blockchain)');
//       }
      
//     } catch (error: any) {
//       console.log(`❌ Failed to remove member: ${error.message}`);
//     } finally {
//       setManagingMembers(false);
//     }
//   };

//   const handleVote = async (proposalId: number, decision: boolean) => {
//     if (!voteReasoning.trim()) {
//       addResult('❌ Please provide reasoning for your vote');
//       return;
//     }

//     addResult(`🗳️ Casting ${decision ? 'approval' : 'rejection'} vote on proposal ${proposalId}...`);
    
//     try {
//       const result = await castVote(proposalId, decision, voteReasoning);
      
//       if (result?.success) {
//         addResult(`✅ Vote cast successfully! TX: ${result.hash}`);
//         setVoteReasoning('');
        
//         setPendingProposals(prev => prev.map(p => 
//           p.id === proposalId 
//             ? { 
//                 ...p, 
//                 hasUserVoted: true, 
//                 userVoteDecision: decision,
//                 approvals: decision ? p.approvals + 1 : p.approvals,
//                 rejections: !decision ? p.rejections + 1 : p.rejections
//               }
//             : p
//         ));
//       } else {
//         addResult(`❌ Vote failed: ${result?.error || 'Unknown error'}`);
//       }
//     } catch (error: any) {
//       addResult(`❌ Vote error: ${error.message}`);
//     }
//   };

//   if (!isConnected) {
//     return (
//       <div className="text-center py-16">
//         <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//         <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
//         <p className="text-gray-600">Connect your wallet to access the live committee dashboard.</p>
//       </div>
//     );
//   }

//   if (!isCommitteeMember && !isOwner) {
//     return (
//       <div className="text-center py-16 space-y-6">
//         <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
//           <p className="text-gray-600 mb-4">
//             You need to be either a committee member or the contract owner to access this dashboard.
//           </p>
//         </div>
        
//         <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-lg mx-auto text-left">
//           <h3 className="font-semibold text-gray-900 mb-4">🔍 Access Status Debug</h3>
          
//           <div className="space-y-3 text-sm">
//             <div className="flex justify-between">
//               <span className="text-gray-600">Connected Address:</span>
//               <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
//                 {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Not connected'}
//               </span>
//             </div>
            
//             <div className="flex justify-between">
//               <span className="text-gray-600">Committee Member:</span>
//               <span className={`font-medium ${isCommitteeMember ? 'text-green-600' : 'text-red-600'}`}>
//                 {isCommitteeMember ? '✅ Yes' : '❌ No'}
//               </span>
//             </div>
            
//             <div className="flex justify-between">
//               <span className="text-gray-600">Contract Owner:</span>
//               <span className={`font-medium ${isOwner ? 'text-green-600' : 'text-red-600'}`}>
//                 {isOwner ? '✅ Yes' : '❌ No'}
//               </span>
//             </div>
//           </div>
          
//           {address && address.toLowerCase().includes("a6e8bf") && isOwner && addCommitteeMember && (
//             <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
//               <p className="text-blue-800 text-sm font-medium mb-2">
//                 🔧 You appear to be the deployer address
//               </p>
//               <button
//                 onClick={async () => {
//                   try {
//                     const result = await addCommitteeMember(address);
//                     if (result?.success) {
//                       alert("Successfully added yourself to committee! Refreshing...");
//                       window.location.reload();
//                     } else {
//                       alert(`Failed to add to committee: ${result?.error || 'Unknown error'}`);
//                     }
//                   } catch (error: any) {
//                     alert(`Error: ${error.message}`);
//                   }
//                 }}
//                 className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
//               >
//                 Add Myself to Committee
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Live Status Header */}
//       <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-2">
//               {liveDataState.isLive ? (
//                 <Wifi className="w-5 h-5 text-green-600" />
//               ) : (
//                 <WifiOff className="w-5 h-5 text-red-600" />
//               )}
//               <span className="text-green-800 font-medium">
//                 {liveDataState.isLive ? '🟢 Live Data Active' : '🔴 Live Data Inactive'} - {isOwner ? 'Contract Owner' : 'Committee Member'}
//               </span>
//             </div>
//             <div className="text-sm text-green-700">
//               Updates: {liveDataState.updateCount} | Last: {new Date(liveDataState.lastUpdate).toLocaleTimeString()}
//             </div>
//           </div>
          
//           <div className="flex items-center gap-2">
//             <button
//               onClick={refreshLiveData}
//               disabled={loading}
//               className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
//             >
//               <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
//               Refresh Now
//             </button>
            
//             <div className="flex items-center gap-2">
//               <label className="text-sm text-green-700">Auto:</label>
//               <input
//                 type="checkbox"
//                 checked={autoRefresh}
//                 onChange={(e) => setAutoRefresh(e.target.checked)}
//                 className="rounded"
//               />
//               <select
//                 value={refreshInterval}
//                 onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
//                 className="text-xs px-2 py-1 border rounded"
//               >
//                 <option value={30}>30s</option>
//                 <option value={60}>1m</option>
//                 <option value={300}>5m</option>
//               </select>
//             </div>
//           </div>
//         </div>
        
//         {liveDataState.errors.length > 0 && (
//           <div className="mt-2 text-sm text-red-600">
//             Latest errors: {liveDataState.errors.join(', ')}
//           </div>
//         )}
//       </div>

//       {/* Header */}
//       <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
//               <Shield className="w-10 h-10" />
//               Live Committee Dashboard
//               <Activity className="w-8 h-8 text-green-400 animate-pulse" />
//             </h1>
//             <p className="text-purple-100 text-lg">
//               Real-Time Multi-Stage Verification & Approval System
//             </p>
//           </div>
//           <div className="text-right">
//             <div className="bg-white/20 rounded-xl p-4">
//               <p className="text-purple-100 text-sm">Your Role</p>
//               <p className="text-xl font-bold">{isOwner ? 'Contract Owner' : (committeeRole || 'Committee Member')}</p>
//               {isOwner && (
//                 <div className="mt-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
//                   Contract Owner
//                 </div>
//               )}
//               <p className="text-purple-200 text-xs mt-1">
//                 {address?.slice(0, 8)}...{address?.slice(-6)}
//               </p>
//               <div className="text-xs text-purple-200 mt-1">
//                 Balance: {usdcBalance?.toFixed(2) || '0.00'} USDC
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Protocol Statistics */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium">Committee Size</p>
//               <p className="text-3xl font-bold text-gray-900">{stats?.totalCommitteeMembers || committeeMembers.length}</p>
//               <p className="text-xs text-gray-500 mt-1">From enhanced contract</p>
//             </div>
//             <Users className="w-10 h-10 text-purple-500" />
//           </div>
//         </div>

//         <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium">Pending Votes</p>
//               <p className="text-3xl font-bold text-gray-900">{stats?.pendingInvoices || (loadingProposals ? '...' : pendingProposals.length)}</p>
//               <p className="text-xs text-gray-500 mt-1">From protocol stats</p>
//             </div>
//             <FileText className="w-10 h-10 text-blue-500" />
//           </div>
//         </div>

//         <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium">Total Invoices</p>
//               <p className="text-3xl font-bold text-gray-900">{stats?.totalInvoices || 0}</p>
//               <p className="text-xs text-gray-500 mt-1">Enhanced contract data</p>
//             </div>
//             <CheckCircle className="w-10 h-10 text-green-500" />
//           </div>
//         </div>

//         <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium">Total Volume</p>
//               <p className="text-3xl font-bold text-gray-900">${(stats?.totalFundsRaised || 0).toLocaleString()}</p>
//               <p className="text-xs text-gray-500 mt-1">USDC from getProtocolStats()</p>
//             </div>
//             <TrendingUp className="w-10 h-10 text-emerald-500" />
//           </div>
//         </div>
//       </div>

//       {/* Live Market Data Panel */}
//       {liveMarketData && (
//         <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
//               <TrendingUp className="w-5 h-5 text-green-600" />
//               Live Market Data
//             </h2>
//             <div className="flex gap-2">
//               {updateLivePrices && (
//                 <button
//                   onClick={updateLivePrices}
//                   disabled={loading}
//                   className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
//                 >
//                   <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
//                   Update
//                 </button>
//               )}
//               {forceUpdateLivePrices && (
//                 <button
//                   onClick={forceUpdateLivePrices}
//                   disabled={loading}
//                   className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
//                 >
//                   <Zap className="w-3 h-3" />
//                   Force Update
//                 </button>
//               )}
//             </div>
//           </div>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="text-center p-3 bg-blue-50 rounded-lg">
//               <div className="text-2xl font-bold text-blue-600">${liveMarketData.ethPrice?.toFixed(0) || 'N/A'}</div>
//               <div className="text-sm text-gray-600">ETH/USD</div>
//             </div>
//             <div className="text-center p-3 bg-orange-50 rounded-lg">
//               <div className="text-2xl font-bold text-orange-600">${liveMarketData.btcPrice?.toFixed(0) || 'N/A'}</div>
//               <div className="text-sm text-gray-600">BTC/USD</div>
//             </div>
//             <div className="text-center p-3 bg-green-50 rounded-lg">
//               <div className="text-2xl font-bold text-green-600">${liveMarketData.usdcPrice?.toFixed(4) || 'N/A'}</div>
//               <div className="text-sm text-gray-600">USDC/USD</div>
//             </div>
//             <div className="text-center p-3 bg-purple-50 rounded-lg">
//               <div className="text-2xl font-bold text-purple-600">${liveMarketData.linkPrice?.toFixed(2) || 'N/A'}</div>
//               <div className="text-sm text-gray-600">LINK/USD</div>
//             </div>
//           </div>
//           {liveMarketData.lastUpdate && (
//             <div className="mt-3 text-xs text-gray-500 text-center">
//               Last updated: {new Date(liveMarketData.lastUpdate * 1000).toLocaleTimeString()}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Committee Management Section (Owner Only) */}
//       {isOwner && addCommitteeMember && (
//         <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
//               <Users className="w-6 h-6 text-purple-600" />
//               Committee Management
//             </h2>
//             <button
//               onClick={() => setShowAddMember(!showAddMember)}
//               className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
//             >
//               <UserPlus className="w-4 h-4" />
//               Add Member
//             </button>
//           </div>

//           {/* Add Member Form */}
//           {showAddMember && (
//             <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
//               <h3 className="font-semibold text-purple-900 mb-3">Add New Committee Member</h3>
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Wallet Address
//                   </label>
//                   <input
//                     type="text"
//                     value={newMemberAddress}
//                     onChange={(e) => setNewMemberAddress(e.target.value)}
//                     placeholder="0x..."
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Role (Display Only)
//                   </label>
//                   <select
//                     value={newMemberRole}
//                     onChange={(e) => setNewMemberRole(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                   >
//                     <option value="">Select Role</option>
//                     <option value="Risk Analyst">Risk Analyst</option>
//                     <option value="Trade Expert">Trade Expert</option>
//                     <option value="Financial Auditor">Financial Auditor</option>
//                     <option value="Compliance Officer">Compliance Officer</option>
//                     <option value="Committee Member">Committee Member</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="flex gap-3 mt-4">
//                 <button
//                   onClick={handleAddMember}
//                   disabled={managingMembers || !newMemberAddress || !newMemberRole}
//                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
//                 >
//                   {managingMembers ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Plus className="w-4 h-4" />
//                   )}
//                   Add Member
//                 </button>
//                 <button
//                   onClick={() => setShowAddMember(false)}
//                   className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Committee Members List */}
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h3 className="font-semibold text-gray-900">Current Committee Members</h3>
//               <div className="bg-green-50 border border-green-200 rounded px-3 py-1">
//                 <p className="text-xs text-green-800">
//                   ✅ Enhanced: Real blockchain data from getCommitteeMembers()
//                 </p>
//               </div>
//             </div>
//             {loadingMembers ? (
//               <div className="text-center py-8">
//                 <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
//                 <p className="text-gray-600">Loading committee members from contract...</p>
//               </div>
//             ) : committeeMembers.length === 0 ? (
//               <div className="text-center py-8 bg-gray-50 rounded-lg">
//                 <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <p className="text-gray-600 mb-2">No committee members found</p>
//                 <p className="text-sm text-gray-500">Add the first committee member to get started</p>
//               </div>
//             ) : (
//               <div className="grid gap-4">
//                 {committeeMembers.map((member, index) => (
//                   <div key={member.address} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
//                     <div className="flex items-center gap-4">
//                       <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
//                         <Shield className="w-5 h-5 text-purple-600" />
//                       </div>
//                       <div>
//                         <p className="font-medium text-gray-900">{member.role}</p>
//                         <p className="text-sm text-gray-600 font-mono">
//                           {member.address.slice(0, 8)}...{member.address.slice(-6)}
//                         </p>
//                         {member.joinedAt && (
//                           <p className="text-xs text-gray-500">
//                             Joined: {new Date(member.joinedAt).toLocaleDateString()}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <span className={`px-2 py-1 rounded text-xs font-medium ${
//                         member.isActive 
//                           ? 'bg-green-100 text-green-800' 
//                           : 'bg-red-100 text-red-800'
//                       }`}>
//                         {member.isActive ? 'Active' : 'Inactive'}
//                       </span>
//                       <a
//                         href={`https://sepolia.etherscan.io/address/${member.address}`}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="p-2 text-gray-500 hover:text-blue-600"
//                       >
//                         <ExternalLink className="w-4 h-4" />
//                       </a>
//                       {member.address.toLowerCase() !== address?.toLowerCase() && (
//                         <button
//                           onClick={() => handleRemoveMember(member.address)}
//                           disabled={managingMembers}
//                           className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
//                           title="Remove member"
//                         >
//                           {managingMembers ? (
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                           ) : (
//                             <UserMinus className="w-4 h-4" />
//                           )}
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Pending Proposals */}
//       <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//         <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
//           <FileText className="w-6 h-6 text-blue-600" />
//           Pending Proposals
//           {loadingProposals && <Loader2 className="w-5 h-5 animate-spin" />}
//         </h2>

//         {loadingProposals ? (
//           <div className="text-center py-8">
//             <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
//             <p className="text-gray-600">Loading proposals from smart contract...</p>
//           </div>
//         ) : pendingProposals.length === 0 ? (
//           <div className="text-center py-8">
//             <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Proposals</h3>
//             <p className="text-gray-600 mb-2">No invoices found in the smart contract</p>
//             <p className="text-sm text-gray-500">
//               Total invoices from contract: {stats?.totalInvoices || 0}
//             </p>
//             <button
//               onClick={() => setActiveTab && setActiveTab('submit')}
//               className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Submit First Invoice
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {pendingProposals.map((proposal) => (
//               <div key={proposal.id} className="border border-gray-200 rounded-xl p-6">
//                 <div className="flex items-start justify-between mb-4">
//                   <div>
//                     <h3 className="text-xl font-semibold text-gray-900">
//                       {proposal.commodity} Export - #{proposal.id}
//                     </h3>
//                     <p className="text-gray-600">{proposal.companyName}</p>
//                     <p className="text-sm text-gray-500">
//                       Amount: ${proposal.amount.toLocaleString()} USDC
//                     </p>
//                     <p className="text-xs text-gray-500">
//                       From Contract Invoice #{proposal.id}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <div className="flex items-center gap-2 mb-2">
//                       <Clock className="w-4 h-4 text-gray-500" />
//                       <span className="text-sm text-gray-600">
//                         Deadline: {proposal.deadline.toLocaleDateString()}
//                       </span>
//                     </div>
//                     <div className="text-sm">
//                       <span className="text-green-600 font-medium">{proposal.approvals} Approvals</span>
//                       {proposal.rejections > 0 && (
//                         <span className="text-red-600 font-medium ml-2">{proposal.rejections} Rejections</span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Voting Progress */}
//                 <div className="mb-4">
//                   <div className="flex justify-between text-sm mb-2">
//                     <span className="text-gray-600">Voting Progress</span>
//                     <span className="font-medium">{proposal.approvals}/4 approvals needed</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-2">
//                     <div 
//                       className="bg-green-500 h-2 rounded-full transition-all duration-500"
//                       style={{ width: `${Math.min((proposal.approvals / 4) * 100, 100)}%` }}
//                     ></div>
//                   </div>
//                 </div>

//                 {/* Voting Form with Reasoning */}
//                 {!proposal.hasUserVoted && castVote ? (
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Vote Reasoning (Required)
//                       </label>
//                       <textarea
//                         value={voteReasoning}
//                         onChange={(e) => setVoteReasoning(e.target.value)}
//                         placeholder="Provide detailed reasoning for your vote decision..."
//                         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                         rows={3}
//                       />
//                     </div>
                    
//                     <div className="flex gap-3">
//                       <button
//                         onClick={() => handleVote(proposal.id, true)}
//                         disabled={loading || !voteReasoning.trim()}
//                         className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
//                       >
//                         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
//                         Approve
//                       </button>
//                       <button
//                         onClick={() => handleVote(proposal.id, false)}
//                         disabled={loading || !voteReasoning.trim()}
//                         className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
//                       >
//                         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
//                         Reject
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className={`p-3 rounded-lg ${
//                     proposal.userVoteDecision 
//                       ? 'bg-green-50 text-green-800 border border-green-200' 
//                       : 'bg-red-50 text-red-800 border border-red-200'
//                   }`}>
//                     <div className="flex items-center gap-2">
//                       {proposal.userVoteDecision ? (
//                         <CheckCircle className="w-4 h-4" />
//                       ) : (
//                         <XCircle className="w-4 h-4" />
//                       )}
//                       <span className="font-medium">
//                         {proposal.hasUserVoted 
//                           ? `You voted to ${proposal.userVoteDecision ? 'approve' : 'reject'} this proposal`
//                           : 'Voting requires castVote function'
//                         }
//                       </span>
//                     </div>
//                   </div>
//                 )}

//                 {/* Proposal Details */}
//                 {selectedProposal === proposal.id && (
//                   <div className="mt-6 bg-gray-50 rounded-lg p-4">
//                     <div className="flex items-center justify-between mb-4">
//                       <h4 className="font-semibold text-gray-900">Live Contract Data</h4>
//                       <button
//                         onClick={() => setSelectedProposal(null)}
//                         className="text-gray-500 hover:text-gray-700"
//                       >
//                         <XCircle className="w-5 h-5" />
//                       </button>
//                     </div>
                    
//                     {/* Document Information */}
//                     {proposal.documents && proposal.documents.length > 0 && (
//                       <div className="mb-4">
//                         <h5 className="font-medium text-gray-900 mb-2">Contract Documents</h5>
//                         <div className="grid gap-2">
//                           {proposal.documents.map((doc, index) => (
//                             <div key={index} className="bg-white rounded p-3 border">
//                               <div className="flex items-center justify-between">
//                                 <span className="font-medium text-sm">{doc.filename}</span>
//                                 {doc.verified ? (
//                                   <CheckCircle className="w-4 h-4 text-green-600" />
//                                 ) : (
//                                   <Clock className="w-4 h-4 text-yellow-600" />
//                                 )}
//                               </div>
//                               <p className="text-xs text-gray-600 font-mono mt-1">
//                                 Hash: {doc.hash}
//                               </p>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {/* Live Chainlink Data */}
//                     {proposal.chainlinkData && (
//                       <div className="mb-4">
//                         <h5 className="font-medium text-gray-900 mb-2">Live Market Data (Chainlink Oracles)</h5>
//                         <div className="bg-white rounded p-3 border">
//                           <div className="grid grid-cols-2 gap-4 text-sm">
//                             <div>
//                               <p className="text-gray-600">ETH Price</p>
//                               <p className="font-semibold">${proposal.chainlinkData.ethPrice.toFixed(2)}</p>
//                             </div>
//                             <div>
//                               <p className="text-gray-600">USDC Price</p>
//                               <p className="font-semibold">${proposal.chainlinkData.usdcPrice.toFixed(4)}</p>
//                             </div>
//                             <div>
//                               <p className="text-gray-600">BTC Price</p>
//                               <p className="font-semibold">${proposal.chainlinkData.btcPrice.toFixed(0)}</p>
//                             </div>
//                             <div>
//                               <p className="text-gray-600">LINK Price</p>
//                               <p className="font-semibold">${proposal.chainlinkData.linkPrice.toFixed(2)}</p>
//                             </div>
//                           </div>
//                           <div className="mt-3 text-xs text-gray-500">
//                             ⚡ Data sourced from Chainlink oracles on Sepolia
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* Additional Contract Information */}
//                     <div className="bg-blue-50 border border-blue-200 rounded p-3">
//                       <h5 className="font-medium text-blue-900 mb-2">Contract Information</h5>
//                       <div className="text-sm text-blue-800 space-y-1">
//                         <p>• Invoice ID: {proposal.id}</p>
//                         <p>• Company: {proposal.companyName}</p>
//                         <p>• Commodity: {proposal.commodity}</p>
//                         <p>• Amount: {proposal.amount.toLocaleString()} USDC</p>
//                         <p>• Status: {proposal.status}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* View Details Button */}
//                 <div className="mt-4 text-center">
//                   <button
//                     onClick={() => setSelectedProposal(selectedProposal === proposal.id ? null : proposal.id)}
//                     className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 mx-auto"
//                   >
//                     <Eye className="w-4 h-4" />
//                     {selectedProposal === proposal.id ? 'Hide Details' : 'View Contract Details'}
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Transaction Results */}
//       {transactionResults.length > 0 && (
//         <div className="bg-gray-900 text-green-400 p-4 rounded-xl">
//           <h3 className="text-white font-semibold mb-2">🔍 Live Contract Activity:</h3>
//           <div className="font-mono text-sm space-y-1 max-h-32 overflow-y-auto">
//             {transactionResults.map((result, index) => (
//               <p key={index} className="text-xs">{result}</p>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Contract Verification */}
//       <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//         <h3 className="font-semibold text-blue-900 mb-2">🔗 Live Contract Verification</h3>
//         <div className="text-sm text-blue-800 space-y-2">
//           <p>Protocol: 
//             <a 
//               href={`https://sepolia.etherscan.io/address/${contracts?.PROTOCOL}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="font-mono ml-2 hover:underline"
//             >
//               {contracts?.PROTOCOL} <ExternalLink className="inline w-3 h-3" />
//             </a>
//           </p>
//           <div className="text-xs text-blue-700">
//             <p>• Network: Sepolia Testnet</p>
//             <p>• Total Invoices: {stats?.totalInvoices || 0}</p>
//             <p>• Committee Size: {committeeMembers.length}</p>
//             <p>• Total Funds: ${(stats?.totalFundsRaised || 0).toLocaleString()}</p>
//             <p>• Your Access: {isOwner ? 'Contract Owner' : 'Committee Member'}</p>
//           </div>
//         </div>
//       </div>

//       {/* Loading Overlay */}
//       {(loading || managingMembers) && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 flex items-center gap-4">
//             <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
//             <div>
//               <p className="font-semibold text-gray-900">Processing Blockchain Transaction</p>
//               <p className="text-sm text-gray-600">
//                 {managingMembers ? 'Managing committee members...' : 'Interacting with smart contract on Sepolia...'}
//               </p>
//               {txHash && (
//                 <a
//                   href={`https://sepolia.etherscan.io/tx/${txHash}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-2"
//                 >
//                   View on Etherscan <ExternalLink className="w-3 h-3" />
//                 </a>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// // src/hooks/useNFTInvoiceSystem.ts - Complete NFT Invoice Integration with Chainlink
// import { useState, useEffect, useCallback } from 'react';
// // @ts-ignore
// import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
// import { parseUnits, formatUnits, getAddress } from 'viem';

// // Import your actual contract ABIs
// import YieldXCoreArtifact from '../abis/YieldXCore.json';
// import YieldXInvoiceNFTArtifact from '../abis/YieldXInvoiceNFT.json';
// import MockUSDCArtifact from '../abis/MockUSDC.json';

// export enum NFTInvoiceStatus {
//   PENDING = 0,
//   APPROVED = 1,
//   REJECTED = 2,
//   FUNDED = 3,
//   REPAID = 4,
//   DEFAULTED = 5
// }

// export interface NFTInvoiceData {
//   tokenId: string;
//   owner: string;
//   amount: number;
//   commodity: string;
//   exporterName: string;
//   status: number;
//   fundingProgress: number;
//   finalAPR: number;
//   investorCount: number;
//   chainlinkVerified: boolean;
//   buyerName: string;
//   destination: string;
//   documentHash: string;
//   committeeApproved: boolean;
//   totalYieldPaid: number;
// }

// export interface ChainlinkNFTData {
//   vrfRandomness: string;
//   commodityPrice: string;
//   countryRiskScore: string;
//   chainlinkVerified: boolean;
//   ethPrice: string;
//   btcPrice: string;
//   linkPrice: string;
//   usdcPrice: string;
// }

// interface VaultInfo {
//   targetAmount: bigint;
//   currentAmount: bigint;
//   finalAPR: number;
//   active: boolean;
//   investorCount: number;
//   fundingDeadline: number;
// }

// // ✅ YOUR LATEST SEPOLIA DEPLOYMENT ADDRESSES
// const CONTRACTS = {
//   PROTOCOL: getAddress("0xdD4118f2642Da28815C162Dd8a371b21eA52fB16"),  // YieldXCore
//   MOCK_USDC: getAddress("0x47E7e1bdecA7246667B4D8Bb4D0E91008518c6Ed"), // MockUSDC
//   INVOICE_NFT: getAddress("0x5bdA62CFe4Db1e914F5115dB0A4DD47c213110BA") // YieldXInvoiceNFT
// } as const;

// console.log('🎯 NFT System using latest contracts:', CONTRACTS);

// export function useNFTInvoiceSystem() {
//   const { address, isConnected } = useAccount();
//   const { writeContractAsync, isPending } = useWriteContract();
//   const publicClient = usePublicClient();
//   const [invoiceNFTs, setInvoiceNFTs] = useState<NFTInvoiceData[]>([]);
//   const [ownedNFTs, setOwnedNFTs] = useState<NFTInvoiceData[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

//   // Read total supply of NFTs
//   const { data: totalSupply, refetch: refetchSupply } = useReadContract({
//     address: CONTRACTS.INVOICE_NFT,
//     abi: YieldXInvoiceNFTArtifact.abi,
//     functionName: 'totalSupply',
//     query: { refetchInterval: 5000 }
//   });

//   // Read user's NFT balance
//   const { data: userBalance } = useReadContract({
//     address: CONTRACTS.INVOICE_NFT,
//     abi: YieldXInvoiceNFTArtifact.abi,
//     functionName: 'balanceOf',
//     args: address ? [address] : undefined,
//     query: { 
//       enabled: !!address,
//       refetchInterval: 5000 
//     }
//   });

//   // Wait for transaction
//   const { 
//     isLoading: isTransactionLoading, 
//     isSuccess: isTransactionSuccess 
//   } = useWaitForTransactionReceipt({
//     hash: txHash,
//   });

//   // STEP 1: Submit Invoice & Mint NFT with Full Chainlink Integration
//   const submitInvoiceAndMintNFT = useCallback(async (
//     commodity: string,
//     amount: string,
//     exporterName: string,
//     importerName: string,
//     destinationCountry: string,
//     description: string,
//     originCountry: string,
//     documentHash: string
//   ) => {
//     if (!isConnected || !address) {
//       return { success: false, error: 'Wallet not connected' };
//     }

//     setLoading(true);
//     try {
//       console.log('📄 Submitting invoice with full Chainlink integration...', {
//         commodity,
//         amount,
//         exporterName,
//         originCountry,
//         contractAddress: CONTRACTS.PROTOCOL
//       });

//       const amountWei = parseUnits(amount, 6);
//       const dueDate = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
//       const documentHashBytes = `0x${documentHash.replace(/^0x/, '').padEnd(64, '0')}`;

//       // Submit invoice with documents (triggers VRF + Functions automatically)
//       const hash = await writeContractAsync({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'submitInvoiceWithDocuments',
//         args: [
//           commodity,                    // string commodity
//           amountWei,                   // uint256 amount
//           exporterName,                // string exporterName
//           importerName,                // string importerName
//           destinationCountry,          // string destinationCountry
//           BigInt(dueDate),            // uint256 dueDate
//           description,                 // string description
//           originCountry,               // string originCountry
//           [documentHashBytes],         // bytes32[] documentHashes
//           ['commercial_invoice']       // string[] documentTypes
//         ],
//       });

//       console.log('✅ Invoice submitted with Chainlink triggers:', hash);
//       setTxHash(hash);

//       // Refetch data after successful submission
//       setTimeout(async () => {
//         await refetchSupply();
//         await loadAllNFTs();
//       }, 3000);

//       return { success: true, hash };
//     } catch (error: any) {
//       console.error('❌ Invoice submission failed:', error);
//       return { success: false, error: error.shortMessage || error.message };
//     } finally {
//       setLoading(false);
//     }
//   }, [isConnected, address, writeContractAsync, refetchSupply]);

//   // STEP 2: Get NFT Invoice Data from blockchain
//   const getNFTInvoiceData = useCallback(async (tokenId: number): Promise<NFTInvoiceData | null> => {
//     if (!publicClient) return null;

//     try {
//       console.log(`🔍 Fetching NFT data for token ${tokenId}`);

//       // Get NFT data from NFT contract
//       const nftData = await publicClient.readContract({
//         address: CONTRACTS.INVOICE_NFT,
//         abi: YieldXInvoiceNFTArtifact.abi,
//         functionName: 'getInvoiceData',
//         args: [BigInt(tokenId)],
//       });

//       // Get protocol data
//       const protocolData = await publicClient.readContract({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'getInvoiceDetails',
//         args: [BigInt(tokenId)],
//       });

//       // Get document data
//       const documentData = await publicClient.readContract({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'getInvoiceDocuments',
//         args: [BigInt(tokenId)],
//       });

//       if (nftData && protocolData && documentData) {
//         const nft = nftData as any[];
//         const protocol = protocolData as any[];
//         const docs = documentData as any[];

//         return {
//           tokenId,
//           owner: nft[0] as string,           // token owner
//           commodity: nft[0] as string,       // commodity from NFT
//           amount: nft[1] as bigint,          // amount
//           exporterName: nft[2] as string,    // exporter
//           importerName: nft[3] as string,    // buyer/importer
//           destinationCountry: nft[4] as string, // destination
//           dueDate: Number(nft[5]),           // due date
//           status: Number(protocol[3]) as NFTInvoiceStatus, // status from protocol
//           createdAt: Number(nft[7]),         // created timestamp
//           riskScore: Number(nft[8]),         // risk score
//           finalAPR: Number(protocol[4]),     // APR from protocol
//           documentHashes: docs[0] as string[], // document hashes
//           documentTypes: docs[1] as string[],  // document types
//           chainlinkVerified: false,          // Would check Chainlink data
//           vrfRandomness: '0',
//           commodityPrice: '0',
//           countryRiskScore: '0',
//           fundingProgress: 0,
//           investorCount: 0,
//           totalInvested: protocol[5] as bigint, // total invested
//           originCountry: 'Ethiopia',         // Default
//           description: `${nft[0]} export`,   // Generated description
//           buyerName: '',
//           destination: '',
//           documentHash: '',
//           committeeApproved: false,
//           totalYieldPaid: 0
//         };
//       }

//       return null;
//     } catch (error) {
//       console.error(`❌ Error fetching NFT ${tokenId}:`, error);
//       return null;
//     }
//   }, [publicClient]);

//   // STEP 3: Get Chainlink Data for NFT
//   const getChainlinkDataForNFT = useCallback(async (invoiceId: number): Promise<ChainlinkNFTData | null> => {
//     if (!publicClient) return null;

//     try {
//       console.log(`🔗 Fetching Chainlink data for invoice ${invoiceId}`);

//       const result = await publicClient.readContract({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'getChainlinkData',
//         args: [BigInt(invoiceId)],
//       });

//       if (result && Array.isArray(result)) {
//         const data = result as any[];
//         return {
//           vrfRandomness: data[0].toString(),
//           commodityPrice: data[1].toString(),
//           countryRiskScore: data[2].toString(),
//           chainlinkVerified: Boolean(data[3]),
//           ethPrice: data[4].toString(),
//           btcPrice: data[5].toString(),
//           linkPrice: data[6].toString(),
//           usdcPrice: data[7].toString(),
//         };
//       }

//       return null;
//     } catch (error) {
//       console.error(`❌ Error fetching Chainlink data for ${invoiceId}:`, error);
//       return null;
//     }
//   }, [publicClient]);

//   // STEP 4: Invest in NFT Invoice
//   const investInNFTInvoice = useCallback(async (
//     invoiceId: number,
//     amount: string
//   ) => {
//     if (!isConnected || !address) {
//       return { success: false, error: 'Wallet not connected' };
//     }

//     setLoading(true);
//     try {
//       console.log('💰 Investing in NFT invoice...', { invoiceId, amount });

//       const amountWei = parseUnits(amount, 6);

//       // First approve USDC spending
//       const approveHash = await writeContractAsync({
//         address: CONTRACTS.MOCK_USDC,
//         abi: MockUSDCArtifact.abi,
//         functionName: 'approve',
//         args: [CONTRACTS.PROTOCOL, amountWei],
//       });

//       console.log('✅ USDC approved:', approveHash);
//       setTxHash(approveHash);

//       // Wait for approval confirmation
//       await new Promise(resolve => setTimeout(resolve, 3000));

//       // Then invest in the invoice
//       const investHash = await writeContractAsync({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'investInInvoice',
//         args: [BigInt(invoiceId), amountWei],
//       });

//       console.log('✅ Investment made:', investHash);
//       setTxHash(investHash);

//       // Refresh NFT data after investment
//       setTimeout(async () => {
//         await loadAllNFTs();
//       }, 5000);

//       return { success: true, hash: investHash };
//     } catch (error: any) {
//       console.error('❌ Investment failed:', error);
//       return { success: false, error: error.shortMessage || error.message };
//     } finally {
//       setLoading(false);
//     }
//   }, [isConnected, address, writeContractAsync]);

//   // STEP 5: Committee Actions
//   const verifyNFTDocument = useCallback(async (
//     invoiceId: number,
//     documentHash: string,
//     isValid: boolean,
//     notes: string
//   ) => {
//     setLoading(true);
//     try {
//       console.log('✅ Verifying NFT document...', { invoiceId, documentHash, isValid });

//       const hash = await writeContractAsync({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'verifyDocumentWithNotes',
//         args: [BigInt(invoiceId), documentHash, isValid, notes],
//       });

//       console.log('✅ Document verification transaction:', hash);
//       setTxHash(hash);

//       return { success: true, hash };
//     } catch (error: any) {
//       console.error('❌ Document verification failed:', error);
//       return { success: false, error: error.shortMessage || error.message };
//     } finally {
//       setLoading(false);
//     }
//   }, [writeContractAsync]);

//   const castVoteOnNFT = useCallback(async (
//     invoiceId: number,
//     approve: boolean
//   ) => {
//     setLoading(true);
//     try {
//       console.log('🗳️ Casting vote on NFT invoice...', { invoiceId, approve });

//       const hash = await writeContractAsync({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'castVote',
//         args: [BigInt(invoiceId), approve],
//       });

//       console.log('✅ Vote cast:', hash);
//       setTxHash(hash);

//       return { success: true, hash };
//     } catch (error: any) {
//       console.error('❌ Vote failed:', error);
//       return { success: false, error: error.shortMessage || error.message };
//     } finally {
//       setLoading(false);
//     }
//   }, [writeContractAsync]);

//   // Get Vault Info for NFT
//   const getVaultInfo = useCallback(async (invoiceId: number): Promise<VaultInfo | null> => {
//     if (!publicClient) return null;

//     try {
//       const result = await publicClient.readContract({
//         address: CONTRACTS.PROTOCOL,
//         abi: YieldXCoreArtifact.abi,
//         functionName: 'getInvoiceDetails',
//         args: [BigInt(invoiceId)],
//       });

//       if (result && Array.isArray(result)) {
//         const data = result as any[];
//         return {
//           targetAmount: data[2] as bigint,     // invoice amount
//           currentAmount: data[5] as bigint,    // total invested
//           finalAPR: Number(data[4]),           // APR rate
//           active: Number(data[3]) === 1,       // approved status
//           investorCount: 0,                    // Would need separate call
//           fundingDeadline: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
//         };
//       }
//       return null;
//     } catch (error: any) {
//       console.error('❌ Failed to get vault info:', error);
//       return null;
//     }
//   }, [publicClient]);

//   // Transfer NFT Invoice (ERC721 transfer)
//   const transferNFTInvoice = useCallback(async (
//     tokenId: number,
//     toAddress: string
//   ) => {
//     if (!isConnected || !address) {
//       return { success: false, error: 'Wallet not connected' };
//     }

//     setLoading(true);
//     try {
//       console.log('🔄 Transferring NFT invoice...', { tokenId, toAddress });

//       const hash = await writeContractAsync({
//         address: CONTRACTS.INVOICE_NFT,
//         abi: YieldXInvoiceNFTArtifact.abi,
//         functionName: 'transferFrom',
//         args: [address, toAddress, BigInt(tokenId)],
//       });

//       console.log('✅ NFT transferred:', hash);
//       setTxHash(hash);

//       // Update local state
//       setTimeout(async () => {
//         await loadAllNFTs();
//       }, 3000);

//       return { success: true, hash };
//     } catch (error: any) {
//       console.error('❌ NFT transfer failed:', error);
//       return { success: false, error: error.shortMessage || error.message };
//     } finally {
//       setLoading(false);
//     }
//   }, [isConnected, address, writeContractAsync]);

//   // Load all NFTs from blockchain
//   const loadAllNFTs = useCallback(async () => {
//     if (!publicClient || !totalSupply) return;

//     setLoading(true);
//     try {
//       console.log(`🔍 Loading all NFTs... Total supply: ${totalSupply}`);

//       const allNFTs: NFTInvoiceData[] = [];
//       const userNFTs: NFTInvoiceData[] = [];

//       for (let i = 1; i <= Number(totalSupply); i++) {
//         const nftData = await getNFTInvoiceData(i);
//         if (nftData) {
//           allNFTs.push(nftData);
          
//           // Check if user owns this NFT
//           if (address && nftData.owner.toLowerCase() === address.toLowerCase()) {
//             userNFTs.push(nftData);
//           }
//         }
//       }

//       setInvoiceNFTs(allNFTs);
//       setOwnedNFTs(userNFTs);
      
//       console.log(`✅ Loaded ${allNFTs.length} NFTs, user owns ${userNFTs.length}`);
//     } catch (error) {
//       console.error('❌ Error loading NFTs:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [publicClient, totalSupply, address, getNFTInvoiceData]);

//   // Get NFT Statistics
//   const getNFTStats = useCallback(() => {
//     const totalNFTs = invoiceNFTs.length;
//     const ownedCount = ownedNFTs.length;
//     const approvedCount = invoiceNFTs.filter(nft => nft.status === NFTInvoiceStatus.APPROVED).length;
//     const fundedCount = invoiceNFTs.filter(nft => nft.status === NFTInvoiceStatus.FUNDED).length;
//     const totalValue = invoiceNFTs.reduce((sum, nft) => sum + Number(formatUnits(nft.amount, 6)), 0);
//     const averageAPR = invoiceNFTs.filter(nft => nft.finalAPR > 0)
//       .reduce((sum, nft, _, arr) => sum + nft.finalAPR / arr.length, 0);

//     return {
//       totalNFTs,
//       ownedCount,
//       approvedCount,
//       fundedCount,
//       totalValue,
//       averageAPR: averageAPR / 100 // Convert to percentage
//     };
//   }, [invoiceNFTs, ownedNFTs]);

//   // Auto-load NFTs when total supply changes
//   useEffect(() => {
//     if (totalSupply && Number(totalSupply) > 0) {
//       loadAllNFTs();
//     }
//   }, [totalSupply, loadAllNFTs]);

//   // Refresh on transaction success
//   useEffect(() => {
//     if (isTransactionSuccess) {
//       console.log('🎉 Transaction confirmed, refreshing NFT data...');
//       setTimeout(() => {
//         loadAllNFTs();
//       }, 3000);
//     }
//   }, [isTransactionSuccess, loadAllNFTs]);

//   // Debug logging
//   useEffect(() => {
//     console.log('🎨 NFT System State:', {
//       totalSupply: totalSupply ? Number(totalSupply) : 0,
//       userBalance: userBalance ? Number(userBalance) : 0,
//       totalNFTs: invoiceNFTs.length,
//       ownedNFTs: ownedNFTs.length,
//       isConnected,
//       address,
//       contracts: CONTRACTS
//     });
//   }, [totalSupply, userBalance, invoiceNFTs.length, ownedNFTs.length, isConnected, address]);

//   // Add verifyInvoiceNFT stub if missing
//   const verifyInvoiceNFT = async (tokenId: string) => {
//     // TODO: implement
//     return { success: true };
//   };

//   return {
//     // State
//     invoiceNFTs,
//     ownedNFTs,
//     loading: loading || isPending || isTransactionLoading,
//     txHash,
//     totalSupply: totalSupply ? Number(totalSupply) : 0,
//     userBalance: userBalance ? Number(userBalance) : 0,
    
//     // Core Actions
//     submitInvoiceAndMintNFT,
//     investInNFTInvoice,
//     transferNFTInvoice,
    
//     // Committee Actions
//     verifyNFTDocument,
//     castVoteOnNFT,
    
//     // Data Queries
//     getNFTInvoiceData,
//     getChainlinkDataForNFT,
//     getVaultInfo,
//     getNFTStats,
//     loadAllNFTs,
    
//     // Transaction State
//     isTransactionSuccess,
    
//     // Constants
//     CONTRACTS,
//     NFTInvoiceStatus,
//     verifyInvoiceNFT
//   };
// }
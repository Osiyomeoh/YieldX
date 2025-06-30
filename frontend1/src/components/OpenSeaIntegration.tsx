// // src/components/OpenSeaIntegration.tsx - NFT Image Preview & OpenSea Integration
// import React, { useState, useEffect } from 'react';
// import {
//   Download, ExternalLink, Eye, Share2, Copy, CheckCircle,
//   Image as ImageIcon, Code, Palette, Sparkles
// } from 'lucide-react';
// import { NFTInvoiceData } from '../types';
// import { nftImageGenerator } from '../utils/nftImageGenerator';

// interface OpenSeaIntegrationProps {
//   nft: NFTInvoiceData;
//   contractAddress: string;
// }

// export function OpenSeaIntegration({ nft, contractAddress }: OpenSeaIntegrationProps) {
//   const [imageURL, setImageURL] = useState<string>('');
//   const [metadata, setMetadata] = useState<any>(null);
//   const [showMetadata, setShowMetadata] = useState(false);
//   const [copied, setCopied] = useState<'image' | 'metadata' | 'opensea' | null>(null);

//   useEffect(() => {
//     // Generate NFT image and metadata
//     const svg = nftImageGenerator.generateSVGImage(nft);
//     const dataURL = nftImageGenerator.svgToDataURL(svg);
//     const meta = nftImageGenerator.generateOpenSeaMetadata(nft);
    
//     setImageURL(dataURL);
//     setMetadata(meta);
//   }, [nft]);

//   const copyToClipboard = async (text: string, type: 'image' | 'metadata' | 'opensea') => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopied(type);
//       setTimeout(() => setCopied(null), 2000);
//     } catch (error) {
//       console.error('Failed to copy:', error);
//     }
//   };

//   const downloadImage = (format: 'svg' | 'png') => {
//     nftImageGenerator.downloadNFTImage(nft, format);
//   };

//   const downloadMetadata = () => {
//     const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `yieldx-nft-${nft.tokenId}-metadata.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const openSeaURL = `https://testnets.opensea.io/assets/base-sepolia/${contractAddress}/${nft.tokenId}`;

//   return (
//     <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-xl font-bold">NFT #${nft.tokenId}</h3>
//             <p className="text-purple-100">{nft.commodity} Invoice NFT</p>
//           </div>
//           <div className="flex items-center gap-2">
//             <Sparkles className="w-6 h-6" />
//             <span className="text-sm">OpenSea Ready</span>
//           </div>
//         </div>
//       </div>

//       <div className="p-6 space-y-6">
//         {/* NFT Image Preview */}
//         <div className="flex flex-col lg:flex-row gap-6">
//           {/* Image Display */}
//           <div className="lg:w-1/2">
//             <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
//               {imageURL ? (
//                 <div className="space-y-4">
//                   <img
//                     src={imageURL}
//                     alt={`YieldX NFT #${nft.tokenId}`}
//                     className="w-full max-w-sm mx-auto rounded-lg shadow-lg border"
//                   />
//                   <div className="flex justify-center gap-2">
//                     <button
//                       onClick={() => downloadImage('svg')}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
//                     >
//                       <Download className="w-4 h-4" />
//                       SVG
//                     </button>
//                     <button
//                       onClick={() => downloadImage('png')}
//                       className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
//                     >
//                       <Download className="w-4 h-4" />
//                       PNG
//                     </button>
//                     <button
//                       onClick={() => copyToClipboard(imageURL, 'image')}
//                       className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
//                     >
//                       {copied === 'image' ? (
//                         <CheckCircle className="w-4 h-4" />
//                       ) : (
//                         <Copy className="w-4 h-4" />
//                       )}
//                       Copy URL
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-500">Generating NFT image...</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* NFT Details */}
//           <div className="lg:w-1/2 space-y-4">
//             <div className="bg-gray-50 rounded-lg p-4">
//               <h4 className="font-semibold text-gray-900 mb-3">NFT Attributes</h4>
//               <div className="grid grid-cols-2 gap-4 text-sm">
//                 <div>
//                   <p className="text-gray-600">Commodity</p>
//                   <p className="font-medium">{nft.commodity}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-600">Amount</p>
//                   <p className="font-medium">${(Number(nft.amount) / 1000000).toLocaleString()}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-600">APR</p>
//                   <p className="font-medium">{(nft.finalAPR / 100).toFixed(1)}%</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-600">Status</p>
//                   <p className="font-medium">{nft.status === 0 ? 'Pending' : nft.status === 1 ? 'Verified' : nft.status === 2 ? 'Funded' : 'Completed'}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-600">Exporter</p>
//                   <p className="font-medium">{nft.exporterName}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-600">Destination</p>
//                   <p className="font-medium">{nft.destination}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Verification Badges */}
//             <div className="bg-gray-50 rounded-lg p-4">
//               <h4 className="font-semibold text-gray-900 mb-3">Verification Status</h4>
//               <div className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   {nft.chainlinkVerified ? (
//                     <CheckCircle className="w-4 h-4 text-green-600" />
//                   ) : (
//                     <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
//                   )}
//                   <span className="text-sm">Chainlink Oracle Verified</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {nft.committeeApproved ? (
//                     <CheckCircle className="w-4 h-4 text-green-600" />
//                   ) : (
//                     <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
//                   )}
//                   <span className="text-sm">Committee Approved</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="w-4 h-4 text-green-600" />
//                   <span className="text-sm">Document Hash Verified</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* OpenSea Metadata */}
//         <div className="border rounded-lg p-4">
//           <div className="flex items-center justify-between mb-4">
//             <h4 className="font-semibold text-gray-900 flex items-center gap-2">
//               <Code className="w-4 h-4" />
//               OpenSea Metadata
//             </h4>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setShowMetadata(!showMetadata)}
//                 className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
//               >
//                 <Eye className="w-4 h-4" />
//                 {showMetadata ? 'Hide' : 'Show'}
//               </button>
//               <button
//                 onClick={downloadMetadata}
//                 className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
//               >
//                 <Download className="w-4 h-4" />
//                 Download
//               </button>
//               <button
//                 onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2), 'metadata')}
//                 className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
//               >
//                 {copied === 'metadata' ? (
//                   <CheckCircle className="w-4 h-4" />
//                 ) : (
//                   <Copy className="w-4 h-4" />
//                 )}
//                 Copy
//               </button>
//             </div>
//           </div>

//           {showMetadata && metadata && (
//             <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
//               <pre className="text-sm">
//                 {JSON.stringify(metadata, null, 2)}
//               </pre>
//             </div>
//           )}
//         </div>

//         {/* OpenSea Integration */}
//         <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h4 className="font-semibold text-gray-900 mb-1">OpenSea Integration</h4>
//               <p className="text-sm text-gray-600">View and trade this NFT on OpenSea marketplace</p>
//             </div>
//             <div className="flex items-center gap-2">
//               <img 
//                 src="https://opensea.io/static/images/logos/opensea-logo.svg" 
//                 alt="OpenSea" 
//                 className="w-8 h-8"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="bg-white rounded-lg p-4 border">
//               <h5 className="font-medium text-gray-900 mb-2">Contract Address</h5>
//               <div className="flex items-center gap-2">
//                 <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
//                 {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
//               </code>
//               <button
//                 onClick={() => copyToClipboard(contractAddress, 'opensea')}
//                 className="text-blue-600 hover:text-blue-800"
//               >
//                 {copied === 'opensea' ? (
//                   <CheckCircle className="w-4 h-4" />
//                 ) : (
//                   <Copy className="w-4 h-4" />
//                 )}
//               </button>
//             </div>

//             <div className="bg-white rounded-lg p-4 border">
//               <h5 className="font-medium text-gray-900 mb-2">Token ID</h5>
//               <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
//                 #{nft.tokenId}
//               </code>
//             </div>
//           </div>

//           <div className="mt-4 flex gap-3">
//             <a
//               href={openSeaURL}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
//             >
//               <ExternalLink className="w-4 h-4" />
//               View on OpenSea
//             </a>
//             <button
//               onClick={() => copyToClipboard(openSeaURL, 'opensea')}
//               className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
//             >
//               {copied === 'opensea' ? (
//                 <CheckCircle className="w-4 h-4" />
//               ) : (
//                 <Share2 className="w-4 h-4" />
//               )}
//               Share
//             </button>
//           </div>
//         </div>

//         {/* Implementation Guide */}
//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
//           <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             <Palette className="w-4 h-4 text-yellow-600" />
//             Implementation Guide
//           </h4>
//           <div className="space-y-3 text-sm text-gray-700">
//             <div>
//               <p className="font-medium">1. Smart Contract Integration</p>
//               <p>Add the <code className="bg-gray-200 px-1 rounded">tokenURI</code> function to your NFT contract that returns the metadata JSON.</p>
//             </div>
//             <div>
//               <p className="font-medium">2. IPFS Upload (Recommended)</p>
//               <p>Upload the generated image and metadata to IPFS for decentralized storage. Replace data URLs with IPFS hashes.</p>
//             </div>
//             <div>
//               <p className="font-medium">3. OpenSea Collection</p>
//               <p>Create a collection on OpenSea and ensure your contract implements ERC721 with proper metadata standards.</p>
//             </div>
//             <div>
//               <p className="font-medium">4. Automatic Updates</p>
//               <p>As NFT status changes (verified, funded, completed), update the metadata to reflect current state.</p>
//             </div>
//           </div>
//         </div>

//         {/* Sample Contract Code */}
//         <div className="bg-gray-50 rounded-lg p-4">
//           <h4 className="font-semibold text-gray-900 mb-3">Sample Smart Contract Code</h4>
//           <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
//             <pre className="text-sm">
// {`// Add to your YieldXInvoiceNFT contract
// function tokenURI(uint256 tokenId) public view returns (string memory) {
//     require(_exists(tokenId), "Token does not exist");
    
//     // Get invoice data
//     InvoiceData memory invoice = getInvoiceData(tokenId);
    
//     // Generate metadata JSON
//     string memory json = Base64.encode(
//         bytes(string(abi.encodePacked(
//             '{"name": "YieldX Invoice #', 
//             Strings.toString(tokenId),
//             ' - ', invoice.commodity,
//             '", "description": "Tokenized trade finance invoice...",',
//             '"image": "', _generateImageURI(tokenId), '",',
//             '"attributes": ', _generateAttributes(tokenId), '}'
//         )))
//     );
    
//     return string(abi.encodePacked("data:application/json;base64,", json));
// }

// function _generateImageURI(uint256 tokenId) internal view returns (string memory) {
//     // Return IPFS hash or generated SVG data URI
//     return string(abi.encodePacked(
//         "data:image/svg+xml;base64,",
//         _generateBase64SVG(tokenId)
//     ));
// }`}
//             </pre>
//           </div>
//         </div>

//         {/* Dynamic Metadata Features */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//             <h5 className="font-medium text-green-900 mb-2">✅ Dynamic Features</h5>
//             <ul className="text-sm text-green-800 space-y-1">
//               <li>• Status-based color themes</li>
//               <li>• Real-time funding progress</li>
//               <li>• Commodity-specific designs</li>
//               <li>• Verification badges</li>
//               <li>• APR and risk display</li>
//               <li>• Regional artwork themes</li>
//             </ul>
//           </div>

//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <h5 className="font-medium text-blue-900 mb-2">🎨 Visual Elements</h5>
//             <ul className="text-sm text-blue-800 space-y-1">
//               <li>• Gradient backgrounds</li>
//               <li>• Commodity emojis/icons</li>
//               <li>• Status indicators</li>
//               <li>• Glowing borders</li>
//               <li>• Text shadows & effects</li>
//               <li>• Professional typography</li>
//             </ul>
//           </div>
//         </div>

//         {/* Rarity & Trading Info */}
//         <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
//           <h4 className="font-semibold text-purple-900 mb-3">NFT Rarity & Trading</h4>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
//             <div>
//               <p className="text-purple-700 font-medium">Commodity Rarity</p>
//               <p className="text-purple-600">
//                 {nft.commodity.toLowerCase().includes('gold') || nft.commodity.toLowerCase().includes('diamond') ? 'Legendary' :
//                  nft.commodity.toLowerCase().includes('coffee') || nft.commodity.toLowerCase().includes('cocoa') ? 'Rare' :
//                  'Common'}
//               </p>
//             </div>
//             <div>
//               <p className="text-purple-700 font-medium">Status Rarity</p>
//               <p className="text-purple-600">
//                 {nft.status === 3 ? 'Ultra Rare (Completed)' :
//                  nft.status === 2 ? 'Rare (Funded)' :
//                  nft.status === 1 ? 'Uncommon (Verified)' :
//                  'Common (Pending)'}
//               </p>
//             </div>
//             <div>
//               <p className="text-purple-700 font-medium">Utility Score</p>
//               <p className="text-purple-600">
//                 {nft.finalAPR > 1500 ? 'High Yield' :
//                  nft.finalAPR > 1000 ? 'Medium Yield' :
//                  'Standard Yield'}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
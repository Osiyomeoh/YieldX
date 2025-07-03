// src/components/PinataUploader.tsx - NFT Upload to IPFS Component
import React, { useState, useEffect } from 'react';
import {
  Upload, CheckCircle, AlertCircle, ExternalLink, Copy, 
  Loader2, Cloud, Image as ImageIcon, FileText, Zap, RefreshCw
} from 'lucide-react';
import { NFTInvoiceData } from '../types';
import { pinataService, uploadNFTToPinata, updateNFTOnPinata, testPinataConnection } from '../services/pinataService';

interface PinataUploaderProps {
  nft: NFTInvoiceData;
  onUploadComplete?: (result: {
    imageHash: string;
    metadataHash: string;
    tokenURI: string;
  }) => void;
}

interface UploadStatus {
  stage: 'idle' | 'connecting' | 'uploading-image' | 'uploading-metadata' | 'complete' | 'error';
  progress: number;
  message: string;
  imageHash?: string;
  metadataHash?: string;
  tokenURI?: string;
  error?: string;
}

export function PinataUploader({ nft, onUploadComplete }: PinataUploaderProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to upload'
  } as UploadStatus);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<'image' | 'metadata' | 'tokenuri' | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);

  // Test Pinata connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await testPinataConnection();
      setIsConnected(connected);
      
      if (connected) {
        const stats = await pinataService.getUsageStats();
        setUsageStats(stats);
      }
    };
    
    checkConnection();
  }, []);

  const copyToClipboard = async (text: string, type: 'image' | 'metadata' | 'tokenuri') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleUpload = async () => {
    if (!isConnected) {
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: 'Pinata connection failed',
        error: 'Please check your Pinata API credentials'
      });
      return;
    }

    try {
      // Stage 1: Connection test
      setUploadStatus({
        stage: 'connecting',
        progress: 10,
        message: 'Connecting to Pinata IPFS...'
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay

      // Stage 2: Upload image
      setUploadStatus({
        stage: 'uploading-image',
        progress: 30,
        message: 'Generating and uploading NFT image...'
      });

      const imageResult = await pinataService.uploadNFTImage(nft);
      if (!imageResult.success || !imageResult.ipfsHash) {
        throw new Error(imageResult.error || 'Image upload failed');
      }

      setUploadStatus({
        stage: 'uploading-image',
        progress: 60,
        message: 'Image uploaded successfully!',
        imageHash: imageResult.ipfsHash
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay

      // Stage 3: Upload metadata
      setUploadStatus({
        stage: 'uploading-metadata',
        progress: 80,
        message: 'Uploading NFT metadata...'
      });

      const metadataResult = await pinataService.uploadNFTMetadata(nft, imageResult.ipfsHash);
      if (!metadataResult.success || !metadataResult.ipfsHash) {
        throw new Error(metadataResult.error || 'Metadata upload failed');
      }

      const tokenURI = `ipfs://${metadataResult.ipfsHash}`;

      // Stage 4: Complete
      setUploadStatus({
        stage: 'complete',
        progress: 100,
        message: 'NFT uploaded to IPFS successfully!',
        imageHash: imageResult.ipfsHash,
        metadataHash: metadataResult.ipfsHash,
        tokenURI
      });

      // Callback with results
      if (onUploadComplete) {
        onUploadComplete({
          imageHash: imageResult.ipfsHash,
          metadataHash: metadataResult.ipfsHash,
          tokenURI
        });
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus({
        stage: 'error',
        progress: 0,
        message: 'Upload failed',
        error: error.message || 'Unknown error occurred'
      });
    }
  };

  const handleUpdate = async () => {
    if (!uploadStatus.imageHash) {
      await handleUpload();
      return;
    }

    try {
      setUploadStatus(prev => ({
        ...prev,
        stage: 'uploading-metadata',
        progress: 50,
        message: 'Updating NFT metadata...'
      }));

      const result = await updateNFTOnPinata(nft, uploadStatus.imageHash);
      
      if (result.success && result.ipfsHash) {
        setUploadStatus(prev => ({
          ...prev,
          stage: 'complete',
          progress: 100,
          message: 'NFT metadata updated successfully!',
          metadataHash: result.ipfsHash,
          tokenURI: `ipfs://${result.ipfsHash}`
        }));
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error: any) {
      setUploadStatus(prev => ({
        ...prev,
        stage: 'error',
        message: 'Update failed',
        error: error.message
      }));
    }
  };

  const resetUpload = () => {
    setUploadStatus({
      stage: 'idle',
      progress: 0,
      message: 'Ready to upload'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-600" />
            Pinata IPFS Upload
          </h3>
          <p className="text-gray-600">Upload NFT to decentralized storage</p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected === null ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* NFT Preview */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            #{nft.tokenId}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{nft.commodity}</h4>
            <p className="text-sm text-gray-600">{nft.exporterName}</p>
            <p className="text-sm text-gray-500">
              ${(Number(nft.amount) / 1000000).toLocaleString()} • 
              {nft.finalAPR > 0 ? ` ${(nft.finalAPR / 100).toFixed(1)}% APR` : ' Pending APR'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Upload Progress</span>
          <span className="text-sm text-gray-500">{uploadStatus.progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              uploadStatus.stage === 'error' ? 'bg-red-500' :
              uploadStatus.stage === 'complete' ? 'bg-green-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${uploadStatus.progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          {uploadStatus.stage === 'connecting' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          {uploadStatus.stage === 'uploading-image' && <ImageIcon className="w-4 h-4 text-blue-600" />}
          {uploadStatus.stage === 'uploading-metadata' && <FileText className="w-4 h-4 text-blue-600" />}
          {uploadStatus.stage === 'complete' && <CheckCircle className="w-4 h-4 text-green-600" />}
          {uploadStatus.stage === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
          
          <span className={`text-sm ${
            uploadStatus.stage === 'error' ? 'text-red-600' :
            uploadStatus.stage === 'complete' ? 'text-green-600' :
            'text-gray-700'
          }`}>
            {uploadStatus.message}
          </span>
        </div>

        {uploadStatus.error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{uploadStatus.error}</p>
          </div>
        )}
      </div>

      {/* Upload Results */}
      {uploadStatus.stage === 'complete' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Upload Complete!
          </h4>
          
          <div className="space-y-3 text-sm">
            {/* Image Hash */}
            <div>
              <p className="text-green-700 font-medium">Image IPFS Hash:</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-white px-2 py-1 rounded border text-green-800 flex-1">
                  {uploadStatus.imageHash}
                </code>
                <button
                  onClick={() => copyToClipboard(uploadStatus.imageHash!, 'image')}
                  className="text-green-600 hover:text-green-800"
                >
                  {copied === 'image' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={pinataService.getIpfsUrl(uploadStatus.imageHash!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Metadata Hash */}
            <div>
              <p className="text-green-700 font-medium">Metadata IPFS Hash:</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-white px-2 py-1 rounded border text-green-800 flex-1">
                  {uploadStatus.metadataHash}
                </code>
                <button
                  onClick={() => copyToClipboard(uploadStatus.metadataHash!, 'metadata')}
                  className="text-green-600 hover:text-green-800"
                >
                  {copied === 'metadata' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={pinataService.getIpfsUrl(uploadStatus.metadataHash!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Token URI */}
            <div>
              <p className="text-green-700 font-medium">Token URI (for Smart Contract):</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-white px-2 py-1 rounded border text-green-800 flex-1">
                  {uploadStatus.tokenURI}
                </code>
                <button
                  onClick={() => copyToClipboard(uploadStatus.tokenURI!, 'tokenuri')}
                  className="text-green-600 hover:text-green-800"
                >
                  {copied === 'tokenuri' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {uploadStatus.stage === 'idle' || uploadStatus.stage === 'error' || uploadStatus.stage === 'connecting' ? (
          <button
            onClick={handleUpload}
            disabled={!isConnected || uploadStatus.stage === 'connecting'}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploadStatus.stage === 'connecting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload to IPFS
          </button>
        ) : uploadStatus.stage === 'complete' ? (
          <>
            <button
              onClick={handleUpdate}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update Metadata
            </button>
            <button
              onClick={resetUpload}
              className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              New Upload
            </button>
          </>
        ) : (
          <button
            disabled
            className="flex-1 bg-gray-400 text-white py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </button>
        )}
      </div>

      {/* Usage Stats */}
      {usageStats && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Pinata Usage Statistics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-blue-600 font-medium">Total Files</p>
              <p className="text-lg font-bold text-blue-900">{usageStats.pin_count || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-600 font-medium">Total Size</p>
              <p className="text-lg font-bold text-green-900">
                {usageStats.pin_size_total ? `${(usageStats.pin_size_total / 1024 / 1024).toFixed(1)} MB` : '0 MB'}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-purple-600 font-medium">This Month</p>
              <p className="text-lg font-bold text-purple-900">
                {usageStats.pin_size_with_replications_total ? 
                  `${(usageStats.pin_size_with_replications_total / 1024 / 1024).toFixed(1)} MB` : '0 MB'}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-orange-600 font-medium">Status</p>
              <p className="text-lg font-bold text-orange-900">Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions (if not connected) */}
      {!isConnected && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pinata Setup Required
            </h4>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>To upload NFTs to IPFS, you need to configure Pinata:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Sign up at <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">pinata.cloud</a></li>
                <li>Get your API credentials from the dashboard</li>
                <li>Add these to your <code className="bg-gray-200 px-1 rounded">.env</code> file:</li>
              </ol>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg mt-3 font-mono text-xs">
                <div>REACT_APP_PINATA_JWT=your_jwt_token_here</div>
                <div>REACT_APP_PINATA_GATEWAY=https://gateway.pinata.cloud</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
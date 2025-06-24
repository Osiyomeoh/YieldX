// src/services/pinataService.ts - Complete Pinata IPFS Integration
import { NFTInvoiceData } from '../types';
import { nftImageGenerator } from '../utils/nftImageGenerator';

// Pinata configuration
interface PinataConfig {
  apiKey: string;
  apiSecret: string;
  jwt: string;
  gateway: string;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface UploadResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

export class PinataService {
  private config: PinataConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_PINATA_API_KEY || 'a79da4d212f5c7612200',
      apiSecret: process.env.REACT_APP_PINATA_API_SECRET || '5e15ead3e2276c845932bc53441bf8a58ab02c83fe71f0204b64dd87f47e2a5d',
      jwt: process.env.REACT_APP_PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0N2MzODlkOC05ZDRlLTQ0NWYtOGExMy02YTFiYzY1OTA5MTUiLCJlbWFpbCI6InNhbXVlbGFsZW9ub21vaDVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImE3OWRhNGQyMTJmNWM3NjEyMjAwIiwic2NvcGVkS2V5U2VjcmV0IjoiNWUxNWVhZDNlMjI3NmM4NDU5MzJiYzUzNDQxYmY4YTU4YWIwMmM4M2ZlNzFmMDIwNGI2NGRkODdmNDdlMmE1ZCIsImV4cCI6MTc4MTQ2NTM5OH0.xwXhtqHPTbhu_BQVDlvdFhH9rqKQNCKTzr7DhyuuFkQ',
      gateway: process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
    };

    if (!this.config.jwt) {
      console.warn('Pinata JWT not configured. Using demo mode.');
    }
  }

  // Test Pinata connection
  async testConnection(): Promise<boolean> {
    if (!this.config.jwt) return false;

    try {
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
        }
      });

      const result = await response.json();
      return result.message === 'Congratulations! You are communicating with the Pinata API!';
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      return false;
    }
  }

  // ✅ NEW: Upload any file to IPFS (required by SubmitInvoice component)
  async uploadFile(file: File, options?: {
    name?: string;
    keyvalues?: Record<string, string>;
  }): Promise<PinataResponse> {
    if (!this.config.jwt) {
      throw new Error('Pinata JWT not configured');
    }
  
    try {
      console.log('📤 Starting simplified upload:', file.name, file.size, 'bytes');
  
      // Create minimal FormData
      const formData = new FormData();
      formData.append('file', file);
  
      // Add only essential metadata
      if (options?.name) {
        const metadata = {
          name: options.name
        };
        formData.append('pinataMetadata', JSON.stringify(metadata));
      }
  
      console.log('🌐 Making request to Pinata...');
  
      // Simplified fetch with minimal headers
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
          // NO Content-Type header - let browser set it for FormData
        },
        body: formData
      });
  
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
  
      const result: PinataResponse = await response.json();
      console.log('✅ Upload successful:', result);
  
      return result;
  
    } catch (error: any) {
      console.error('❌ Upload error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Pinata. Check your internet connection and Pinata credentials.');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication error: Invalid Pinata JWT token. Please generate new credentials.');
      } else if (error.message.includes('403')) {
        throw new Error('Permission error: Your Pinata API key lacks upload permissions.');
      } else {
        throw error;
      }
    }
  }
  // Upload SVG image to IPFS
  async uploadNFTImage(nft: NFTInvoiceData): Promise<UploadResult> {
    if (!this.config.jwt) {
      return {
        success: false,
        error: 'Pinata JWT not configured'
      };
    }

    try {
      console.log('🎨 Generating NFT image for upload...', nft.tokenId);
      
      // Generate SVG image
      const svg = nftImageGenerator.generateSVGImage(nft);
      const blob = new Blob([svg], { type: 'image/svg+xml' });

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, `yieldx-nft-${nft.tokenId}.svg`);

      // Pinata metadata
      const metadata = {
        name: `YieldX NFT #${nft.tokenId} Image`,
        keyvalues: {
          tokenId: nft.tokenId.toString(),
          commodity: nft.commodity,
          type: 'nft-image',
          status: nft.status.toString(),
          collection: 'yieldx-invoices'
        }
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));

      // Pinata options
      const options = {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            { id: 'FRA1', desiredReplicationCount: 2 },
            { id: 'NYC1', desiredReplicationCount: 2 }
          ]
        }
      };
      formData.append('pinataOptions', JSON.stringify(options));

      // Upload to Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PinataResponse = await response.json();
      const ipfsUrl = `${this.config.gateway}/ipfs/${result.IpfsHash}`;

      console.log('✅ NFT image uploaded to IPFS:', {
        hash: result.IpfsHash,
        url: ipfsUrl,
        size: result.PinSize
      });

      return {
        success: true,
        ipfsHash: result.IpfsHash,
        ipfsUrl: ipfsUrl
      };

    } catch (error: any) {
      console.error('❌ Failed to upload NFT image to IPFS:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Upload metadata JSON to IPFS
  async uploadNFTMetadata(nft: NFTInvoiceData, imageIpfsHash: string): Promise<UploadResult> {
    if (!this.config.jwt) {
      return {
        success: false,
        error: 'Pinata JWT not configured'
      };
    }

    try {
      console.log('📝 Uploading NFT metadata to IPFS...', nft.tokenId);

      // Generate metadata with IPFS image URL
      const metadata = nftImageGenerator.generateOpenSeaMetadata(nft);
      metadata.image = `ipfs://${imageIpfsHash}`;
      
      // Add additional IPFS-specific metadata
      metadata.image_data = null; // Clear data URL since we have IPFS
      metadata.external_url = `https://yieldx.finance/nft/${nft.tokenId}`;
      metadata.animation_url = null;

      // Convert to blob
      const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], { 
        type: 'application/json' 
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', jsonBlob, `yieldx-nft-${nft.tokenId}-metadata.json`);

      // Pinata metadata
      const pinataMetadata = {
        name: `YieldX NFT #${nft.tokenId} Metadata`,
        keyvalues: {
          tokenId: nft.tokenId.toString(),
          commodity: nft.commodity,
          type: 'nft-metadata',
          status: nft.status.toString(),
          collection: 'yieldx-invoices',
          imageHash: imageIpfsHash
        }
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      // Pinata options
      const options = {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            { id: 'FRA1', desiredReplicationCount: 2 },
            { id: 'NYC1', desiredReplicationCount: 2 }
          ]
        }
      };
      formData.append('pinataOptions', JSON.stringify(options));

      // Upload to Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PinataResponse = await response.json();
      const ipfsUrl = `${this.config.gateway}/ipfs/${result.IpfsHash}`;

      console.log('✅ NFT metadata uploaded to IPFS:', {
        hash: result.IpfsHash,
        url: ipfsUrl,
        size: result.PinSize
      });

      return {
        success: true,
        ipfsHash: result.IpfsHash,
        ipfsUrl: ipfsUrl
      };

    } catch (error: any) {
      console.error('❌ Failed to upload NFT metadata to IPFS:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Complete NFT upload process (image + metadata)
  async uploadCompleteNFT(nft: NFTInvoiceData): Promise<{
    success: boolean;
    imageHash?: string;
    metadataHash?: string;
    tokenURI?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Starting complete NFT upload process...', nft.tokenId);

      // Step 1: Upload image
      const imageResult = await this.uploadNFTImage(nft);
      if (!imageResult.success || !imageResult.ipfsHash) {
        return {
          success: false,
          error: `Image upload failed: ${imageResult.error}`
        };
      }

      // Step 2: Upload metadata (with image IPFS hash)
      const metadataResult = await this.uploadNFTMetadata(nft, imageResult.ipfsHash);
      if (!metadataResult.success || !metadataResult.ipfsHash) {
        return {
          success: false,
          error: `Metadata upload failed: ${metadataResult.error}`
        };
      }

      const tokenURI = `ipfs://${metadataResult.ipfsHash}`;

      console.log('🎉 Complete NFT upload successful!', {
        tokenId: nft.tokenId,
        imageHash: imageResult.ipfsHash,
        metadataHash: metadataResult.ipfsHash,
        tokenURI
      });

      return {
        success: true,
        imageHash: imageResult.ipfsHash,
        metadataHash: metadataResult.ipfsHash,
        tokenURI
      };

    } catch (error: any) {
      console.error('❌ Complete NFT upload failed:', error);
      return {
        success: false,
        error: error.message || 'Complete upload failed'
      };
    }
  }

  // Update existing NFT (when status changes)
  async updateNFTMetadata(nft: NFTInvoiceData, existingImageHash?: string): Promise<UploadResult> {
    try {
      console.log('🔄 Updating NFT metadata...', nft.tokenId);

      let imageHash = existingImageHash;

      // If no existing image hash, upload new image
      if (!imageHash) {
        const imageResult = await this.uploadNFTImage(nft);
        if (!imageResult.success || !imageResult.ipfsHash) {
          return {
            success: false,
            error: `Image upload failed: ${imageResult.error}`
          };
        }
        imageHash = imageResult.ipfsHash;
      }

      // Upload updated metadata
      const metadataResult = await this.uploadNFTMetadata(nft, imageHash);
      
      return metadataResult;

    } catch (error: any) {
      console.error('❌ Failed to update NFT metadata:', error);
      return {
        success: false,
        error: error.message || 'Update failed'
      };
    }
  }

  // Get pinned files for a collection
  async getCollectionFiles(): Promise<any[]> {
    if (!this.config.jwt) return [];

    try {
      const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues][collection]=yieldx-invoices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.rows || [];

    } catch (error) {
      console.error('Failed to get collection files:', error);
      return [];
    }
  }

  // Unpin file (cleanup)
  async unpinFile(ipfsHash: string): Promise<boolean> {
    if (!this.config.jwt) return false;

    try {
      const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to unpin file:', error);
      return false;
    }
  }

  // Get IPFS URL from hash
  getIpfsUrl(hash: string): string {
    return `${this.config.gateway}/ipfs/${hash}`;
  }

  // Get usage statistics
  async getUsageStats(): Promise<any> {
    if (!this.config.jwt) return null;

    try {
      const response = await fetch('https://api.pinata.cloud/data/userPinnedDataTotal', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.jwt}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const pinataService = new PinataService();

// Utility functions for React components
export const uploadNFTToPinata = async (nft: NFTInvoiceData) => {
  return await pinataService.uploadCompleteNFT(nft);
};

export const updateNFTOnPinata = async (nft: NFTInvoiceData, existingImageHash?: string) => {
  return await pinataService.updateNFTMetadata(nft, existingImageHash);
};

export const testPinataConnection = async () => {
  return await pinataService.testConnection();
};
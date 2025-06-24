// src/components/InvoiceVerification.tsx
import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, Clock, ExternalLink, Eye, FileText, Globe } from 'lucide-react';
import { ethers } from 'ethers';

interface VerificationData {
  documentHash: string;
  ipfsHash?: string;
  tradeLicenseVerified: boolean;
  exporterKYC: boolean;
  buyerVerified: boolean;
  commodityAuthentic: boolean;
  priceVerified: boolean;
  chainlinkDataConfirmed: boolean;
  riskScore: number;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
}

interface InvoiceVerificationProps {
  tokenId: number;
  invoice: {
    commodity: string;
    amount: ethers.BigNumber;
    exporter: string;
    status: number;
  };
  onVerify: (tokenId: number) => Promise<{ success: boolean; hash?: string; error?: string }>;
  isAdmin?: boolean;
}

export const InvoiceVerification: React.FC<InvoiceVerificationProps> = ({
  tokenId,
  invoice,
  onVerify,
  isAdmin = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Mock verification data (in real app, this would come from your verification service)
  const [verificationData, setVerificationData] = useState<VerificationData>({
    documentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`invoice-${tokenId}`)),
    ipfsHash: `Qm${Math.random().toString(36).substring(2, 15)}`,
    tradeLicenseVerified: Math.random() > 0.3,
    exporterKYC: Math.random() > 0.2,
    buyerVerified: Math.random() > 0.4,
    commodityAuthentic: Math.random() > 0.1,
    priceVerified: Math.random() > 0.2,
    chainlinkDataConfirmed: true, // Always true since we have Chainlink
    riskScore: Math.floor(Math.random() * 100),
    verificationLevel: Math.random() > 0.6 ? 'premium' : Math.random() > 0.3 ? 'enhanced' : 'basic'
  });

  const handleVerification = async () => {
    setVerifying(true);
    try {
      const result = await onVerify(tokenId);
      if (result.success) {
        // Update verification status
        setVerificationData(prev => ({
          ...prev,
          chainlinkDataConfirmed: true
        }));
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    setUploadingDocs(true);
    try {
      // Mock upload to IPFS
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
      setVerificationData(prev => ({
        ...prev,
        ipfsHash: mockHash,
        tradeLicenseVerified: true
      }));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingDocs(false);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-yellow-600 bg-yellow-100';
      case 1: return 'text-blue-600 bg-blue-100';
      case 2: return 'text-green-600 bg-green-100';
      case 3: return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending Verification';
      case 1: return 'Verified';
      case 2: return 'Funding Active';
      case 3: return 'Completed';
      default: return 'Unknown';
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskText = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  };

  const verificationChecks = [
    { key: 'tradeLicenseVerified', label: 'Trade License', icon: FileText },
    { key: 'exporterKYC', label: 'Exporter KYC', icon: Shield },
    { key: 'buyerVerified', label: 'Buyer Verification', icon: CheckCircle },
    { key: 'commodityAuthentic', label: 'Commodity Authentication', icon: Globe },
    { key: 'priceVerified', label: 'Price Verification', icon: AlertTriangle },
    { key: 'chainlinkDataConfirmed', label: 'Chainlink Oracle Data', icon: ExternalLink },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-emerald-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Invoice Verification</h3>
            <p className="text-gray-600 text-sm">Token ID: #{tokenId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
            {getStatusText(invoice.status)}
          </span>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {verificationChecks.filter(check => verificationData[check.key as keyof VerificationData]).length}/6
          </div>
          <div className="text-gray-600 text-sm">Checks Passed</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getRiskColor(verificationData.riskScore).split(' ')[0]}`}>
            {verificationData.riskScore}%
          </div>
          <div className="text-gray-600 text-sm">Risk Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 capitalize">
            {verificationData.verificationLevel}
          </div>
          <div className="text-gray-600 text-sm">Verification Level</div>
        </div>
      </div>

      {/* Verification Details */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h4 className="font-semibold text-gray-800 mb-4">Verification Checks</h4>
          
          {verificationChecks.map((check) => {
            const isVerified = verificationData[check.key as keyof VerificationData] as boolean;
            return (
              <div key={check.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <check.icon className={`h-5 w-5 ${isVerified ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-gray-800">{check.label}</span>
                </div>
                
                {isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
              </div>
            );
          })}

          {/* Document Hash */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold text-blue-800 mb-2">Document Verification</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 text-sm">Document Hash:</span>
                <code className="text-blue-800 text-xs font-mono bg-white px-2 py-1 rounded">
                  {verificationData.documentHash.slice(0, 20)}...
                </code>
              </div>
              
              {verificationData.ipfsHash && (
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 text-sm">IPFS Hash:</span>
                  <a
                    href={`https://ipfs.io/ipfs/${verificationData.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-800 text-xs font-mono bg-white px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    {verificationData.ipfsHash.slice(0, 15)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Upload Documents */}
          {isAdmin && invoice.status === 0 && (
            <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">Upload Supporting Documents</h5>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.png,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0])}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                disabled={uploadingDocs}
              />
              {uploadingDocs && (
                <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                  Uploading to IPFS...
                </div>
              )}
            </div>
          )}

          {/* Admin Verification Button */}
          {isAdmin && invoice.status === 0 && (
            <button
              onClick={handleVerification}
              disabled={verifying}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying with Chainlink...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Verify Invoice
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Risk Assessment */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Risk Assessment:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(verificationData.riskScore)}`}>
            {getRiskText(verificationData.riskScore)}
          </span>
        </div>
      </div>
    </div>
  );
};
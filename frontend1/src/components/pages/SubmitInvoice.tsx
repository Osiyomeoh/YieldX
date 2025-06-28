import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Upload, MapPin, DollarSign, Building, Ship, Hash, AlertCircle, CheckCircle, ExternalLink, Loader2, Zap, Shield, RefreshCw, Cloud, CloudUpload, XCircle } from 'lucide-react';
import { useYieldX } from '../../hooks/useYieldX';
import { pinataService } from '../../services/pinataService';

// Required trade documents for compliance
const TRADE_DOCUMENTS = [
  { id: 'commercial_invoice', name: 'Commercial Invoice', required: true, icon: FileText },
  { id: 'export_declaration', name: 'Export Declaration', required: true, icon: Shield },
  { id: 'certificate_origin', name: 'Certificate of Origin', required: true, icon: Shield },
  { id: 'bill_of_lading', name: 'Bill of Lading / Air Waybill', required: true, icon: Ship },
  { id: 'packing_list', name: 'Packing List', required: false, icon: FileText },
  { id: 'phytosanitary', name: 'Phytosanitary Certificate', required: false, icon: Shield },
];

interface SubmitInvoiceForm {
  commodity: string;
  amount: string;
  exporterName: string;
  buyerName: string;
  destination: string;
  description: string;
  originCountry: string;
}

interface DocumentUpload {
  id: string;
  file: File | null;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  ipfsHash?: string;
  ipfsUrl?: string;
  progress?: number;
  error?: string;
}

export function SubmitInvoice() {
  const { 
    submitInvoice, 
    approveUSDC,
    usdcBalance,
    loading, 
    isConnected, 
    address,
    chain,
    txHash,
    isTransactionSuccess,
    contracts,
    stats,
    refreshBalance,
    // Chainlink Functions integration
    getFunctionsConfig,
    startDocumentVerification,
    getVerificationData,
  } = useYieldX();

  const [formData, setFormData] = useState<SubmitInvoiceForm>({
    commodity: '',
    amount: '',
    exporterName: '',
    buyerName: '',
    destination: '',
    description: '',
    originCountry: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);
  const [documents, setDocuments] = useState<DocumentUpload[]>(
    TRADE_DOCUMENTS.map(doc => ({ id: doc.id, file: null, status: 'pending' as const }))
  );
  const [showDocuments, setShowDocuments] = useState(false);
  
  // IPFS Integration State
  const [ipfsConnected, setIpfsConnected] = useState<boolean>(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState<boolean>(false);
  const [metadataURI, setMetadataURI] = useState<string>('');

  // Approval Flow State
  const [approvalStep, setApprovalStep] = useState<'none' | 'approving' | 'approved' | 'submitting'>('none');
  const [approvalTxHash, setApprovalTxHash] = useState<string>('');
  const [submissionTxHash, setSubmissionTxHash] = useState<string>('');
  const [showApprovalDetails, setShowApprovalDetails] = useState<boolean>(false);

  // Test IPFS connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const connected = await pinataService.testConnection();
        setIpfsConnected(connected);
      } catch (error) {
        console.error('IPFS Connection Error:', error);
        setIpfsConnected(false);
      }
    };
    testConnection();
  }, []);

  // Refresh balance after transaction success
  useEffect(() => {
    if (isTransactionSuccess && txHash) {
      refreshBalance();
    }
  }, [isTransactionSuccess, txHash, refreshBalance]);

  // Calculate document completion
  const requiredDocs = TRADE_DOCUMENTS.filter(doc => doc.required);
  const uploadedRequiredDocs = documents.filter(doc => {
    const docInfo = TRADE_DOCUMENTS.find(d => d.id === doc.id);
    return docInfo?.required && (doc.status === 'uploaded' || doc.file);
  });
  const documentProgress = requiredDocs.length > 0 ? (uploadedRequiredDocs.length / requiredDocs.length) * 100 : 0;

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.commodity.trim()) newErrors.commodity = 'Commodity is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.exporterName.trim()) newErrors.exporterName = 'Exporter name is required';
    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer name is required';
    if (!formData.destination.trim()) newErrors.destination = 'Destination is required';
    if (!formData.originCountry.trim()) newErrors.originCountry = 'Origin country is required';
    if (!formData.description.trim() || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Check required documents
    if (uploadedRequiredDocs.length < requiredDocs.length) {
      newErrors.documents = `Please upload all ${requiredDocs.length} required documents`;
    }

    // Check USDC balance
    const amount = parseFloat(formData.amount);
    if (amount > (usdcBalance || 0)) {
      newErrors.amount = `Insufficient USDC balance. You have ${(usdcBalance || 0).toFixed(2)} USDC`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Upload document to IPFS with progress handling
  const uploadDocumentToIPFS = useCallback(async (docId: string, file: File): Promise<void> => {
    if (!ipfsConnected) {
      console.warn('IPFS not connected, skipping upload');
      return;
    }

    const docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex === -1) return;

    try {
      // Update status to uploading
      setDocuments(prev => prev.map((doc, index) => 
        index === docIndex ? { 
          ...doc, 
          status: 'uploading', 
          progress: 0, 
          error: undefined 
        } : doc
      ));

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setDocuments(prev => prev.map((doc, index) => {
          if (index === docIndex && doc.status === 'uploading') {
            const currentProgress = doc.progress || 0;
            const newProgress = Math.min(currentProgress + Math.random() * 15, 85);
            return { ...doc, progress: newProgress };
          }
          return doc;
        }));
      }, 300);

      // Upload to IPFS via Pinata
      const result = await pinataService.uploadFile(file, {
        name: `${formData.exporterName}_${docId}_${file.name}`,
        keyvalues: {
          documentType: docId,
          invoiceSubmission: 'true',
          exporter: formData.exporterName,
          commodity: formData.commodity,
          timestamp: new Date().toISOString(),
          submittedBy: address || ''
        }
      });

      // Clear progress interval
      clearInterval(progressInterval);

      if (!result?.IpfsHash) {
        throw new Error('No IPFS hash returned from upload');
      }

      // Update with IPFS data
      setDocuments(prev => prev.map((doc, index) => 
        index === docIndex ? {
          ...doc,
          status: 'uploaded',
          ipfsHash: result.IpfsHash,
          ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
          progress: 100,
          error: undefined
        } : doc
      ));

    } catch (error) {
      console.error('IPFS upload failed:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      
      setDocuments(prev => prev.map((doc, index) => 
        index === docIndex ? {
          ...doc,
          status: 'error',
          progress: 0,
          error: errorMsg
        } : doc
      ));

      throw error;
    }
  }, [documents, ipfsConnected, formData.exporterName, formData.commodity, address]);

  // Handle document upload with validation
  const handleDocumentUpload = useCallback(async (docId: string, file: File | null) => {
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File too large: ${file.name} (max 10MB)`);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert(`Invalid file type: ${file.type} (PDF, JPG, PNG only)`);
      return;
    }

    const docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex === -1) return;

    // Update local state
    setDocuments(prev => prev.map((doc, index) => 
      index === docIndex ? { ...doc, file, status: 'pending' } : doc
    ));

    // Upload to IPFS if connected
    if (ipfsConnected) {
      try {
        await uploadDocumentToIPFS(docId, file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    } else {
      setDocuments(prev => prev.map((doc, index) => 
        index === docIndex ? { ...doc, status: 'uploaded' } : doc
      ));
    }

    // Clear document error
    if (errors.documents && file) {
      setErrors(prev => ({ ...prev, documents: '' }));
    }
  }, [documents, ipfsConnected, errors.documents, uploadDocumentToIPFS]);

  // Retry upload
  const retryUpload = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc?.file) return;
    
    try {
      await uploadDocumentToIPFS(docId, doc.file);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }, [documents, uploadDocumentToIPFS]);

  // Create and upload metadata to IPFS
  const createAndUploadMetadata = async (): Promise<string> => {
    const documentHashes = documents
      .filter(doc => doc.ipfsHash)
      .map(doc => ({
        type: doc.id,
        name: TRADE_DOCUMENTS.find(d => d.id === doc.id)?.name || doc.id,
        hash: doc.ipfsHash,
        url: doc.ipfsUrl,
        required: TRADE_DOCUMENTS.find(d => d.id === doc.id)?.required || false
      }));

    const metadata = {
      name: `${formData.commodity} Trade Invoice - ${formData.exporterName}`,
      description: formData.description,
      attributes: [
        { trait_type: "Commodity", value: formData.commodity },
        { trait_type: "Amount", value: `${formData.amount} USD` },
        { trait_type: "Origin Country", value: formData.originCountry },
        { trait_type: "Destination", value: formData.destination },
        { trait_type: "Exporter", value: formData.exporterName },
        { trait_type: "Buyer", value: formData.buyerName },
        { trait_type: "Document Count", value: documentHashes.length.toString() }
      ],
      properties: {
        invoiceData: {
          commodity: formData.commodity,
          amount: formData.amount,
          originCountry: formData.originCountry,
          destination: formData.destination,
          exporterName: formData.exporterName,
          buyerName: formData.buyerName,
          description: formData.description,
          submittedAt: new Date().toISOString(),
          submittedBy: address,
          network: chain?.name || 'Unknown',
          ipfsEnabled: ipfsConnected
        },
        documents: documentHashes,
        verification: {
          totalDocuments: documents.length,
          requiredDocuments: requiredDocs.length,
          uploadedRequired: uploadedRequiredDocs.length,
          ipfsDocuments: documentHashes.length,
          hasAllRequired: uploadedRequiredDocs.length >= requiredDocs.length
        }
      }
    };

    try {
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json'
      });
      const metadataFile = new File([metadataBlob], 'metadata.json', {
        type: 'application/json'
      });
      
      const result = await pinataService.uploadFile(metadataFile, {
        name: `${formData.commodity}_${formData.exporterName}_invoice_metadata`,
        keyvalues: {
          type: 'invoice_metadata',
          commodity: formData.commodity,
          exporter: formData.exporterName,
          amount: formData.amount,
          submittedBy: address || '',
          timestamp: new Date().toISOString()
        }
      });
      
      const uri = `ipfs://${result.IpfsHash}`;
      setMetadataURI(uri);
      return uri;
    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setSubmitResult({
        success: false,
        error: 'Please connect your wallet first'
      });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadingToIPFS(true);
    setSubmitResult(null);
    setApprovalStep('none');
    setApprovalTxHash('');
    setSubmissionTxHash('');

    try {
      let finalMetadataURI = '';

      // Upload metadata to IPFS if connected
      if (ipfsConnected) {
        try {
          finalMetadataURI = await createAndUploadMetadata();
        } catch (ipfsError) {
          console.error('IPFS metadata upload failed:', ipfsError);
        }
      }

      setUploadingToIPFS(false);

      // Step 1: Approve USDC spending
      setApprovalStep('approving');
      
      const approvalResult = await approveUSDC(contracts.PROTOCOL, formData.amount);
      
      if (!approvalResult?.success) {
        const errorMsg = approvalResult?.error || 'USDC approval failed';
        setSubmitResult({ success: false, error: errorMsg });
        setApprovalStep('none');
        setIsSubmitting(false);
        return;
      }

      setApprovalTxHash(approvalResult.hash || '');
      setApprovalStep('approved');

      // Step 2: Wait for approval confirmation
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Submit the invoice
      setApprovalStep('submitting');

      const submissionData = {
        ...formData,
        metadataURI: finalMetadataURI,
        buyer: address // Use connected address as buyer
      };

      const result = await submitInvoice(submissionData);
      
      if (result?.success) {
        setSubmissionTxHash(result.hash || '');
        
        setSubmitResult({
          success: true,
          hash: result.hash,
        });
        
        // Reset form
        setFormData({
          commodity: '',
          amount: '',
          exporterName: '',
          buyerName: '',
          destination: '',
          description: '',
          originCountry: '',
        });
        setDocuments(TRADE_DOCUMENTS.map(doc => ({ id: doc.id, file: null, status: 'pending' as const })));
        setShowDocuments(false);
        setMetadataURI('');
        setApprovalStep('none');
      } else {
        const errorMsg = result?.error || 'Transaction failed';
        
        if (errorMsg.includes('Insufficient allowance')) {
          setShowApprovalDetails(true);
        }
        
        setSubmitResult({
          success: false,
          error: errorMsg
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMsg.includes('Insufficient allowance')) {
        errorMsg = 'USDC approval failed or insufficient allowance. Please try again.';
        setShowApprovalDetails(true);
      } else if (errorMsg.includes('insufficient funds')) {
        errorMsg = 'Insufficient USDC balance or ETH for gas fees.';
      } else if (errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction was cancelled by user.';
      }
      
      setSubmitResult({
        success: false,
        error: errorMsg
      });
    } finally {
      setIsSubmitting(false);
      setUploadingToIPFS(false);
      setApprovalStep('none');
    }
  };

  // Document Upload Component
  const DocumentUpload = ({ 
    documentType, 
    title, 
    required = false 
  }: { 
    documentType: string; 
    title: string; 
    required?: boolean;
  }) => {
    const doc = documents.find(d => d.id === documentType);
    
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              {title} {required && <span className="text-red-500">*</span>}
            </span>
            
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleDocumentUpload(documentType, e.target.files?.[0] || null)}
              className="hidden"
            />
            
            {!doc?.file ? (
              <div className="mt-2 cursor-pointer text-blue-600 hover:text-blue-700">
                <Upload className="w-4 h-4 inline mr-1" />
                Click to upload or drag file here
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="text-sm text-gray-600">
                  📄 {doc.file.name} ({(doc.file.size / 1024).toFixed(1)} KB)
                </div>
                
                {doc.status === 'uploading' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading... {doc.progress?.toFixed(0) || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${doc.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {doc.status === 'uploaded' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Upload complete!</span>
                    </div>
                    {doc.ipfsHash && (
                      <>
                        <div className="text-xs text-gray-500">
                          IPFS: {doc.ipfsHash.substring(0, 12)}...
                        </div>
                        <a 
                          href={doc.ipfsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-xs flex items-center justify-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View on IPFS
                        </a>
                      </>
                    )}
                  </div>
                )}
                
                {doc.status === 'error' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span>Upload failed</span>
                    </div>
                    {doc.error && (
                      <div className="text-xs text-red-500">
                        {doc.error}
                      </div>
                    )}
                    <button
                      onClick={() => retryUpload(documentType)}
                      className="text-blue-600 hover:text-blue-700 text-xs flex items-center justify-center"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry Upload
                    </button>
                  </div>
                )}
              </div>
            )}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
          <FileText className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Submit Trade Finance Invoice
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Submit your trade invoice for blockchain verification and tokenization. 
          Access decentralized finance through YieldX smart contracts.
        </p>
        
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          {isConnected && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>{(usdcBalance || 0).toFixed(2)} USDC Available</span>
            </div>
          )}
        </div>
        
        {!isConnected && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 font-medium">
              ⚠️ Please connect your wallet to submit an invoice
            </p>
          </div>
        )}
      </div>

      {/* Approval Flow Status */}
      {approvalStep !== 'none' && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-medium text-blue-900 mb-3">📋 Submission Process</h4>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm ${
              approvalStep === 'approving' ? 'text-blue-700' : 
              (approvalStep === 'approved' || approvalStep === 'submitting') ? 'text-green-700' : 'text-gray-500'
            }`}>
              {approvalStep === 'approving' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (approvalStep === 'approved' || approvalStep === 'submitting') ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span>Step 1: Approve USDC spending</span>
            </div>
            
            <div className={`flex items-center gap-2 text-sm ${
              approvalStep === 'submitting' ? 'text-blue-700' : 'text-gray-500'
            }`}>
              {approvalStep === 'submitting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span>Step 2: Submit invoice to blockchain</span>
            </div>
          </div>
          
          {(approvalTxHash || submissionTxHash) && (
            <div className="mt-3 flex gap-2">
              {approvalTxHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${approvalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                >
                  View Approval TX
                </a>
              )}
              {submissionTxHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${submissionTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  View Submission TX
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success/Error Messages */}
      {submitResult && (
        <div className={`mb-8 p-6 rounded-xl border ${
          submitResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {submitResult.success ? (
              <CheckCircle className="w-6 h-6 mr-3" />
            ) : (
              <XCircle className="w-6 h-6 mr-3" />
            )}
            <div className="flex-1">
              {submitResult.success ? (
                <div>
                  <p className="font-semibold text-lg">🎉 Invoice Successfully Submitted!</p>
                  <p className="text-sm mt-2">
                    Your invoice has been submitted to the blockchain for verification.
                    {ipfsConnected && ' Documents stored on IPFS.'}
                  </p>
                  {submitResult.hash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${submitResult.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center text-green-700 hover:text-green-900 font-medium"
                    >
                      View Transaction <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold">Submission Failed</p>
                  <p className="text-sm mt-1">{submitResult.error}</p>
                  {submitResult.error?.includes('allowance') && (
                    <button
                      onClick={() => setShowApprovalDetails(true)}
                      className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                    >
                      Learn about USDC approval
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Details */}
      {showApprovalDetails && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">USDC Approval Required</h4>
              <p className="text-sm text-yellow-800 mb-3">
                To submit an invoice, you need to approve the YieldX protocol to spend your USDC tokens.
              </p>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>• Step 1: Approve USDC spending (transaction fee required)</p>
                <p>• Step 2: Submit the invoice (additional transaction fee)</p>
                <p>• Your USDC remains in your wallet until needed</p>
                <p>• Current balance: {(usdcBalance || 0).toFixed(2)} USDC</p>
              </div>
              <button
                onClick={() => setShowApprovalDetails(false)}
                className="mt-3 text-xs text-yellow-600 underline hover:text-yellow-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IPFS Upload Progress */}
      {uploadingToIPFS && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CloudUpload className="w-5 h-5 animate-bounce text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-900">Uploading to IPFS...</p>
                <p className="text-sm text-blue-700">Storing metadata and documents</p>
              </div>
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6" />
            Invoice Submission Form
          </h2>
          <p className="text-blue-100 mt-2">
            Enter trade invoice details for blockchain submission.
            {ipfsConnected && ' Documents will be stored on IPFS.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Commodity/Product
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.commodity}
                onChange={(e) => handleInputChange('commodity', e.target.value)}
                placeholder="e.g., Coffee Beans, Gold Ore"
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.commodity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.commodity && <p className="text-red-500 text-sm mt-1">{errors.commodity}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Origin Country
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.originCountry}
                onChange={(e) => handleInputChange('originCountry', e.target.value)}
                placeholder="e.g., Ethiopia, Ghana"
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.originCountry ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.originCountry && <p className="text-red-500 text-sm mt-1">{errors.originCountry}</p>}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Invoice Amount (USD)
                <span className="text-red-500">*</span>
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="Enter amount in USD"
                min="1"
                step="0.01"
                className={`w-full border rounded-xl px-4 py-4 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">USD</span>
              </div>
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            <div className="mt-2 text-sm text-gray-600">
              Available USDC: {(usdcBalance || 0).toFixed(2)} • 
              {parseFloat(formData.amount || '0') > (usdcBalance || 0) && (
                <span className="text-red-600 font-medium"> Insufficient balance!</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Exporter Company
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.exporterName}
                onChange={(e) => handleInputChange('exporterName', e.target.value)}
                placeholder="Company name"
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.exporterName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.exporterName && <p className="text-red-500 text-sm mt-1">{errors.exporterName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Buyer Company
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.buyerName}
                onChange={(e) => handleInputChange('buyerName', e.target.value)}
                placeholder="Buyer company name"
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.buyerName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.buyerName && <p className="text-red-500 text-sm mt-1">{errors.buyerName}</p>}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <span className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Destination
                <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              placeholder="Destination port or country"
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.destination ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Trade Description
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the goods, quality, packaging..."
              rows={4}
              className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-600">
                Minimum 10 characters • Current: {formData.description.length}
              </p>
            </div>
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Trade Finance Documents
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowDocuments(!showDocuments)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Upload Documents {showDocuments ? '↑' : '↓'}
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Documentation Progress</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {uploadedRequiredDocs.length}/{requiredDocs.length} required documents
                  </span>
                  {ipfsConnected && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      IPFS Ready
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${documentProgress}%` }}
                ></div>
              </div>
            </div>

            {showDocuments && (
              <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
                {TRADE_DOCUMENTS.map((docTemplate) => (
                  <DocumentUpload
                    key={docTemplate.id}
                    documentType={docTemplate.id}
                    title={docTemplate.name}
                    required={docTemplate.required}
                  />
                ))}
              </div>
            )}
            
            {errors.documents && <p className="text-red-500 text-sm mt-1">{errors.documents}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">🔒 Submission Process</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Approve USDC spending (one-time transaction)</p>
                  <p>• Submit invoice to YieldX protocol</p>
                  <p>• {ipfsConnected ? 'Documents stored on IPFS' : 'Documents stored locally'}</p>
                  <p>• Smart contract verification</p>
                  <p>• Committee review and processing</p>
                  {ipfsConnected && <p className="text-green-700">• ✅ IPFS ensures permanent storage</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields
              {documentProgress < 100 && (
                <div className="mt-1">
                  📄 {requiredDocs.length - uploadedRequiredDocs.length} required documents missing
                </div>
              )}
              {ipfsConnected && (
                <div className="mt-1 text-green-600">
                  ☁️ IPFS storage enabled
                </div>
              )}
              <div className="mt-1 text-blue-600">
                💰 Balance: {(usdcBalance || 0).toFixed(2)} USDC
              </div>
            </div>
            <button
              type="submit"
              disabled={
                isSubmitting || 
                loading || 
                !isConnected || 
                documentProgress < 100 || 
                uploadingToIPFS ||
                parseFloat(formData.amount || '0') > (usdcBalance || 0) ||
                approvalStep !== 'none'
              }
              className={`px-8 py-4 rounded-xl font-semibold text-white transition-all ${
                isSubmitting || loading || !isConnected || documentProgress < 100 || uploadingToIPFS || parseFloat(formData.amount || '0') > (usdcBalance || 0) || approvalStep !== 'none'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
              }`}
            >
              {uploadingToIPFS ? (
                <span className="flex items-center gap-3">
                  <CloudUpload className="w-5 h-5 animate-bounce" />
                  Uploading to IPFS...
                </span>
              ) : approvalStep === 'approving' ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Approving USDC...
                </span>
              ) : approvalStep === 'submitting' ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting to Blockchain...
                </span>
              ) : isSubmitting || loading ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : !isConnected ? (
                <span className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  Connect Wallet First
                </span>
              ) : parseFloat(formData.amount || '0') > (usdcBalance || 0) ? (
                <span className="flex items-center gap-3">
                  <XCircle className="w-5 h-5" />
                  Insufficient USDC Balance
                </span>
              ) : documentProgress < 100 ? (
                <span className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  Complete Documents ({Math.round(documentProgress)}%)
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  Submit Invoice
                  {ipfsConnected && ' + IPFS'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Secure Process</h3>
          <p className="text-sm text-gray-600">
            Two-step approval process ensures your funds remain secure.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <Cloud className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">IPFS Storage</h3>
          <p className="text-sm text-gray-600">
            {ipfsConnected 
              ? 'Documents stored permanently on IPFS.'
              : 'IPFS integration ready for storage.'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Transparent</h3>
          <p className="text-sm text-gray-600">
            Track every step from submission to blockchain confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SubmitInvoice;
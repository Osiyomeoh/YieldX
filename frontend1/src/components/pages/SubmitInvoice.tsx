// components/dashboard/SubmitInvoice.tsx - Updated for Fixed useYieldX Hook
import React, { useState, useCallback, useEffect } from 'react';
import { 
  FileText, Upload, MapPin, DollarSign, Building, Ship, Hash, 
  AlertCircle, CheckCircle, ExternalLink, Loader2, Zap, Shield, 
  RefreshCw, Cloud, CloudUpload, XCircle, Eye, Clock, TrendingUp,
  Star, Award, Globe, Database, Lock, Sparkles, ArrowRight, Play
} from 'lucide-react';
import { useYieldX } from '../../hooks/useYieldX';
import { pinataService } from '../../services/pinataService';

// Required trade documents for compliance
const TRADE_DOCUMENTS = [
  { id: 'commercial_invoice', name: 'Commercial Invoice', required: true, icon: FileText, description: 'Primary trade document' },
  { id: 'export_declaration', name: 'Export Declaration', required: true, icon: Shield, description: 'Customs export form' },
  { id: 'certificate_origin', name: 'Certificate of Origin', required: true, icon: Globe, description: 'Country of origin proof' },
  { id: 'bill_of_lading', name: 'Bill of Lading / Air Waybill', required: true, icon: Ship, description: 'Transport document' },
  { id: 'packing_list', name: 'Packing List', required: false, icon: FileText, description: 'Cargo details' },
  { id: 'phytosanitary', name: 'Phytosanitary Certificate', required: false, icon: Shield, description: 'Plant health certificate' },
];

// Popular commodities with risk factors
const COMMODITY_OPTIONS = [
  { value: 'Coffee', label: '☕ Coffee', riskFactor: 0.15 },
  { value: 'Tea', label: '🍃 Tea', riskFactor: 0.12 },
  { value: 'Cocoa', label: '🍫 Cocoa', riskFactor: 0.18 },
  { value: 'Gold', label: '🥇 Gold', riskFactor: -0.05 },
  { value: 'Silver', label: '🥈 Silver', riskFactor: 0.02 },
  { value: 'Copper', label: '🔶 Copper', riskFactor: 0.08 },
  { value: 'Cotton', label: '🌱 Cotton', riskFactor: 0.20 },
  { value: 'Spices', label: '🌶️ Spices', riskFactor: 0.25 },
];

// Country options with risk assessments
const COUNTRY_OPTIONS = {
  suppliers: [
    { value: 'Kenya', label: '🇰🇪 Kenya', risk: 'low' },
    { value: 'Ethiopia', label: '🇪🇹 Ethiopia', risk: 'medium' },
    { value: 'Ghana', label: '🇬🇭 Ghana', risk: 'low' },
    { value: 'Brazil', label: '🇧🇷 Brazil', risk: 'low' },
    { value: 'Colombia', label: '🇨🇴 Colombia', risk: 'medium' },
    { value: 'India', label: '🇮🇳 India', risk: 'medium' },
    { value: 'Vietnam', label: '🇻🇳 Vietnam', risk: 'medium' },
    { value: 'Indonesia', label: '🇮🇩 Indonesia', risk: 'medium' }
  ],
  buyers: [
    { value: 'USA', label: '🇺🇸 United States', risk: 'low' },
    { value: 'UK', label: '🇬🇧 United Kingdom', risk: 'low' },
    { value: 'Germany', label: '🇩🇪 Germany', risk: 'low' },
    { value: 'France', label: '🇫🇷 France', risk: 'low' },
    { value: 'Japan', label: '🇯🇵 Japan', risk: 'low' },
    { value: 'Canada', label: '🇨🇦 Canada', risk: 'low' },
    { value: 'Australia', label: '🇦🇺 Australia', risk: 'low' },
    { value: 'Netherlands', label: '🇳🇱 Netherlands', risk: 'low' }
  ]
};

interface SubmitInvoiceForm {
  invoiceId: string;
  commodity: string;
  amount: string;
  exporterName: string;
  buyerName: string;
  destination: string;
  description: string;
  originCountry: string;
  documentHash: string;
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

interface VerificationResult {
  verified: boolean;
  valid: boolean;
  details: string;
  risk: number;
  rating: string;
  timestamp: number;
}

// Workflow states
type WorkflowState = 'form' | 'verifying' | 'verified' | 'ready_for_investment' | 'submitting' | 'completed';

export function SubmitInvoice() {
  // ✅ Updated to use the new useYieldX hook structure
  const { 
    // Connection state
    isConnected,
    address,
    isLoading,
    error,
    
    // Protocol data
    protocolStats,
    invoiceCounter,
    liveMarketData,
    usdcBalance,
    contractAddresses,
    
    // Core functions
    submitInvoice,
    approveUSDC,
    mintTestUSDC,
    getUSDCAllowance,
    
    // Verification functions - ✅ FIXED: Use the corrected functions
    getVerificationData,    // ✅ Invoice-specific verification data
    startDocumentVerification,  // ✅ Real form data verification
    testVerificationRequest,    // For testing
  } = useYieldX();

  // Workflow state
  const [workflowState, setWorkflowState] = useState<WorkflowState>('form');

  const [formData, setFormData] = useState<SubmitInvoiceForm>({
    invoiceId: '',
    commodity: 'Coffee',
    amount: '',
    exporterName: '',
    buyerName: '',
    destination: '',
    description: '',
    originCountry: 'Kenya',
    documentHash: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<DocumentUpload[]>(
    TRADE_DOCUMENTS.map(doc => ({ id: doc.id, file: null, status: 'pending' as const }))
  );
  const [showDocuments, setShowDocuments] = useState(false);
  
  // IPFS Integration State
  const [ipfsConnected, setIpfsConnected] = useState<boolean>(false);
  const [uploadingToIPFS, setUploadingToIPFS] = useState<boolean>(false);
  const [metadataURI, setMetadataURI] = useState<string>('');

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);

  // Investment Submission State
  const [isSubmittingForInvestment, setIsSubmittingForInvestment] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; hash?: string; error?: string; invoiceId?: string } | null>(null);

  // Auto-generate invoice ID on mount
  useEffect(() => {
    if (!formData.invoiceId) {
      const invoiceId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setFormData(prev => ({ ...prev, invoiceId }));
    }
  }, [formData.invoiceId]);

  // Generate document hash when files change
  useEffect(() => {
    const generateDocumentHash = () => {
      const uploadedFiles = documents.filter(doc => doc.file);
      if (uploadedFiles.length > 0) {
        const hashData = uploadedFiles.map(doc => doc.file?.name).join('|') + formData.invoiceId;
        const hash = `0x${Array.from(hashData).map(char => 
          char.charCodeAt(0).toString(16).padStart(2, '0')
        ).join('').substring(0, 64).padEnd(64, '0')}`;
        setFormData(prev => ({ ...prev, documentHash: hash }));
      }
    };
    generateDocumentHash();
  }, [documents, formData.invoiceId]);

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

  // Calculate document completion
  const requiredDocs = TRADE_DOCUMENTS.filter(doc => doc.required);
  const uploadedRequiredDocs = documents.filter(doc => {
    const docInfo = TRADE_DOCUMENTS.find(d => d.id === doc.id);
    return docInfo?.required && (doc.status === 'uploaded' || doc.file);
  });
  const documentProgress = requiredDocs.length > 0 ? (uploadedRequiredDocs.length / requiredDocs.length) * 100 : 0;

  // Calculate estimated risk
  const calculateEstimatedRisk = useCallback(() => {
    let baseRisk = 50;
    const commodity = COMMODITY_OPTIONS.find(c => c.value === formData.commodity);
    if (commodity) {
      baseRisk += commodity.riskFactor * 100;
    }
    
    const amount = parseFloat(formData.amount || '0');
    if (amount > 100000) baseRisk += 10;
    if (amount > 500000) baseRisk += 15;
    
    const supplierCountry = COUNTRY_OPTIONS.suppliers.find(c => c.value === formData.originCountry);
    if (supplierCountry?.risk === 'medium') baseRisk += 10;
    if (supplierCountry?.risk === 'high') baseRisk += 20;
    
    return Math.max(10, Math.min(90, Math.round(baseRisk)));
  }, [formData.commodity, formData.amount, formData.originCountry]);

  // Generate test data
  const generateTestData = useCallback(() => {
    const testInvoiceId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const commodities = ['Coffee', 'Tea', 'Cocoa', 'Gold', 'Silver'];
    const amounts = ['25000', '50000', '75000', '100000', '150000'];
    const countries = ['Kenya', 'Ethiopia', 'Ghana', 'Brazil', 'Colombia'];
    
    setFormData({
      invoiceId: testInvoiceId,
      commodity: commodities[Math.floor(Math.random() * commodities.length)],
      amount: amounts[Math.floor(Math.random() * amounts.length)],
      exporterName: `${countries[Math.floor(Math.random() * countries.length)]} Export Co. Ltd`,
      buyerName: 'Global Trade Imports Inc.',
      destination: 'Port of Hamburg, Germany',
      description: 'Premium grade agricultural commodity for international trade. Fully compliant with international quality standards and trade regulations.',
      originCountry: countries[Math.floor(Math.random() * countries.length)],
      documentHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    });
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceId.trim()) newErrors.invoiceId = 'Invoice ID is required';
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

  // Document upload handling
  const handleDocumentUpload = useCallback(async (docId: string, file: File | null) => {
    if (!file) return;

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

    setDocuments(prev => prev.map((doc, index) => 
      index === docIndex ? { ...doc, file, status: 'uploaded' } : doc
    ));

    // Clear document error
    if (errors.documents) {
      setErrors(prev => ({ ...prev, documents: '' }));
    }
  }, [documents, errors.documents]);

  // ✅ FIXED: Updated document verification function
  const handleDocumentVerification = async () => {
    if (!isConnected) {
      setErrors({ verification: 'Please connect your wallet first' });
      return;
    }
  
    if (!validateForm()) {
      return;
    }
  
    console.log('🚀 Starting document verification with form data:', formData);
  
    setWorkflowState('verifying');
    setIsVerifying(true);
    setVerificationProgress(0);
    setVerificationResult(null);
    setErrors({});
  
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setVerificationProgress(prev => {
          if (prev >= 80) return prev;
          return prev + Math.random() * 10;
        });
      }, 1000);
  
      console.log('📡 Calling startDocumentVerification with real form data');
      
      // ✅ FIXED: Use the new startDocumentVerification function with proper parameters
      const verificationData = {
        invoiceId: formData.invoiceId,
        documentHash: formData.documentHash,
        commodity: formData.commodity,
        amount: formData.amount,
        supplierCountry: formData.originCountry,
        buyerCountry: 'USA', // Default buyer country
        exporterName: formData.exporterName,
        buyerName: formData.buyerName,
      };

      const result = await startDocumentVerification(verificationData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start verification');
      }
  
      console.log('✅ Verification request sent, polling for results...');
  
      // ✅ FIXED: Poll for verification results using invoice-specific data
      let attempts = 0;
      const maxAttempts = 30;
  
      const pollForResults = async () => {
        try {
          attempts++;
          console.log(`📡 Polling attempt ${attempts}/${maxAttempts} for invoice #${formData.invoiceId}`);
  
          // Wait before checking
          await new Promise(resolve => setTimeout(resolve, 2000));
  
          // ✅ FIXED: Use getVerificationData instead of getLastFunctionsResponse
          const verificationData = await getVerificationData(formData.invoiceId);
          console.log(`📥 Verification data for invoice ${formData.invoiceId}:`, verificationData);
  
          if (verificationData && verificationData.verified) {
            clearInterval(progressInterval);
            setVerificationProgress(100);
  
            console.log('✅ Verification complete for invoice #' + formData.invoiceId + ':', verificationData);
  
            const finalVerificationResult = {
              verified: true,
              valid: verificationData.valid,
              details: verificationData.details || `YieldX API verification completed. Document ${verificationData.valid ? 'valid' : 'invalid'}.`,
              risk: verificationData.risk,
              rating: verificationData.rating,
              timestamp: verificationData.timestamp
            };
  
            console.log('📊 Final verification result:', finalVerificationResult);
  
            setVerificationResult(finalVerificationResult);
            setWorkflowState('verified');
            setIsVerifying(false);
            
            // Auto transition to ready for investment if valid
            if (verificationData.valid) {
              setTimeout(() => {
                setWorkflowState('ready_for_investment');
              }, 2000);
            }
            
            return;
          }
  
          // If verification not complete yet, continue polling
          if (attempts < maxAttempts) {
            setTimeout(pollForResults, 4000);
          } else {
            clearInterval(progressInterval);
            setErrors({ verification: 'Verification timeout. Please try again.' });
            setWorkflowState('form');
            setIsVerifying(false);
          }
        } catch (pollError) {
          console.error('❌ Polling error:', pollError);
          if (attempts < maxAttempts) {
            setTimeout(pollForResults, 4000);
          } else {
            clearInterval(progressInterval);
            setErrors({ verification: 'Failed to get verification results' });
            setWorkflowState('form');
            setIsVerifying(false);
          }
        }
      };
  
      // Start polling after a short delay
      setTimeout(pollForResults, 2000);
  
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      setErrors({ verification: err.message || 'Verification failed' });
      setWorkflowState('form');
      setIsVerifying(false);
    }
  };

  // ✅ FIXED: Updated investment submission function
  const submitForInvestment = async () => {
    if (!verificationResult || !verificationResult.valid) {
      setErrors({ submission: 'Document must be verified and valid before submission' });
      return;
    }
  
    console.log('💰 Submitting for investment with verified document:', {
      formData,
      verificationResult
    });
  
    setWorkflowState('submitting');
    setIsSubmittingForInvestment(true);
    setSubmissionResult(null);
  
    try {
      // Upload metadata to IPFS if connected
      let finalMetadataURI = '';
      if (ipfsConnected) {
        setUploadingToIPFS(true);
        try {
          finalMetadataURI = await createAndUploadMetadata();
        } catch (ipfsError) {
          console.error('IPFS metadata upload failed:', ipfsError);
        }
        setUploadingToIPFS(false);
      }
  
      // Step 1: Approve USDC spending for YieldXCore contract
      console.log('💰 Approving USDC for YieldXCore contract...');
      const approvalResult = await approveUSDC(contractAddresses.PROTOCOL, formData.amount);
      
      if (!approvalResult?.success) {
        const errorMsg = approvalResult?.error || 'USDC approval failed';
        setSubmissionResult({ success: false, error: errorMsg });
        setWorkflowState('ready_for_investment');
        setIsSubmittingForInvestment(false);
        return;
      }
  
      console.log('✅ USDC approval successful:', approvalResult.txHash);
  
      // Wait for approval confirmation
      await new Promise(resolve => setTimeout(resolve, 5000));
  
      // Step 2: Submit to YieldXCore protocol with EXACT parameters
      console.log('📊 Submitting to YieldXCore protocol...');
      
      // Calculate due date (90 days from now)
      const dueDate = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);
      
      // ✅ FIXED: Prepare submission data matching YieldXCore.submitInvoice parameters
      const submissionData = {
        buyer: address || '0x742d35Cc6775C45CB05D4D6c4e6f2b1FE4FBE5A6', // Current user or default
        amount: formData.amount,
        commodity: formData.commodity,
        supplierCountry: formData.originCountry,
        buyerCountry: 'USA', // Default buyer country
        exporterName: formData.exporterName,
        buyerName: formData.buyerName,
        dueDate: dueDate,
        documentHash: formData.documentHash
      };
  
      console.log('📋 Exact submission data for YieldXCore:', submissionData);
  
      // Call submitInvoice from useYieldX hook
      const result = await submitInvoice(submissionData);
      
      if (result?.success) {
        console.log('✅ Invoice submitted successfully:', result.txHash);
        setSubmissionResult({
          success: true,
          hash: result.txHash,
          invoiceId: formData.invoiceId
        });
        setWorkflowState('completed');
        
        // Reset for next submission after delay
        setTimeout(() => {
          resetForm();
        }, 10000);
      } else {
        const errorMsg = result?.error || 'Transaction failed';
        console.error('❌ Invoice submission failed:', errorMsg);
        setSubmissionResult({
          success: false,
          error: errorMsg
        });
        setWorkflowState('ready_for_investment');
      }
    } catch (error) {
      console.error('💥 Investment submission error:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle specific error cases
      if (errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction was rejected by user';
      } else if (errorMsg.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (errorMsg.includes('gas')) {
        errorMsg = 'Transaction failed due to gas issues';
      } else if (errorMsg.includes('revert')) {
        errorMsg = 'Contract execution failed - check parameters';
      }
      
      setSubmissionResult({
        success: false,
        error: errorMsg
      });
      setWorkflowState('ready_for_investment');
    } finally {
      setIsSubmittingForInvestment(false);
      setUploadingToIPFS(false);
    }
  };

  // Create and upload metadata to IPFS
  const createAndUploadMetadata = async (): Promise<string> => {
    const documentHashes = documents
      .filter(doc => doc.ipfsHash || doc.file)
      .map(doc => ({
        type: doc.id,
        name: TRADE_DOCUMENTS.find(d => d.id === doc.id)?.name || doc.id,
        hash: doc.ipfsHash || 'local_file',
        url: doc.ipfsUrl || '',
        required: TRADE_DOCUMENTS.find(d => d.id === doc.id)?.required || false
      }));

    const metadata = {
      name: `${formData.commodity} Trade Invoice ${formData.invoiceId}`,
      description: formData.description,
      attributes: [
        { trait_type: "Invoice ID", value: formData.invoiceId },
        { trait_type: "Commodity", value: formData.commodity },
        { trait_type: "Amount", value: `${formData.amount} USD` },
        { trait_type: "Origin Country", value: formData.originCountry },
        { trait_type: "Destination", value: formData.destination },
        { trait_type: "Exporter", value: formData.exporterName },
        { trait_type: "Buyer", value: formData.buyerName },
        { trait_type: "Verification Status", value: verificationResult ? "Verified" : "Pending" },
        { trait_type: "Risk Score", value: verificationResult ? verificationResult.risk.toString() : "TBD" },
        { trait_type: "Credit Rating", value: verificationResult ? verificationResult.rating : "TBD" },
        { trait_type: "Document Count", value: documentHashes.length.toString() }
      ],
      properties: {
        invoiceData: formData,
        verification: verificationResult,
        documents: documentHashes,
        submittedAt: new Date().toISOString(),
        submittedBy: address,
        network: 'Sepolia'
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
        name: `Invoice_${formData.invoiceId}_${formData.commodity}_metadata`,
        keyvalues: {
          type: 'invoice_metadata',
          invoiceId: formData.invoiceId,
          commodity: formData.commodity,
          verified: verificationResult ? 'true' : 'false',
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

  // Reset form for new submission
  const resetForm = () => {
    const newInvoiceId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData({
      invoiceId: newInvoiceId,
      commodity: 'Coffee',
      amount: '',
      exporterName: '',
      buyerName: '',
      destination: '',
      description: '',
      originCountry: 'Kenya',
      documentHash: '',
    });
    setDocuments(TRADE_DOCUMENTS.map(doc => ({ id: doc.id, file: null, status: 'pending' as const })));
    setShowDocuments(false);
    setVerificationResult(null);
    setSubmissionResult(null);
    setVerificationProgress(0);
    setMetadataURI('');
    setErrors({});
    setWorkflowState('form');
  };

  // Risk color coding
  const getRiskColor = (risk: number): string => {
    if (risk <= 30) return 'text-green-600';
    if (risk <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeColor = (risk: number): string => {
    if (risk <= 30) return 'bg-green-100 text-green-800';
    if (risk <= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Document Upload Component
  const DocumentUpload = ({ 
    documentType, 
    title, 
    description,
    required = false 
  }: { 
    documentType: string; 
    title: string; 
    description: string;
    required?: boolean;
  }) => {
    const doc = documents.find(d => d.id === documentType);
    return (
      <div className="mt-2 space-y-2">
        {doc?.file && (
          <div className="text-sm text-gray-600">
            📄 {doc.file.name} ({(doc.file.size / 1024).toFixed(1)} KB)
          </div>
        )}
        <div className="flex items-center justify-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Ready</span>
        </div>
      </div>
    );
  };

  return (
<div className="max-w-6xl mx-auto">
{/* Header */}
<div className="text-center mb-12">
<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
<FileText className="w-10 h-10 text-white" />
</div>
<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
Trade Finance Invoice Submission
</h1>
<p className="text-xl text-gray-600 max-w-4xl mx-auto">
Submit your trade invoice for Chainlink verification, then proceed to investment submission. 
Complete verification ensures investor confidence in your trade documents.
</p>
</div>

{/* Workflow Progress */}
<div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
<h3 className="text-lg font-bold text-gray-900 mb-4">Submission Progress</h3>
<div className="flex items-center justify-between mb-4">
{[
{ key: 'form', label: 'Form Data', icon: FileText },
{ key: 'verifying', label: 'Verification', icon: Shield },
{ key: 'verified', label: 'Verified', icon: CheckCircle },
{ key: 'ready_for_investment', label: 'Ready for Investment', icon: DollarSign },
{ key: 'completed', label: 'Completed', icon: Star }
].map((step, index) => {
const Icon = step.icon;
const isActive = workflowState === step.key;
const isCompleted = ['form', 'verifying', 'verified', 'ready_for_investment'].indexOf(step.key) < 
                   ['form', 'verifying', 'verified', 'ready_for_investment', 'completed'].indexOf(workflowState);

return (
  <div key={step.key} className="flex flex-col items-center">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
      isActive ? 'bg-blue-500 text-white' : 
      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
    }`}>
      <Icon className="w-6 h-6" />
    </div>
    <span className={`text-xs font-medium ${
      isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
    }`}>
      {step.label}
    </span>
  </div>
);
})}
</div>
<div className="w-full bg-gray-200 rounded-full h-2">
<div 
className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
style={{ 
  width: `${
    workflowState === 'form' ? 0 :
    workflowState === 'verifying' ? 25 :
    workflowState === 'verified' ? 50 :
    workflowState === 'ready_for_investment' ? 75 :
    workflowState === 'completed' ? 100 : 0
  }%` 
}}
/>
</div>
</div>

{/* Current State Display */}
{workflowState === 'form' && (
<div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
<div className="flex items-center gap-3">
<FileText className="w-5 h-5 text-blue-600" />
<div>
  <h4 className="font-medium text-blue-900">Step 1: Complete Form & Upload Documents</h4>
  <p className="text-sm text-blue-700">Fill out all invoice details and upload required trade documents before verification.</p>
</div>
</div>
</div>
)}

{workflowState === 'verifying' && (
<div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
<div className="flex items-center gap-4">
<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
</div>
<div className="flex-1">
  <h4 className="font-bold text-blue-900 mb-2">Chainlink Functions Verification in Progress</h4>
  <p className="text-sm text-blue-700 mb-3">
    Your document is being verified using Chainlink's decentralized oracle network...
  </p>
  <div className="w-full bg-blue-200 rounded-full h-3">
    <div 
      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
      style={{ width: `${verificationProgress}%` }}
    />
  </div>
  <div className="flex justify-between text-xs text-blue-600 mt-1">
    <span>Processing...</span>
    <span>{Math.round(verificationProgress)}%</span>
  </div>
</div>
</div>

<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
<div className="flex items-center gap-2 text-green-700">
  <CheckCircle className="w-4 h-4" />
  <span>Form data sent to Chainlink</span>
</div>
<div className="flex items-center gap-2 text-blue-700">
  <Loader2 className="w-4 h-4 animate-spin" />
  <span>API processing verification</span>
</div>
<div className="flex items-center gap-2 text-gray-500">
  <Clock className="w-4 h-4" />
  <span>Awaiting response...</span>
</div>
</div>
</div>
)}

{(workflowState === 'verified' || workflowState === 'ready_for_investment') && verificationResult && (
<div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
<div className="flex items-start gap-4">
<div className={`w-12 h-12 rounded-full flex items-center justify-center ${
  verificationResult.valid ? 'bg-green-100' : 'bg-red-100'
}`}>
  {verificationResult.valid ? (
    <CheckCircle className="w-6 h-6 text-green-600" />
  ) : (
    <XCircle className="w-6 h-6 text-red-600" />
  )}
</div>
<div className="flex-1">
  <h4 className="font-bold text-gray-900 mb-3">
    ✅ Chainlink Verification Complete
  </h4>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <div className="text-center p-3 bg-white rounded-lg border">
      <div className="text-lg font-bold mb-1">
        {verificationResult.valid ? (
          <span className="text-green-600">VALID</span>
        ) : (
          <span className="text-red-600">INVALID</span>
        )}
      </div>
      <div className="text-xs text-gray-600">Document Status</div>
    </div>

    <div className="text-center p-3 bg-white rounded-lg border">
      <div className={`text-lg font-bold mb-1 ${getRiskColor(verificationResult.risk)}`}>
        {verificationResult.risk}%
      </div>
      <div className="text-xs text-gray-600">Risk Score</div>
    </div>
    
    <div className="text-center p-3 bg-white rounded-lg border">
      <div className={`text-lg font-bold mb-1 ${
        verificationResult.rating === 'A' ? 'text-green-600' :
        verificationResult.rating === 'B' ? 'text-blue-600' : 'text-red-600'
      }`}>
        {verificationResult.rating}
      </div>
      <div className="text-xs text-gray-600">Credit Rating</div>
    </div>
  </div>

  <p className="text-sm text-gray-700 mb-2">{verificationResult.details}</p>
  <p className="text-xs text-gray-500">
    Verified: {new Date(verificationResult.timestamp * 1000).toLocaleString()}
  </p>

  {verificationResult.valid && workflowState === 'ready_for_investment' && (
    <div className="mt-4 p-4 bg-green-100 rounded-lg">
      <div className="flex items-center gap-2 text-green-800">
        <Star className="w-5 h-5" />
        <span className="font-medium">
          🎉 Document verified successfully! Ready for investment submission.
        </span>
      </div>
    </div>
  )}

  {!verificationResult.valid && (
    <div className="mt-4 p-4 bg-red-100 rounded-lg">
      <div className="flex items-center gap-2 text-red-800">
        <XCircle className="w-5 h-5" />
        <span className="font-medium">
          ❌ Document verification failed. Please review and resubmit with valid documents.
        </span>
      </div>
    </div>
  )}
</div>
</div>
</div>
)}

{workflowState === 'submitting' && (
<div className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-xl">
<div className="flex items-center gap-4">
<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
</div>
<div>
  <h4 className="font-bold text-purple-900">Submitting for Investment</h4>
  <p className="text-sm text-purple-700">
    Processing USDC approval and blockchain submission...
  </p>
</div>
</div>
</div>
)}

{workflowState === 'completed' && submissionResult?.success && (
<div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
<div className="flex items-start gap-4">
<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
  <Star className="w-6 h-6 text-green-600" />
</div>
<div className="flex-1">
  <h3 className="text-lg font-bold text-green-900 mb-2">
    🎉 Invoice Successfully Submitted for Investment!
  </h3>
  <p className="text-green-800 mb-4">
    Your verified invoice #{submissionResult.invoiceId} has been submitted to the YieldX protocol 
    and is now available for investor funding.
  </p>
  <div className="flex gap-3 flex-wrap">
    {submissionResult.hash && (
      <a 
        href={`https://sepolia.etherscan.io/tx/${submissionResult.hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium transition-colors"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        View Transaction
      </a>
    )}
    <button
      onClick={resetForm}
      className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors"
    >
      <FileText className="w-4 h-4 mr-2" />
      Submit Another Invoice
    </button>
  </div>
</div>
</div>
</div>
)}

{/* Error Display */}
{Object.keys(errors).length > 0 && (
<div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
<div className="flex items-center gap-2 text-red-800">
<XCircle className="w-5 h-5" />
<div>
  {Object.entries(errors).map(([key, error]) => (
    <p key={key} className="font-medium">{error}</p>
  ))}
</div>
</div>
</div>
)}

{/* Submission Result Error */}
{submissionResult && !submissionResult.success && (
<div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
<div className="flex items-center gap-2 text-red-800">
<XCircle className="w-5 h-5" />
<div>
  <p className="font-medium">Investment Submission Failed</p>
  <p className="text-sm mt-1">{submissionResult.error}</p>
</div>
</div>
</div>
)}

{/* Form Section - Only show when in form state */}
{(workflowState === 'form') && (
<div className="bg-white rounded-2xl shadow-xl border border-gray-200">
<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-2xl">
<h2 className="text-2xl font-bold text-white flex items-center gap-3">
  <FileText className="w-6 h-6" />
  Invoice Details Form
</h2>
<p className="text-blue-100 mt-2">
  Enter complete trade invoice information for Chainlink verification.
</p>
</div>

<div className="p-8">
{/* Quick Actions */}
<div className="mb-8 flex justify-between items-center">
  <h3 className="text-lg font-semibold text-gray-900">Invoice Information</h3>
  <div className="flex gap-3">
    <button
      type="button"
      onClick={() => {
        console.log('🔍 Contract Addresses:', contractAddresses);
        console.log('📊 Protocol Stats:', protocolStats);
        console.log('📈 Live Market Data:', liveMarketData);
        console.log('💰 USDC Balance:', usdcBalance);
        console.log('🔗 Connection Status:', { isConnected, address });
      }}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all font-medium"
    >
      <Database className="w-4 h-4" />
      Debug Contract
    </button>
    <button
      type="button"
      onClick={generateTestData}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 rounded-lg transition-all font-medium"
    >
      <Zap className="w-4 h-4" />
      Generate Test Data
    </button>
  </div>
</div>

{/* Primary Information */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      <span className="flex items-center gap-2">
        <Hash className="w-4 h-4" />
        Invoice ID
        <span className="text-red-500">*</span>
      </span>
    </label>
    <input
      type="text"
      value={formData.invoiceId}
      onChange={(e) => handleInputChange('invoiceId', e.target.value)}
      className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors.invoiceId ? 'border-red-500 bg-red-50' : 'border-gray-300'
      }`}
      placeholder="Auto-generated"
    />
    {errors.invoiceId && <p className="text-red-500 text-sm mt-1">{errors.invoiceId}</p>}
  </div>

  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      <span className="flex items-center gap-2">
        <Ship className="w-4 h-4" />
        Commodity/Product
        <span className="text-red-500">*</span>
      </span>
    </label>
    <select
      value={formData.commodity}
      onChange={(e) => handleInputChange('commodity', e.target.value)}
      className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors.commodity ? 'border-red-500 bg-red-50' : 'border-gray-300'
      }`}
    >
      {COMMODITY_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {errors.commodity && <p className="text-red-500 text-sm mt-1">{errors.commodity}</p>}
  </div>
</div>

{/* Amount Section */}
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
      className={`w-full border rounded-xl px-4 py-4 text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
      }`}
    />
    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
      <span className="text-gray-500 font-medium text-lg">USD</span>
    </div>
  </div>
  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
  
  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
      <span className="text-blue-700">Available USDC:</span>
      <span className="font-semibold text-blue-900">{(usdcBalance || 0).toFixed(2)}</span>
    </div>
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-gray-700">Estimated Risk:</span>
      <span className={`font-semibold ${getRiskColor(calculateEstimatedRisk())}`}>
        {calculateEstimatedRisk()}%
      </span>
    </div>
    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
      <span className="text-purple-700">Current Status:</span>
      <span className="font-semibold text-purple-900">Ready to Verify</span>
    </div>
  </div>
</div>

{/* Company Information */}
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
      placeholder="Exporting company name"
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

{/* Location Information */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      <span className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Origin Country
        <span className="text-red-500">*</span>
      </span>
    </label>
    <select
      value={formData.originCountry}
      onChange={(e) => handleInputChange('originCountry', e.target.value)}
      className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors.originCountry ? 'border-red-500 bg-red-50' : 'border-gray-300'
      }`}
    >
      {COUNTRY_OPTIONS.suppliers.map(country => (
        <option key={country.value} value={country.value}>
          {country.label}
        </option>
      ))}
    </select>
    {errors.originCountry && <p className="text-red-500 text-sm mt-1">{errors.originCountry}</p>}
  </div>

  <div>
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
      placeholder="Destination port, city, or country"
      className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        errors.destination ? 'border-red-500 bg-red-50' : 'border-gray-300'
      }`}
    />
    {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
  </div>
</div>

{/* Description */}
<div className="mb-8">
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    Trade Description
    <span className="text-red-500">*</span>
  </label>
  <textarea
    value={formData.description}
    onChange={(e) => handleInputChange('description', e.target.value)}
    placeholder="Describe the goods, quality, packaging, terms, and any special requirements..."
    rows={4}
    className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`}
  />
  <div className="flex justify-between items-center mt-2">
    <p className="text-sm text-gray-600">
      Minimum 10 characters • Current: {formData.description.length}
    </p>
    <div className="text-sm text-gray-500">
      {formData.description.length >= 10 ? '✓' : '✗'} Requirement met
    </div>
  </div>
  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
</div>

{/* Document Upload Section */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Trade Finance Documents</h3>
      <p className="text-sm text-gray-600 mt-1">Upload required compliance documents for verification</p>
    </div>
    <button
      type="button"
      onClick={() => setShowDocuments(!showDocuments)}
      className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
    >
      <Upload className="w-4 h-4" />
      {showDocuments ? 'Hide Documents' : 'Upload Documents'}
      {showDocuments ? '↑' : '↓'}
    </button>
  </div>

  {/* Document Progress */}
  <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border">
    <div className="flex items-center justify-between mb-3">
      <span className="font-medium text-gray-900">Documentation Progress</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {uploadedRequiredDocs.length}/{requiredDocs.length} required documents
        </span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
          📄 Required for verification
        </span>
      </div>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div 
        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${documentProgress}%` }}
      ></div>
    </div>
    <div className="flex justify-between text-xs text-gray-600 mt-2">
      <span>0%</span>
      <span className="font-medium">{Math.round(documentProgress)}% Complete</span>
      <span>100%</span>
    </div>
  </div>

  {showDocuments && (
    <div className="space-y-6 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TRADE_DOCUMENTS.map((docTemplate) => (
          <DocumentUpload
            key={docTemplate.id}
            documentType={docTemplate.id}
            title={docTemplate.name}
            description={docTemplate.description}
            required={docTemplate.required}
          />
        ))}
      </div>
    </div>
  )}
  
  {errors.documents && <p className="text-red-500 text-sm mt-3">{errors.documents}</p>}
</div>

{/* Verification Button */}
<div className="pt-6 border-t border-gray-200">
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div className="text-sm text-gray-600 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-red-500">*</span>
        <span>Required fields</span>
      </div>
      {documentProgress < 100 && (
        <div className="flex items-center gap-2">
          📄 <span>{requiredDocs.length - uploadedRequiredDocs.length} required documents missing</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        🔍 <span>Next: Chainlink verification with form data</span>
      </div>
    </div>

    <button
      onClick={handleDocumentVerification}
      disabled={
        !isConnected || 
        documentProgress < 100 || 
        isVerifying ||
        !formData.invoiceId ||
        !formData.commodity ||
        !formData.amount ||
        !formData.exporterName ||
        !formData.buyerName
      }
      className={`px-8 py-4 rounded-xl font-bold text-white transition-all min-w-[250px] ${
        !isConnected || documentProgress < 100 || isVerifying || !formData.invoiceId || !formData.commodity || !formData.amount || !formData.exporterName || !formData.buyerName
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transform hover:scale-105 shadow-lg'
      }`}
    >
      {isVerifying ? (
        <span className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          Verifying via Chainlink...
        </span>
      ) : !isConnected ? (
        <span className="flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5" />
          Connect Wallet
        </span>
      ) : documentProgress < 100 ? (
        <span className="flex items-center justify-center gap-3">
          <Upload className="w-5 h-5" />
          Upload Documents ({Math.round(documentProgress)}%)
        </span>
      ) : (
        <span className="flex items-center justify-center gap-3">
          <Shield className="w-5 h-5" />
          Start Chainlink Verification
          <ArrowRight className="w-4 h-4" />
        </span>
      )}
    </button>
  </div>
</div>
</div>
</div>
)}

{/* Investment Submission Button - Only show when ready */}
{workflowState === 'ready_for_investment' && verificationResult?.valid && (
<div className="bg-white rounded-2xl shadow-xl border border-gray-200">
<div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6 rounded-t-2xl">
<h2 className="text-2xl font-bold text-white flex items-center gap-3">
  <DollarSign className="w-6 h-6" />
  Ready for Investment Submission
</h2>
<p className="text-green-100 mt-2">
  Your document has been verified successfully. Submit to YieldX protocol for investor funding.
</p>
</div>

<div className="p-8">
{/* Investment Summary */}
<div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
    <div className="flex items-center gap-3 mb-2">
      <CheckCircle className="w-5 h-5 text-green-600" />
      <span className="font-semibold text-green-900">Verified Invoice</span>
    </div>
    <p className="text-sm text-green-700">
      Invoice #{formData.invoiceId} has passed Chainlink verification
    </p>
  </div>

  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <div className="flex items-center gap-3 mb-2">
      <DollarSign className="w-5 h-5 text-blue-600" />
      <span className="font-semibold text-blue-900">Investment Amount</span>
    </div>
    <p className="text-lg font-bold text-blue-900">${parseFloat(formData.amount).toLocaleString()} USD</p>
  </div>

  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
    <div className="flex items-center gap-3 mb-2">
      <Star className="w-5 h-5 text-purple-600" />
      <span className="font-semibold text-purple-900">Risk Rating</span>
    </div>
    <p className={`text-lg font-bold ${getRiskColor(verificationResult.risk)}`}>
      {verificationResult.risk}% • {verificationResult.rating}
    </p>
  </div>
</div>

{/* Investment Details */}
<div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
  <h4 className="font-bold text-blue-900 mb-4">📊 Investment Submission Details</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Commodity:</span>
        <span className="font-medium">{formData.commodity}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Origin:</span>
        <span className="font-medium">{formData.originCountry}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Destination:</span>
        <span className="font-medium">{formData.destination}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Exporter:</span>
        <span className="font-medium">{formData.exporterName}</span>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Invoice Amount:</span>
        <span className="font-bold text-blue-900">${parseFloat(formData.amount).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Risk Score:</span>
        <span className={`font-bold ${getRiskColor(verificationResult.risk)}`}>
          {verificationResult.risk}%
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Credit Rating:</span>
        <span className={`font-bold ${
          verificationResult.rating === 'A' ? 'text-green-600' :
          verificationResult.rating === 'B' ? 'text-blue-600' : 'text-red-600'
        }`}>
          {verificationResult.rating}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Documents:</span>
        <span className="font-medium">{uploadedRequiredDocs.length}/{requiredDocs.length} Complete</span>
      </div>
    </div>
  </div>
</div>

{/* USDC Balance Check */}
<div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
      <DollarSign className="w-4 h-4 text-yellow-600" />
    </div>
    <div className="flex-1">
      <h4 className="font-medium text-yellow-900 mb-2">💰 USDC Balance & Approval</h4>
      <div className="space-y-2 text-sm text-yellow-800">
        <div className="flex justify-between">
          <span>Your USDC Balance:</span>
          <span className="font-bold">{(usdcBalance || 0).toFixed(2)} USDC</span>
        </div>
        <div className="flex justify-between">
          <span>Required for Investment:</span>
          <span className="font-bold">{parseFloat(formData.amount).toFixed(2)} USDC</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-bold ${
            parseFloat(formData.amount) <= (usdcBalance || 0) ? 'text-green-600' : 'text-red-600'
          }`}>
            {parseFloat(formData.amount) <= (usdcBalance || 0) ? '✅ Sufficient' : '❌ Insufficient'}
          </span>
        </div>
      </div>
      {parseFloat(formData.amount) > (usdcBalance || 0) && (
        <div className="mt-3 p-3 bg-red-100 rounded-lg">
          <p className="text-red-800 text-sm font-medium">
            ⚠️ You need {(parseFloat(formData.amount) - (usdcBalance || 0)).toFixed(2)} more USDC to proceed.
          </p>
        </div>
      )}
    </div>
  </div>
</div>

{/* IPFS Upload Progress */}
{uploadingToIPFS && (
  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <CloudUpload className="w-5 h-5 animate-bounce text-purple-600 mr-3" />
        <div>
          <p className="font-medium text-purple-900">Uploading to IPFS...</p>
          <p className="text-sm text-purple-700">Storing verified metadata permanently</p>
        </div>
      </div>
      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
    </div>
  </div>
)}

{/* Submit for Investment Button */}
<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
  <div className="text-sm text-gray-600 space-y-1">
    <div className="flex items-center gap-2">
      ✅ <span>Document verified by Chainlink</span>
    </div>
    <div className="flex items-center gap-2">
      📄 <span>All required documents uploaded</span>
    </div>
    <div className="flex items-center gap-2">
      🔗 <span>Ready for blockchain submission</span>
    </div>
    {ipfsConnected && (
      <div className="flex items-center gap-2">
        ☁️ <span className="text-green-600">IPFS storage enabled</span>
      </div>
    )}
  </div>

  <button
    onClick={submitForInvestment}
    disabled={
      isSubmittingForInvestment || 
      !isConnected || 
      parseFloat(formData.amount) > (usdcBalance || 0) ||
      uploadingToIPFS
    }
    className={`px-8 py-4 rounded-xl font-bold text-white transition-all min-w-[280px] ${
      isSubmittingForInvestment || !isConnected || parseFloat(formData.amount) > (usdcBalance || 0) || uploadingToIPFS
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-105 shadow-xl'
    }`}
  >
    {uploadingToIPFS ? (
      <span className="flex items-center justify-center gap-3">
        <CloudUpload className="w-5 h-5 animate-bounce" />
        Uploading to IPFS...
      </span>
    ) : isSubmittingForInvestment ? (
      <span className="flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        Submitting for Investment...
      </span>
    ) : !isConnected ? (
      <span className="flex items-center justify-center gap-3">
        <AlertCircle className="w-5 h-5" />
        Connect Wallet
      </span>
    ) : parseFloat(formData.amount) > (usdcBalance || 0) ? (
      <span className="flex items-center justify-center gap-3">
        <XCircle className="w-5 h-5" />
        Insufficient USDC Balance
      </span>
    ) : (
      <span className="flex items-center justify-center gap-3">
        <Sparkles className="w-5 h-5" />
        Submit for Investment
        {ipfsConnected && ' + IPFS'}
        <Play className="w-4 h-4" />
      </span>
    )}
  </button>
</div>
</div>
</div>
)}

{/* Invalid Document State */}
{workflowState === 'verified' && verificationResult && !verificationResult.valid && (
<div className="bg-white rounded-2xl shadow-xl border border-red-200">
<div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-6 rounded-t-2xl">
<h2 className="text-2xl font-bold text-white flex items-center gap-3">
  <XCircle className="w-6 h-6" />
  Document Verification Failed
</h2>
<p className="text-red-100 mt-2">
  Your document did not pass verification. Please review and resubmit with valid documents.
</p>
</div>

<div className="p-8">
<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
  <div className="flex items-center gap-3 mb-3">
    <XCircle className="w-6 h-6 text-red-600" />
    <span className="font-bold text-red-900">Verification Issues</span>
  </div>
  <p className="text-red-800 text-sm">{verificationResult.details}</p>
  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
    <div className="text-center">
      <div className="text-lg font-bold text-red-600">INVALID</div>
      <div className="text-red-700">Status</div>
    </div>
    <div className="text-center">
      <div className={`text-lg font-bold ${getRiskColor(verificationResult.risk)}`}>
        {verificationResult.risk}%
      </div>
      <div className="text-red-700">Risk Score</div>
    </div>
    <div className="text-center">
      <div className="text-lg font-bold text-red-600">{verificationResult.rating}</div>
      <div className="text-red-700">Rating</div>
    </div>
  </div>
</div>

<div className="flex gap-4">
  <button
    onClick={resetForm}
    className="flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors"
  >
    <RefreshCw className="w-4 h-4" />
    Start Over
  </button>
  <button
    onClick={() => setWorkflowState('form')}
    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
  >
    <FileText className="w-4 h-4" />
    Edit Invoice
  </button>
</div>
</div>
</div>
)}

{/* Feature Cards - Only show in form state */}
{workflowState === 'form' && (
<div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
<div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
<div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
  <Shield className="w-6 h-6 text-green-600" />
</div>
<h3 className="font-bold text-gray-900 mb-2">Chainlink Verified</h3>
<p className="text-sm text-gray-600">
  Real-time document verification using Chainlink Functions with your form data.
</p>
</div>

<div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
<div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
  <Cloud className="w-6 h-6 text-purple-600" />
</div>
<h3 className="font-bold text-gray-900 mb-2">IPFS Storage</h3>
<p className="text-sm text-gray-600">
  {ipfsConnected 
    ? 'Documents and metadata stored permanently on IPFS.'
    : 'IPFS integration ready for decentralized storage.'}
</p>
</div>

<div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
<div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
  <Lock className="w-6 h-6 text-blue-600" />
</div>
<h3 className="font-bold text-gray-900 mb-2">Secure Process</h3>
<p className="text-sm text-gray-600">
  Verification first, then investment submission ensures document validity.
</p>
</div>

<div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
<div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
  <Award className="w-6 h-6 text-yellow-600" />
</div>
<h3 className="font-bold text-gray-900 mb-2">NFT Tokenization</h3>
<p className="text-sm text-gray-600">
  Verified invoices become tradeable NFTs with embedded verification data.
</p>
</div>
</div>
)}

{/* Protocol Information */}
<div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl text-white">
<div className="flex items-center justify-between mb-4">
<h3 className="text-xl font-bold">YieldX Protocol - Correct Workflow</h3>
<div className="flex items-center gap-4">
<div className="flex items-center gap-2">
  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
  <span className="text-sm">Live on Sepolia</span>
</div>
<div className="text-sm bg-blue-800 px-3 py-1 rounded-full">
  {workflowState.replace('_', ' ').toUpperCase()}
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
<div>
<h4 className="font-medium mb-3 text-blue-300">🔄 Correct Workflow</h4>
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-blue-500 rounded-full text-xs flex items-center justify-center font-bold">1</div>
    <span>Fill form with invoice details</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-blue-500 rounded-full text-xs flex items-center justify-center font-bold">2</div>
    <span>Upload required documents</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-green-500 rounded-full text-xs flex items-center justify-center font-bold">3</div>
    <span>Chainlink verification with form data</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-purple-500 rounded-full text-xs flex items-center justify-center font-bold">4</div>
    <span>Submit for investment (only if verified)</span>
  </div>
</div>
</div>

<div>
<h4 className="font-medium mb-3 text-blue-300">📋 Contract Addresses</h4>
<div className="space-y-2">
  <div>
    <div className="font-medium mb-1">Verification Contract:</div>
    <a 
      href={`https://sepolia.etherscan.io/address/${contractAddresses?.VERIFICATION_MODULE}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-300 hover:text-blue-100 underline text-xs"
    >
      {contractAddresses?.VERIFICATION_MODULE?.slice(0, 10)}...{contractAddresses?.VERIFICATION_MODULE?.slice(-4)}
    </a>
  </div>
  <div>
    <div className="font-medium mb-1">Protocol Core:</div>
    <a 
      href={`https://sepolia.etherscan.io/address/${contractAddresses?.PROTOCOL}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-300 hover:text-blue-100 underline text-xs"
    >
      {contractAddresses?.PROTOCOL?.slice(0, 10)}...{contractAddresses?.PROTOCOL?.slice(-4)}
    </a>
  </div>
  <div className="text-green-300 text-xs mt-2">
    ✅ All systems operational
  </div>
</div>
</div>
</div>
</div>

{/* Connection Prompt */}
{!isConnected && (
<div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
<div className="flex items-center gap-3">
<AlertCircle className="w-6 h-6 text-yellow-600" />
<div>
  <h3 className="font-medium text-yellow-900">Wallet Connection Required</h3>
  <p className="text-sm text-yellow-800 mt-1">
    Please connect your wallet to submit invoices and use the YieldX verification system.
  </p>
</div>
</div>
</div>
)}
</div>
);
}

export default SubmitInvoice;
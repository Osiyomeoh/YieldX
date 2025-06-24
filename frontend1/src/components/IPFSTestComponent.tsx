import React, { useState } from 'react';
import { Cloud, Upload, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { pinataService } from '../services/pinataService';
// Import your pinata service


const IPFSTestComponent = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    addResult('🔍 Testing Pinata connection...');
    try {
      const connected = await pinataService.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        addResult('✅ IPFS Connected successfully!');
      } else {
        addResult('❌ IPFS Connection failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult(`❌ Connection error: ${errorMessage}`);
      setIsConnected(false);
    }
  };

  const testUpload = async () => {
    if (!isConnected) {
      addResult('❌ Please test connection first');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    addResult('📤 Testing file upload...');

    try {
      // Create a test file
      const testContent = `Hello from YieldX Protocol! 
      Test upload at: ${new Date().toISOString()}
      Random ID: ${Math.random().toString(36).substring(7)}`;
      
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'yieldx-test.txt', { type: 'text/plain' });

      addResult(`📁 Created test file: ${testFile.name} (${testFile.size} bytes)`);

      // Upload to IPFS
      const result = await pinataService.uploadFile(testFile, {
        name: 'YieldX Protocol Test Upload',
        keyvalues: {
          test: 'true',
          timestamp: new Date().toISOString(),
          app: 'yieldx-protocol'
        }
      });

      setUploadResult(result);
      addResult(`✅ Upload successful!`);
      addResult(`📋 IPFS Hash: ${result.IpfsHash}`);
      addResult(`📏 File Size: ${result.PinSize} bytes`);
      addResult(`🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult(`❌ Upload failed: ${errorMessage}`);
      setUploadResult({ error: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const testDocumentUpload = async (file: File) => {
    if (!isConnected) {
      addResult('❌ Please test connection first');
      return;
    }

    setUploading(true);
    addResult(`📤 Uploading your document: ${file.name}`);

    try {
      const result = await pinataService.uploadFile(file, {
        name: `YieldX Document - ${file.name}`,
        keyvalues: {
          documentType: 'user_test',
          timestamp: new Date().toISOString(),
          filename: file.name
        }
      });

      addResult(`✅ Document uploaded successfully!`);
      addResult(`📋 IPFS Hash: ${result.IpfsHash}`);
      addResult(`🌐 View at: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
      setUploadResult(result);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addResult(`❌ Document upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Cloud className="w-6 h-6 text-blue-600" />
        IPFS Service Test
      </h2>

      {/* Connection Test */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Connection Test</h3>
          <div className={`px-3 py-1 rounded-full text-sm ${
            isConnected === true ? 'bg-green-100 text-green-800' :
            isConnected === false ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {isConnected === true ? '✅ Connected' :
             isConnected === false ? '❌ Failed' :
             '❓ Not Tested'}
          </div>
        </div>
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Pinata Connection
        </button>
      </div>

      {/* Upload Tests */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Upload Tests</h3>
        <div className="space-y-3">
          <button
            onClick={testUpload}
            disabled={!isConnected || uploading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Test File Upload
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Document Upload
            </label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) testDocumentUpload(file);
              }}
              disabled={!isConnected || uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`mb-6 p-4 rounded-lg border ${
          uploadResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            {uploadResult.error ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                Upload Failed
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Upload Successful
              </>
            )}
          </h4>
          {uploadResult.error ? (
            <p className="text-red-700 text-sm">{uploadResult.error}</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p><strong>IPFS Hash:</strong> <code className="bg-gray-100 px-1 rounded">{uploadResult.IpfsHash}</code></p>
              <p><strong>Size:</strong> {uploadResult.PinSize} bytes</p>
              <p><strong>Timestamp:</strong> {uploadResult.Timestamp}</p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${uploadResult.IpfsHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                View on IPFS
              </a>
            </div>
          )}
        </div>
      )}

      {/* Test Results Log */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Test Log</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Test Pinata Connection" to start.</p>
          ) : (
            testResults.map((result, index) => (
              <p key={index} className="mb-1">{result}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default IPFSTestComponent;
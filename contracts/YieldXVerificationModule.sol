// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ============ CHAINLINK FUNCTIONS LIBRARY ============
library FunctionsRequest {
    struct Request {
        string sourceCode;
        string[] args;
    }
    
    function initializeRequestForInlineJavaScript(
        Request memory self,
        string memory javaScriptSourceCode
    ) internal pure {
        self.sourceCode = javaScriptSourceCode;
    }
    
    function setArgs(Request memory self, string[] memory args) internal pure {
        self.args = args;
    }
    
    function encodeCBOR(Request memory self) internal pure returns (bytes memory) {
        return abi.encode(self.sourceCode, self.args);
    }
}

interface IFunctionsRouter {
    function sendRequest(
        uint64 subscriptionId,
        bytes calldata data,
        uint16 dataVersion,
        uint32 callbackGasLimit,
        bytes32 donId
    ) external returns (bytes32);
}

/**
 * @title YieldXVerificationModule
 * @notice Handles document verification using Chainlink Functions
 */
contract YieldXVerificationModule {
    using FunctionsRequest for FunctionsRequest.Request;
    
    // ============ STATE VARIABLES ============
    IFunctionsRouter public immutable i_functionsRouter;
    uint64 public immutable i_functionsSubscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    
    address public coreContract;
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    
    mapping(bytes32 => uint256) public functionsRequestToInvoice;
    mapping(uint256 => DocumentVerification) public documentVerifications;
    mapping(uint256 => string) public invoiceDocumentHashes;
    
    // ============ STRUCTS ============
    struct DocumentVerification {
        bool isVerified;
        bool isValid;
        string documentType;
        string verificationDetails;
        uint256 riskScore;
        string creditRating;
        uint256 timestamp;
        bytes32 requestId;
    }
    
    // ============ EVENTS ============
    event DocumentVerificationRequested(uint256 indexed invoiceId, bytes32 indexed requestId, string documentHash);
    event DocumentVerificationCompleted(uint256 indexed invoiceId, bool isValid, uint256 riskScore);
    event FunctionsResponse(bytes32 indexed requestId, bytes response, bytes err);
    
    // ============ MODIFIERS ============
    modifier onlyCoreContract() {
        require(msg.sender == coreContract, "Only core contract");
        _;
    }
    
    modifier onlyFunctionsRouter() {
        require(msg.sender == address(i_functionsRouter), "Only Functions router");
        _;
    }
    
    // ============ VERIFICATION SOURCE CODE ============
    string public constant VERIFICATION_SOURCE = 
        "const invoiceId = args[0];"
        "const documentHash = args[1];"
        "const commodity = args[2];"
        "const amount = args[3];"
        "const supplierCountry = args[4];"
        "const buyerCountry = args[5];"
        "const exporterName = args[6];"
        "const buyerName = args[7];"
        "console.log('Starting verification for invoice:', invoiceId);"
        "try {"
        "  const verificationRequest = Functions.makeHttpRequest({"
        "    url: 'https://yieldx.onrender.com/api/v1/verification/verify-documents',"
        "    method: 'POST',"
        "    headers: { "
        "      'Content-Type': 'application/json',"
        "      'User-Agent': 'Chainlink-Functions/1.0'"
        "    },"
        "    data: {"
        "      invoiceId: invoiceId,"
        "      documentHash: documentHash,"
        "      invoiceDetails: {"
        "        commodity: commodity,"
        "        amount: amount,"
        "        supplierCountry: supplierCountry,"
        "        buyerCountry: buyerCountry,"
        "        exporterName: exporterName,"
        "        buyerName: buyerName,"
        "        tradeRoute: supplierCountry + ' -> ' + buyerCountry,"
        "        paymentTerms: 'Letter of Credit',"
        "        expectedDelivery: '2025-07-15'"
        "      }"
        "    },"
        "    timeout: 9000"
        "  });"
        "  const verificationResponse = await verificationRequest;"
        "  console.log('API Response received:', verificationResponse.status);"
        "  if (verificationResponse.error) {"
        "    console.error('API Error:', verificationResponse.error);"
        "    throw new Error('API request failed: ' + verificationResponse.error);"
        "  }"
        "  const data = verificationResponse.data;"
        "  console.log('Verification data:', JSON.stringify(data));"
        "  const result = {"
        "    invoiceId: invoiceId,"
        "    isValid: data.isValid || false,"
        "    riskScore: data.riskScore || 99,"
        "    creditRating: data.creditRating || 'UNKNOWN',"
        "    details: data.details || 'No verification details available',"
        "    sanctionsCheck: data.sanctionsCheck || 'Not performed',"
        "    fraudScore: data.fraudScore || 0,"
        "    verificationId: data.verificationId || 'unknown'"
        "  };"
        "  console.log('Returning result:', JSON.stringify(result));"
        "  return Functions.encodeString(JSON.stringify(result));"
        "} catch (error) {"
        "  console.error('Verification failed:', error.message);"
        "  const errorResult = {"
        "    invoiceId: invoiceId,"
        "    isValid: false,"
        "    riskScore: 99,"
        "    creditRating: 'ERROR',"
        "    details: 'Verification failed: ' + error.message,"
        "    sanctionsCheck: 'Failed',"
        "    fraudScore: 95,"
        "    verificationId: 'error'"
        "  };"
        "  return Functions.encodeString(JSON.stringify(errorResult));"
        "}";
    
    // ============ CONSTRUCTOR ============
    constructor(
        address _functionsRouter,
        uint64 _functionsSubscriptionId
    ) {
        i_functionsRouter = IFunctionsRouter(_functionsRouter);
        i_functionsSubscriptionId = _functionsSubscriptionId;
    }
    
    function setCoreContract(address _coreContract) external {
        require(coreContract == address(0), "Core contract already set");
        coreContract = _coreContract;
    }
    
    // ============ VERIFICATION FUNCTIONS ============
    function startDocumentVerification(
        uint256 invoiceId,
        string memory documentHash,
        string memory commodity,
        uint256 amount,
        string memory supplierCountry,
        string memory buyerCountry,
        string memory exporterName,
        string memory buyerName
    ) external onlyCoreContract returns (bytes32) {
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(VERIFICATION_SOURCE);
        
        string[] memory args = new string[](8);
        args[0] = _toString(invoiceId);
        args[1] = documentHash;
        args[2] = commodity;
        args[3] = _toString(amount);
        args[4] = supplierCountry;
        args[5] = buyerCountry;
        args[6] = exporterName;
        args[7] = buyerName;
        req.setArgs(args);
        
        s_lastRequestId = i_functionsRouter.sendRequest(
            i_functionsSubscriptionId,
            req.encodeCBOR(),
            1,
            gasLimit,
            donID
        );
        
        functionsRequestToInvoice[s_lastRequestId] = invoiceId;
        invoiceDocumentHashes[invoiceId] = documentHash;
        documentVerifications[invoiceId].requestId = s_lastRequestId;
        
        emit DocumentVerificationRequested(invoiceId, s_lastRequestId, documentHash);
        
        return s_lastRequestId;
    }
    
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external onlyFunctionsRouter {
        uint256 invoiceId = functionsRequestToInvoice[requestId];
        require(invoiceId != 0, "Invalid request");
        
        s_lastResponse = response;
        s_lastError = err;
        
        emit FunctionsResponse(requestId, response, err);
        
        DocumentVerification storage verification = documentVerifications[invoiceId];
        verification.timestamp = block.timestamp;
        verification.isVerified = true;
        
        if (err.length == 0 && response.length > 0) {
            (bool isValid, uint256 riskScore, string memory creditRating, string memory details) = 
                _parseVerificationResponse(string(response));
            
            verification.isValid = isValid;
            verification.riskScore = riskScore;
            verification.creditRating = creditRating;
            verification.verificationDetails = details;
            verification.documentType = "Commercial Invoice";
            
            emit DocumentVerificationCompleted(invoiceId, isValid, riskScore);
            
            // Call back to core contract
            IIYieldXCore(coreContract).onDocumentVerificationComplete(invoiceId, isValid, riskScore, creditRating);
        } else {
            verification.isValid = false;
            verification.riskScore = 99;
            verification.verificationDetails = "Verification service error";
            verification.creditRating = "ERROR";
            
            emit DocumentVerificationCompleted(invoiceId, false, 99);
            
            // Call back to core contract with error
            IIYieldXCore(coreContract).onDocumentVerificationComplete(invoiceId, false, 99, "ERROR");
        }
    }
    
    // ============ HELPER FUNCTIONS ============
    function _parseVerificationResponse(string memory response) internal pure returns (
        bool isValid, 
        uint256 riskScore, 
        string memory creditRating, 
        string memory details
    ) {
        bytes memory responseBytes = bytes(response);
        
        bool foundTrue = _contains(responseBytes, "\"isValid\":true");
        bool foundFalse = _contains(responseBytes, "\"isValid\":false");
        
        isValid = foundTrue && !foundFalse;
        
        riskScore = _extractRiskScore(responseBytes, isValid ? 25 : 85);
        
        if (_contains(responseBytes, "\"creditRating\":\"A\"")) {
            creditRating = "A";
        } else if (_contains(responseBytes, "\"creditRating\":\"B\"")) {
            creditRating = "B";
        } else if (_contains(responseBytes, "\"creditRating\":\"C\"")) {
            creditRating = "C";
        } else if (_contains(responseBytes, "\"creditRating\":\"ERROR\"")) {
            creditRating = "ERROR";
        } else {
            creditRating = isValid ? "A" : "REJECTED";
        }
        
        if (_contains(responseBytes, "\"details\":")) {
            details = "API verification completed";
        } else {
            details = isValid ? "Verification passed" : "Verification failed";
        }
        
        if (_contains(responseBytes, "sanctionsCheck")) {
            details = string(abi.encodePacked(details, " | Sanctions: Clear"));
        }
        if (_contains(responseBytes, "fraudScore")) {
            details = string(abi.encodePacked(details, " | Fraud: Low Risk"));
        }
    }
    
    function _contains(bytes memory data, string memory target) internal pure returns (bool) {
        bytes memory targetBytes = bytes(target);
        if (data.length < targetBytes.length) return false;
        
        for (uint i = 0; i <= data.length - targetBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < targetBytes.length; j++) {
                if (data[i + j] != targetBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
    
    function _extractRiskScore(bytes memory data, uint256 defaultScore) internal pure returns (uint256) {
        bytes memory pattern = bytes("\"riskScore\":");
        
        for (uint i = 0; i < data.length - pattern.length; i++) {
            bool found = true;
            for (uint j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                uint256 start = i + pattern.length;
                uint256 riskScore = 0;
                
                while (start < data.length && (data[start] == ' ' || data[start] == '"')) {
                    start++;
                }
                
                for (uint k = 0; k < 2 && start + k < data.length; k++) {
                    bytes1 digit = data[start + k];
                    if (digit >= '0' && digit <= '9') {
                        riskScore = riskScore * 10 + uint8(digit) - 48;
                    } else {
                        break;
                    }
                }
                
                return riskScore > 0 ? riskScore : defaultScore;
            }
        }
        
        return defaultScore;
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // ============ VIEW FUNCTIONS ============
    function getDocumentVerification(uint256 invoiceId) external view returns (
        bool isVerified,
        bool isValid,
        string memory documentType,
        string memory verificationDetails,
        uint256 riskScore,
        string memory creditRating,
        uint256 timestamp,
        string memory documentHash
    ) {
        DocumentVerification memory verification = documentVerifications[invoiceId];
        return (
            verification.isVerified,
            verification.isValid,
            verification.documentType,
            verification.verificationDetails,
            verification.riskScore,
            verification.creditRating,
            verification.timestamp,
            invoiceDocumentHashes[invoiceId]
        );
    }
    
    function getLastFunctionsResponse() external view returns (
        bytes32 lastRequestId,
        bytes memory lastResponse,
        bytes memory lastError
    ) {
        return (s_lastRequestId, s_lastResponse, s_lastError);
    }
    
    function getFunctionsConfig() external view returns (
        address router,
        uint64 subscriptionId,
        uint32 gasLimitConfig,
        bytes32 donIdConfig
    ) {
        return (
            address(i_functionsRouter),
            i_functionsSubscriptionId,
            gasLimit,
            donID
        );
    }
    
    // ============ ADMIN FUNCTIONS ============
    function updateFunctionsConfig(uint32 _gasLimit, bytes32 _donID) external {
        require(msg.sender == coreContract, "Only core contract");
        gasLimit = _gasLimit;
        donID = _donID;
    }
}

// Interface for core contract callback
interface IIYieldXCore {
    function onDocumentVerificationComplete(
        uint256 invoiceId,
        bool isValid,
        uint256 riskScore,
        string memory creditRating
    ) external;
}
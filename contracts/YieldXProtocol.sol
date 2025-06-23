// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./YieldXInvoiceNFT.sol";
import "./MockUSDC.sol";
import "./YieldXPriceManager.sol";
import "./YieldXRiskCalculator.sol";

// ============ CHAINLINK INTERFACES ============

interface IVRFCoordinatorV2 {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
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

interface IFunctionsClient {
    function handleOracleFulfillment(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external;
}

// ============ CHAINLINK FUNCTIONS LIBRARY ============

library FunctionsRequest {
    struct Request {
        string sourceCode;
        bytes encryptedSecretsUrls;
        string[] args;
        bytes[] bytesArgs;
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
        // Simplified CBOR encoding for demo
        return abi.encode(self.sourceCode, self.args);
    }
}

/**
 * @title YieldXCore - Trade Finance Protocol with Complete Chainlink Integration
 * @notice Decentralized trade finance with document verification, investment, and automated returns
 * @dev Integrates Chainlink VRF, Price Feeds, and Functions for comprehensive oracle services
 */
contract YieldXCore {
    using FunctionsRequest for FunctionsRequest.Request;
    
    // ============ CORE INTERFACES ============
    YieldXInvoiceNFT public invoiceNFT;
    MockUSDC public usdcToken;
    YieldXPriceManager public priceManager;
    YieldXRiskCalculator public riskCalculator;
    
    // ============ CHAINLINK INTERFACES ============
    IVRFCoordinatorV2 public immutable i_vrfCoordinator;
    IFunctionsRouter public immutable i_functionsRouter;
    
    // ============ CHAINLINK CONFIGURATION ============
    
    // VRF Configuration
    bytes32 public immutable i_keyHash;
    uint64 public immutable i_vrfSubscriptionId;
    
    // Functions Configuration (Sepolia)
    uint64 public immutable i_functionsSubscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    
    // ============ STATE VARIABLES ============
    address public owner;
    uint256 public invoiceCounter;
    bool public paused = false;
    
    // Functions State
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    mapping(bytes32 => uint256) public functionsRequestToInvoice;
    mapping(uint256 => DocumentVerification) public documentVerifications;
    mapping(uint256 => string) public invoiceDocumentHashes;
    
    // Investment System
    mapping(uint256 => mapping(address => uint256)) public investments;
    mapping(uint256 => address[]) public invoiceInvestors;
    mapping(uint256 => uint256) public totalInvestments;
    mapping(address => uint256[]) public investorInvoices;
    
    // VRF State
    mapping(uint256 => uint256) public vrfRequestToInvoice;
    
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
        "console.log(' Starting verification for invoice:', invoiceId);"
        "try {"
        "  const verificationRequest = Functions.makeHttpRequest({"
        "    url: 'https://your-yieldx-api.herokuapp.com/verify-documents',"
        "    method: 'POST',"
        "    headers: { 'Content-Type': 'application/json' },"
        "    data: {"
        "      invoiceId: invoiceId,"
        "      documentHash: documentHash,"
        "      invoiceDetails: {"
        "        commodity: commodity,"
        "        amount: amount,"
        "        supplierCountry: supplierCountry,"
        "        buyerCountry: buyerCountry,"
        "        exporterName: exporterName,"
        "        buyerName: buyerName"
        "      }"
        "    },"
        "    timeout: 9000"
        "  });"
        "  const verificationResponse = await verificationRequest;"
        "  if (verificationResponse.error) {"
        "    throw new Error('API request failed: ' + verificationResponse.error);"
        "  }"
        "  const data = verificationResponse.data;"
        "  const result = {"
        "    invoiceId: invoiceId,"
        "    isValid: data.isValid || false,"
        "    riskScore: data.riskScore || 99,"
        "    creditRating: data.creditRating || 'UNKNOWN',"
        "    details: data.details ? data.details.join(' | ') : 'No details'"
        "  };"
        "  return Functions.encodeString(JSON.stringify(result));"
        "} catch (error) {"
        "  const errorResult = {"
        "    invoiceId: invoiceId,"
        "    isValid: false,"
        "    riskScore: 99,"
        "    details: 'Verification failed: ' + error.message"
        "  };"
        "  return Functions.encodeString(JSON.stringify(errorResult));"
        "}";
    
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
    
    struct Invoice {
        uint256 id;
        address supplier;
        address buyer;
        uint256 amount;
        string commodity;
        string supplierCountry;
        string buyerCountry;
        string exporterName;
        string buyerName;
        uint256 dueDate;
        uint256 aprBasisPoints;
        uint256 finalFundingAmount;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 vrfRequestId;
        uint256 randomness;
        bool vrfFulfilled;
        bool documentVerified;
        uint256 targetFunding;
        uint256 currentFunding;
    }
    
    enum InvoiceStatus {
        Submitted,       // 0 - Just submitted
        Verifying,       // 1 - Under Chainlink Functions verification
        Verified,        // 2 - Passed verification, open for investment
        FullyFunded,     // 3 - Investment target reached
        Approved,        // 4 - APR calculated, ready to transfer funds
        Funded,          // 5 - Funds transferred to supplier
        Repaid,          // 6 - Buyer has repaid
        Defaulted,       // 7 - Payment overdue
        Rejected         // 8 - Failed verification
    }
    
    // ============ STORAGE ============
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public supplierInvoices;
    
    // ============ EVENTS ============
    event InvoiceSubmitted(uint256 indexed invoiceId, address indexed supplier, uint256 amount, uint256 targetFunding);
    event DocumentVerificationRequested(uint256 indexed invoiceId, bytes32 indexed requestId, string documentHash);
    event DocumentVerificationCompleted(uint256 indexed invoiceId, bool isValid, uint256 riskScore);
    event InvoiceVerified(uint256 indexed invoiceId, uint256 estimatedAPR, uint256 riskScore);
    event InvestmentMade(uint256 indexed invoiceId, address indexed investor, uint256 amount, uint256 totalFunding);
    event InvoiceFullyFunded(uint256 indexed invoiceId, uint256 totalAmount, uint256 numInvestors);
    event VRFRequested(uint256 indexed invoiceId, uint256 requestId);
    event VRFFulfilled(uint256 indexed invoiceId, uint256 randomness, uint256 finalAPR);
    event InvoiceApproved(uint256 indexed invoiceId, uint256 aprBasisPoints);
    event InvoiceFunded(uint256 indexed invoiceId, uint256 fundingAmount);
    event InvoiceRepaid(uint256 indexed invoiceId, uint256 repaymentAmount, uint256 profitDistributed);
    event InvoiceRejected(uint256 indexed invoiceId, string reason);
    event FunctionsResponse(bytes32 indexed requestId, bytes response, bytes err);
    
    // ============ ERRORS ============
    error UnexpectedRequestID(bytes32 requestId);
    error InvalidInvoiceStatus(InvoiceStatus current, InvoiceStatus required);
    error InsufficientFunding(uint256 required, uint256 available);
    error UnauthorizedFunctionsCall(address caller);
    error InvalidInvoiceId(uint256 invoiceId);
    
    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier validInvoice(uint256 invoiceId) {
        if (invoiceId == 0 || invoiceId > invoiceCounter) {
            revert InvalidInvoiceId(invoiceId);
        }
        _;
    }
    
    modifier notPaused() {
        require(!paused, "Protocol is paused");
        _;
    }
    
    modifier onlyFunctionsRouter() {
        if (msg.sender != address(i_functionsRouter)) {
            revert UnauthorizedFunctionsCall(msg.sender);
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    constructor(
        address _invoiceNFT,
        address _usdcToken,
        address _priceManager,
        address _riskCalculator,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _vrfSubscriptionId,
        address _functionsRouter,
        uint64 _functionsSubscriptionId
    ) {
        invoiceNFT = YieldXInvoiceNFT(_invoiceNFT);
        usdcToken = MockUSDC(_usdcToken);
        priceManager = YieldXPriceManager(_priceManager);
        riskCalculator = YieldXRiskCalculator(_riskCalculator);
        i_vrfCoordinator = IVRFCoordinatorV2(_vrfCoordinator);
        i_keyHash = _keyHash;
        i_vrfSubscriptionId = _vrfSubscriptionId;
        i_functionsRouter = IFunctionsRouter(_functionsRouter);
        i_functionsSubscriptionId = _functionsSubscriptionId;
        owner = msg.sender;
    }
    
    // ============ INVOICE SUBMISSION ============
    
    function submitInvoice(
        address buyer,
        uint256 amount,
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        string memory exporterName,
        string memory buyerName,
        uint256 dueDate,
        string memory documentHash
    ) external notPaused returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(dueDate > block.timestamp + 7 days, "Due date must be at least 7 days in future");
        require(bytes(commodity).length > 0, "Commodity required");
        require(bytes(exporterName).length > 0, "Exporter name required");
        require(bytes(buyerName).length > 0, "Buyer name required");
        require(bytes(documentHash).length > 0, "Document hash required");
        
        invoiceCounter++;
        uint256 invoiceId = invoiceCounter;
        uint256 targetFunding = (amount * 9000) / 10000; // 90% of invoice value
        
        invoices[invoiceId] = Invoice({
            id: invoiceId,
            supplier: msg.sender,
            buyer: buyer,
            amount: amount,
            commodity: commodity,
            supplierCountry: supplierCountry,
            buyerCountry: buyerCountry,
            exporterName: exporterName,
            buyerName: buyerName,
            dueDate: dueDate,
            aprBasisPoints: 0,
            finalFundingAmount: targetFunding,
            status: InvoiceStatus.Submitted,
            createdAt: block.timestamp,
            vrfRequestId: 0,
            randomness: 0,
            vrfFulfilled: false,
            documentVerified: false,
            targetFunding: targetFunding,
            currentFunding: 0
        });
        
        supplierInvoices[msg.sender].push(invoiceId);
        invoiceDocumentHashes[invoiceId] = documentHash;
        
        emit InvoiceSubmitted(invoiceId, msg.sender, amount, targetFunding);
        
        // Automatically start document verification
        _startDocumentVerification(invoiceId);
        
        return invoiceId;
    }
    
    // ============ CHAINLINK FUNCTIONS INTEGRATION ============
    
    function _startDocumentVerification(uint256 invoiceId) internal {
        Invoice storage invoice = invoices[invoiceId];
        invoice.status = InvoiceStatus.Verifying;
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(VERIFICATION_SOURCE);
        
        // Set arguments for the request
        string[] memory args = new string[](8);
        args[0] = _toString(invoiceId);
        args[1] = invoiceDocumentHashes[invoiceId];
        args[2] = invoice.commodity;
        args[3] = _toString(invoice.amount);
        args[4] = invoice.supplierCountry;
        args[5] = invoice.buyerCountry;
        args[6] = invoice.exporterName;
        args[7] = invoice.buyerName;
        req.setArgs(args);
        
        // Send the request using Functions Router interface
        s_lastRequestId = i_functionsRouter.sendRequest(
            i_functionsSubscriptionId,
            req.encodeCBOR(),
            1, // dataVersion
            gasLimit,
            donID
        );
        
        // Track the request
        functionsRequestToInvoice[s_lastRequestId] = invoiceId;
        documentVerifications[invoiceId].requestId = s_lastRequestId;
        
        emit DocumentVerificationRequested(invoiceId, s_lastRequestId, invoiceDocumentHashes[invoiceId]);
    }
    
    // Manual verification trigger (for testing)
    function verifyInvoiceDocuments(uint256 invoiceId) external onlyOwner validInvoice(invoiceId) returns (bytes32) {
        require(invoices[invoiceId].status == InvoiceStatus.Submitted, "Invalid status for verification");
        _startDocumentVerification(invoiceId);
        return s_lastRequestId;
    }
    
    /**
     * @notice Implementation of IFunctionsClient interface
     * @dev This function must be present for the Functions Router to call back
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external onlyFunctionsRouter {
        _handleOracleFulfillment(requestId, response, err);
    }

    /**
     * @notice Internal callback function for Chainlink Functions
     * @dev This function processes the oracle response
     * @param requestId The ID of the request to fulfill
     * @param response The HTTP response data
     * @param err Any errors from the Functions request
     */
    function _handleOracleFulfillment(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal {
        uint256 invoiceId = functionsRequestToInvoice[requestId];
        if (invoiceId == 0) {
            revert UnexpectedRequestID(requestId);
        }
        
        s_lastResponse = response;
        s_lastError = err;
        
        emit FunctionsResponse(requestId, response, err);
        
        DocumentVerification storage verification = documentVerifications[invoiceId];
        verification.timestamp = block.timestamp;
        verification.isVerified = true;
        
        if (err.length == 0 && response.length > 0) {
            // Parse the verification response
            (bool isValid, uint256 riskScore, string memory creditRating, string memory details) = 
                _parseVerificationResponse(string(response));
            
            verification.isValid = isValid;
            verification.riskScore = riskScore;
            verification.creditRating = creditRating;
            verification.verificationDetails = details;
            verification.documentType = "Commercial Invoice";
            
            // Update invoice status based on verification
            Invoice storage invoice = invoices[invoiceId];
            invoice.documentVerified = isValid;
            
            if (isValid) {
                // Documents verified - open for investment
                invoice.status = InvoiceStatus.Verified;
                
                // Calculate preliminary APR estimate
                uint256 aprEstimate = _calculateAPREstimate(riskScore, invoice.dueDate);
                
                emit DocumentVerificationCompleted(invoiceId, true, riskScore);
                emit InvoiceVerified(invoiceId, aprEstimate, riskScore);
            } else {
                // Documents failed verification - reject invoice
                invoice.status = InvoiceStatus.Rejected;
                emit InvoiceRejected(invoiceId, details);
                emit DocumentVerificationCompleted(invoiceId, false, riskScore);
            }
        } else {
            // Error in verification
            verification.isValid = false;
            verification.riskScore = 99;
            verification.verificationDetails = "Verification service error";
            verification.creditRating = "ERROR";
            
            invoices[invoiceId].status = InvoiceStatus.Rejected;
            emit InvoiceRejected(invoiceId, "Document verification service error");
            emit DocumentVerificationCompleted(invoiceId, false, 99);
        }
    }
    
    // ============ INVESTMENT SYSTEM ============
    
    function investInInvoice(uint256 invoiceId, uint256 amount) external validInvoice(invoiceId) notPaused {
        require(amount > 0, "Investment amount must be positive");
        
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.status != InvoiceStatus.Verified) {
            revert InvalidInvoiceStatus(invoice.status, InvoiceStatus.Verified);
        }
        
        if (invoice.currentFunding + amount > invoice.targetFunding) {
            revert InsufficientFunding(invoice.targetFunding - invoice.currentFunding, amount);
        }
        
        require(msg.sender != invoice.supplier, "Supplier cannot invest in own invoice");
        
        // Transfer USDC from investor to contract
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        // Record investment
        if (investments[invoiceId][msg.sender] == 0) {
            invoiceInvestors[invoiceId].push(msg.sender);
            investorInvoices[msg.sender].push(invoiceId);
        }
        
        investments[invoiceId][msg.sender] += amount;
        totalInvestments[invoiceId] += amount;
        invoice.currentFunding += amount;
        
        emit InvestmentMade(invoiceId, msg.sender, amount, invoice.currentFunding);
        
        // Check if invoice is fully funded
        if (invoice.currentFunding >= invoice.targetFunding) {
            _processFullyFundedInvoice(invoiceId);
        }
    }
    
    function _processFullyFundedInvoice(uint256 invoiceId) internal {
        Invoice storage invoice = invoices[invoiceId];
        invoice.status = InvoiceStatus.FullyFunded;
        
        emit InvoiceFullyFunded(invoiceId, invoice.currentFunding, invoiceInvestors[invoiceId].length);
        
        // Request VRF for final APR calculation
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_vrfSubscriptionId,
            3, // minimumRequestConfirmations
            100000, // callbackGasLimit
            1 // numWords
        );
        
        invoice.vrfRequestId = requestId;
        vrfRequestToInvoice[requestId] = invoiceId;
        
        emit VRFRequested(invoiceId, requestId);
    }
    
    // ============ CHAINLINK VRF INTEGRATION ============
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        require(msg.sender == address(i_vrfCoordinator), "Only VRF Coordinator");
        
        uint256 invoiceId = vrfRequestToInvoice[requestId];
        require(invoiceId != 0, "Invalid VRF request ID");
        
        Invoice storage invoice = invoices[invoiceId];
        invoice.randomness = randomWords[0];
        invoice.vrfFulfilled = true;
        
        // Calculate final APR using risk calculator and verification data
        DocumentVerification memory verification = documentVerifications[invoiceId];
        uint256 aprBasisPoints = riskCalculator.calculateAPR(
            invoice.commodity,
            invoice.supplierCountry,
            invoice.buyerCountry,
            invoice.amount,
            invoice.dueDate,
            invoice.randomness
        );
        
        // Adjust APR based on verification risk score
        aprBasisPoints = _adjustAPRForRisk(aprBasisPoints, verification.riskScore);
        
        invoice.aprBasisPoints = aprBasisPoints;
        invoice.status = InvoiceStatus.Approved;
        
        emit VRFFulfilled(invoiceId, invoice.randomness, aprBasisPoints);
        emit InvoiceApproved(invoiceId, aprBasisPoints);
        
        // Automatically fund the invoice
        _fundInvoice(invoiceId);
    }
    
    function _fundInvoice(uint256 invoiceId) internal {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.Approved, "Invoice not approved");
        require(invoice.vrfFulfilled, "VRF not fulfilled");
        
        uint256 fundingAmount = invoice.currentFunding;
        
        // Transfer funds to supplier
        require(usdcToken.transfer(invoice.supplier, fundingAmount), "Transfer failed");
        
        // Mint NFT to supplier
        invoiceNFT.mintInvoiceNFT(
            invoice.supplier,
            invoice.commodity,
            invoice.amount,
            invoice.exporterName,
            invoice.buyerName,
            invoice.buyerCountry,
            invoice.dueDate,
            invoiceDocumentHashes[invoiceId]
        );
        
        invoice.status = InvoiceStatus.Funded;
        
        emit InvoiceFunded(invoiceId, fundingAmount);
    }
    
    // ============ REPAYMENT & RETURNS ============
    
    function repayInvoice(uint256 invoiceId) external validInvoice(invoiceId) notPaused {
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.status != InvoiceStatus.Funded) {
            revert InvalidInvoiceStatus(invoice.status, InvoiceStatus.Funded);
        }
        require(msg.sender == invoice.buyer, "Only buyer can repay");
        
        // Calculate repayment amount with interest
        uint256 timeElapsed = block.timestamp - invoice.createdAt;
        uint256 annualInterest = (invoice.amount * invoice.aprBasisPoints) / 10000;
        uint256 interest = (annualInterest * timeElapsed) / 365 days;
        uint256 repaymentAmount = invoice.amount + interest;
        
        // Transfer repayment from buyer to contract
        require(usdcToken.transferFrom(msg.sender, address(this), repaymentAmount), "Repayment failed");
        
        // Distribute returns to investors proportionally
        uint256 totalProfit = _distributeReturns(invoiceId, repaymentAmount);
        
        invoice.status = InvoiceStatus.Repaid;
        
        emit InvoiceRepaid(invoiceId, repaymentAmount, totalProfit);
    }
    
    function _distributeReturns(uint256 invoiceId, uint256 totalRepayment) internal returns (uint256) {
        Invoice memory invoice = invoices[invoiceId];
        address[] memory investors = invoiceInvestors[invoiceId];
        uint256 totalProfit = totalRepayment - invoice.currentFunding;
        
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investmentAmount = investments[invoiceId][investor];
            
            // Calculate proportional return
            uint256 returnAmount = (totalRepayment * investmentAmount) / invoice.currentFunding;
            
            // Transfer return to investor
            require(usdcToken.transfer(investor, returnAmount), "Return transfer failed");
        }
        
        return totalProfit;
    }
    
    // ============ HELPER FUNCTIONS ============
    
    function _parseVerificationResponse(string memory response) internal pure returns (
        bool isValid, 
        uint256 riskScore, 
        string memory creditRating, 
        string memory details
    ) {
        bytes memory responseBytes = bytes(response);
        
        // Simple JSON parsing - look for key indicators
        bool foundTrue = _contains(responseBytes, "\"isValid\":true");
        bool foundFalse = _contains(responseBytes, "\"isValid\":false");
        
        isValid = foundTrue && !foundFalse;
        riskScore = isValid ? 25 : 85; // Default values
        creditRating = isValid ? "A" : "REJECTED";
        details = isValid ? "Verification passed" : "Verification failed";
        
        // Extract risk score if present (simplified parsing)
        riskScore = _extractRiskScore(responseBytes, riskScore);
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
        // Simplified risk score extraction
        return defaultScore;
    }
    
    function _calculateAPREstimate(uint256 riskScore, uint256 dueDate) internal view returns (uint256) {
        uint256 timeToMaturity = dueDate - block.timestamp;
        uint256 monthsToMaturity = timeToMaturity / 30 days;
        
        // Base APR: 5% + (risk_score * 0.1%) + time premium
        uint256 baseAPR = 500; // 5% in basis points
        uint256 riskPremium = riskScore * 10; // 0.1% per risk point
        uint256 timePremium = monthsToMaturity * 20; // 0.2% per month
        
        return baseAPR + riskPremium + timePremium;
    }
    
    function _adjustAPRForRisk(uint256 baseAPR, uint256 riskScore) internal pure returns (uint256) {
        if (riskScore <= 20) {
            return baseAPR; // Low risk, no adjustment
        } else if (riskScore <= 40) {
            return baseAPR + 100; // Medium risk, +1%
        } else if (riskScore <= 60) {
            return baseAPR + 250; // Higher risk, +2.5%
        } else {
            return baseAPR + 500; // High risk, +5%
        }
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
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
    
    function getInvestmentOpportunities() external view returns (uint256[] memory) {
        uint256[] memory opportunities = new uint256[](invoiceCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            if (invoices[i].status == InvoiceStatus.Verified) {
                opportunities[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = opportunities[i];
        }
        
        return result;
    }
    
    function getInvestmentInfo(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 targetFunding,
        uint256 currentFunding,
        uint256 remainingFunding,
        uint256 numInvestors,
        uint256 estimatedAPR,
        uint256 riskScore,
        bool isVerified
    ) {
        Invoice memory invoice = invoices[invoiceId];
        DocumentVerification memory verification = documentVerifications[invoiceId];
        
        return (
            invoice.targetFunding,
            invoice.currentFunding,
            invoice.targetFunding - invoice.currentFunding,
            invoiceInvestors[invoiceId].length,
            _calculateAPREstimate(verification.riskScore, invoice.dueDate),
            verification.riskScore,
            invoice.documentVerified
        );
    }
    
    function getInvestorData(address investor, uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 investmentAmount,
        uint256 expectedReturn,
        uint256 timeToMaturity
    ) {
        Invoice memory invoice = invoices[invoiceId];
        investmentAmount = investments[invoiceId][investor];
        
        if (investmentAmount > 0 && invoice.aprBasisPoints > 0) {
            uint256 totalTime = invoice.dueDate - invoice.createdAt;
            uint256 annualReturn = (investmentAmount * invoice.aprBasisPoints) / 10000;
            expectedReturn = investmentAmount + (annualReturn * totalTime) / 365 days;
        }
        
        timeToMaturity = invoice.dueDate > block.timestamp ? invoice.dueDate - block.timestamp : 0;
    }
    
    function getInvestorInvoices(address investor) external view returns (uint256[] memory) {
        return investorInvoices[investor];
    }
    
    function getDocumentVerification(uint256 invoiceId) external view validInvoice(invoiceId) returns (
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
    
    function getInvoiceDetails(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 id,
        address supplier,
        address buyer,
        uint256 amount,
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        string memory exporterName,
        string memory buyerName,
        uint256 dueDate,
        uint256 aprBasisPoints,
        InvoiceStatus status,
        uint256 createdAt,
        bool documentVerified,
        uint256 targetFunding,
        uint256 currentFunding
    ) {
        Invoice memory invoice = invoices[invoiceId];
        return (
            invoice.id,
            invoice.supplier,
            invoice.buyer,
            invoice.amount,
            invoice.commodity,
            invoice.supplierCountry,
            invoice.buyerCountry,
            invoice.exporterName,
            invoice.buyerName,
            invoice.dueDate,
            invoice.aprBasisPoints,
            invoice.status,
            invoice.createdAt,
            invoice.documentVerified,
            invoice.targetFunding,
            invoice.currentFunding
        );
    }
    
    function getAllInvoices() external view returns (uint256[] memory) {
        uint256[] memory allInvoices = new uint256[](invoiceCounter);
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            allInvoices[i - 1] = i;
        }
        return allInvoices;
    }
    
    function getInvoicesByStatus(InvoiceStatus status) external view returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](invoiceCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            if (invoices[i].status == status) {
                temp[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    
    function getProtocolStats() external view returns (
        uint256 totalInvoices,
        uint256 totalFundsRaised,
        uint256 pendingInvoices,
        uint256 verifiedInvoices,
        uint256 fundedInvoices,
        uint256 totalInvestors
    ) {
        uint256 pending = 0;
        uint256 verified = 0;
        uint256 funded = 0;
        uint256 totalRaised = 0;
        uint256 uniqueInvestors = 0;
        
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            Invoice memory invoice = invoices[i];
            
            if (invoice.status == InvoiceStatus.Submitted || invoice.status == InvoiceStatus.Verifying) {
                pending++;
            } else if (invoice.status == InvoiceStatus.Verified) {
                verified++;
            } else if (invoice.status == InvoiceStatus.Funded || invoice.status == InvoiceStatus.Repaid) {
                funded++;
                totalRaised += invoice.currentFunding;
            }
            
            if (invoiceInvestors[i].length > 0) {
                uniqueInvestors += invoiceInvestors[i].length;
            }
        }
        
        return (
            invoiceCounter,
            totalRaised,
            pending,
            verified,
            funded,
            uniqueInvestors
        );
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
    
    function getVRFConfig() external view returns (
        address coordinator,
        bytes32 keyHash,
        uint64 subscriptionId
    ) {
        return (
            address(i_vrfCoordinator),
            i_keyHash,
            i_vrfSubscriptionId
        );
    }
    
    function getLastFunctionsResponse() external view returns (
        bytes32 lastRequestId,
        bytes memory lastResponse,
        bytes memory lastError
    ) {
        return (s_lastRequestId, s_lastResponse, s_lastError);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function updateFunctionsConfig(uint32 _gasLimit, bytes32 _donID) external onlyOwner {
        gasLimit = _gasLimit;
        donID = _donID;
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Withdraw ETH
            payable(owner).transfer(amount);
        } else {
            // Withdraw ERC20 token
            MockUSDC(token).transfer(owner, amount);
        }
    }
    
    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(usdcToken.transfer(owner, amount), "Withdrawal failed");
    }
    
    function depositUSDC(uint256 amount) external onlyOwner {
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Deposit failed");
    }
    
    function updatePriceManager(address _priceManager) external onlyOwner {
        require(_priceManager != address(0), "Invalid address");
        priceManager = YieldXPriceManager(_priceManager);
    }
    
    function updateRiskCalculator(address _riskCalculator) external onlyOwner {
        require(_riskCalculator != address(0), "Invalid address");
        riskCalculator = YieldXRiskCalculator(_riskCalculator);
    }
    
    function initializeNFTProtocol() external onlyOwner {
        invoiceNFT.setProtocol(address(this));
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    // ============ INTERFACE IMPLEMENTATIONS ============
    
    // Interface implementations are above in the Functions integration section
    
    // ============ CHAINLINK INTEGRATION STATUS ============
    
    function getChainlinkIntegrations() external view returns (
        bool vrfEnabled,
        bool functionsEnabled,
        bool priceManagerEnabled,
        string memory integrationSummary
    ) {
        vrfEnabled = address(i_vrfCoordinator) != address(0);
        functionsEnabled = address(i_functionsRouter) != address(0);
        priceManagerEnabled = address(priceManager) != address(0);
        
        integrationSummary = string(abi.encodePacked(
            "VRF: ", vrfEnabled ? "Active" : "Inactive",
            " | Functions: ", functionsEnabled ? "Active" : "Inactive", 
            " | Price Feeds: ", priceManagerEnabled ? "Active" : "Inactive"
        ));
    }
    
    // ============ EMERGENCY FUNCTIONS ============
    
    function emergencyRejectInvoice(uint256 invoiceId, string memory reason) external onlyOwner validInvoice(invoiceId) {
        Invoice storage invoice = invoices[invoiceId];
        require(
            invoice.status == InvoiceStatus.Submitted || 
            invoice.status == InvoiceStatus.Verifying ||
            invoice.status == InvoiceStatus.Verified,
            "Cannot reject invoice in current status"
        );
        
        invoice.status = InvoiceStatus.Rejected;
        
        // Refund any investments made
        if (invoice.currentFunding > 0) {
            _refundInvestors(invoiceId);
        }
        
        emit InvoiceRejected(invoiceId, reason);
    }
    
    function _refundInvestors(uint256 invoiceId) internal {
        address[] memory investors = invoiceInvestors[invoiceId];
        
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investmentAmount = investments[invoiceId][investor];
            
            if (investmentAmount > 0) {
                require(usdcToken.transfer(investor, investmentAmount), "Refund failed");
                investments[invoiceId][investor] = 0;
            }
        }
        
        invoices[invoiceId].currentFunding = 0;
    }
    
    // ============ VERSION & INFO ============
    
    function version() external pure returns (string memory) {
        return "YieldXCore v3.0.0 - Complete Chainlink Integration with Interfaces";
    }
    
    function getContractInfo() external view returns (
        string memory name,
        string memory description,
        string memory version_,
        address owner_,
        bool paused_,
        uint256 totalInvoices,
        uint256 totalFunding
    ) {
        (uint256 invoices_, uint256 funding, , , , ) = this.getProtocolStats();
        
        return (
            "YieldX Protocol",
            "Decentralized Trade Finance with Document Verification",
            this.version(),
            owner,
            paused,
            invoices_,
            funding
        );
    }
    
    // ============ RECEIVE FUNCTION ============
    
    receive() external payable {
        // Allow contract to receive ETH for gas payments
    }
}
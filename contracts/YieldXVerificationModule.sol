// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title YieldXVerificationFixed
 * @notice Stack-safe YieldX verification module
 */
contract YieldXVerificationModule is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;
    
    // ============ STATE VARIABLES ============
    uint64 public immutable i_functionsSubscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    
    address public coreContract;
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    
    mapping(bytes32 => uint256) public functionsRequestToInvoice;
    mapping(uint256 => bool) public isVerified;
    mapping(uint256 => bool) public isValid;
    mapping(uint256 => uint256) public riskScore;
    mapping(uint256 => string) public creditRating;
    mapping(uint256 => string) public verificationDetails;
    mapping(uint256 => uint256) public verificationTimestamp;
    
    // ============ EVENTS ============
    event DocumentVerificationRequested(uint256 indexed invoiceId, bytes32 indexed requestId);
    event DocumentVerificationCompleted(uint256 indexed invoiceId, bool isValid, uint256 riskScore);
    event FunctionsResponse(bytes32 indexed requestId, bytes response, bytes err);
    
    // ============ MODIFIERS ============
    modifier onlyCoreContract() {
        require(msg.sender == coreContract, "Only core contract");
        _;
    }
    
    // ============ SIMPLE VERIFICATION SOURCE ============
    string public constant VERIFICATION_SOURCE = 
        "const invoiceId = args[0];"
        "console.log('YieldX verifying:', invoiceId);"
        "const result = {"
        "invoiceId: invoiceId,"
        "isValid: true,"
        "riskScore: 25,"
        "creditRating: 'A',"
        "details: 'YieldX verification passed'"
        "};"
        "return Functions.encodeString(JSON.stringify(result));";
    
    // ============ CONSTRUCTOR ============
    constructor(uint64 _functionsSubscriptionId) 
        FunctionsClient(0xb83E47C2bC239B3bf370bc41e1459A34b41238D0) {
        i_functionsSubscriptionId = _functionsSubscriptionId;
    }
    
    function setCoreContract(address _coreContract) external {
        require(coreContract == address(0), "Core contract already set");
        coreContract = _coreContract;
    }
    
    // ============ SIMPLIFIED VERIFICATION ============
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
        
        string[] memory args = new string[](1);
        args[0] = _toString(invoiceId);
        req.setArgs(args);
        
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            i_functionsSubscriptionId,
            gasLimit,
            donID
        );
        
        functionsRequestToInvoice[s_lastRequestId] = invoiceId;
        
        emit DocumentVerificationRequested(invoiceId, s_lastRequestId);
        
        return s_lastRequestId;
    }
    
    // ============ TEST FUNCTION ============
    function testDirectRequest() external returns (bytes32) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(VERIFICATION_SOURCE);
        
        string[] memory args = new string[](1);
        args[0] = "999";
        req.setArgs(args);
        
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            i_functionsSubscriptionId,
            gasLimit,
            donID
        );
        
        functionsRequestToInvoice[s_lastRequestId] = 999;
        
        emit DocumentVerificationRequested(999, s_lastRequestId);
        
        return s_lastRequestId;
    }
    
    // ============ FULFILLMENT ============
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        s_lastResponse = response;
        s_lastError = err;
        
        emit FunctionsResponse(requestId, response, err);
        
        uint256 invoiceId = functionsRequestToInvoice[requestId];
        if (invoiceId == 0) return;
        
        isVerified[invoiceId] = true;
        verificationTimestamp[invoiceId] = block.timestamp;
        
        if (err.length == 0 && response.length > 0) {
            // Parse response
            string memory responseStr = string(response);
            
            if (_contains(bytes(responseStr), "\"isValid\":true")) {
                isValid[invoiceId] = true;
                riskScore[invoiceId] = 25;
                creditRating[invoiceId] = "A";
                verificationDetails[invoiceId] = "YieldX verification passed";
            } else {
                isValid[invoiceId] = false;
                riskScore[invoiceId] = 99;
                creditRating[invoiceId] = "ERROR";
                verificationDetails[invoiceId] = "YieldX verification failed";
            }
            
            emit DocumentVerificationCompleted(invoiceId, isValid[invoiceId], riskScore[invoiceId]);
            
            // Callback to core contract
            if (coreContract != address(0)) {
                try IIYieldXCore(coreContract).onDocumentVerificationComplete(
                    invoiceId, 
                    isValid[invoiceId], 
                    riskScore[invoiceId], 
                    creditRating[invoiceId]
                ) {
                    // Success
                } catch {
                    // Failed but continue
                }
            }
        } else {
            isValid[invoiceId] = false;
            riskScore[invoiceId] = 99;
            creditRating[invoiceId] = "ERROR";
            verificationDetails[invoiceId] = "Service error";
            
            emit DocumentVerificationCompleted(invoiceId, false, 99);
        }
    }
    
    // ============ HELPERS ============
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
        bool verified,
        bool valid,
        string memory details,
        uint256 risk,
        string memory rating,
        uint256 timestamp
    ) {
        return (
            isVerified[invoiceId],
            isValid[invoiceId],
            verificationDetails[invoiceId],
            riskScore[invoiceId],
            creditRating[invoiceId],
            verificationTimestamp[invoiceId]
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
            0xb83E47C2bC239B3bf370bc41e1459A34b41238D0,
            i_functionsSubscriptionId,
            gasLimit,
            donID
        );
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
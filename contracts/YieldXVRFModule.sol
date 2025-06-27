// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./YieldXRiskCalculator.sol";

interface IVRFCoordinatorV2 {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

/**
 * @title YieldXVRFModule
 * @notice Handles VRF requests and APR calculations
 */
contract YieldXVRFModule {
    
    // ============ STATE VARIABLES ============
    IVRFCoordinatorV2 public immutable i_vrfCoordinator;
    YieldXRiskCalculator public immutable riskCalculator;
    
    bytes32 public immutable i_keyHash;
    uint256 public immutable i_vrfSubscriptionId;
    
    address public coreContract;
    
    // VRF tracking
    mapping(uint256 => uint256) public vrfRequestToInvoice;
    mapping(uint256 => VRFData) public vrfData;
    
    // ============ STRUCTS ============
    struct VRFData {
        uint256 invoiceId;
        uint256 requestId;
        uint256 randomness;
        uint256 calculatedAPR;
        bool fulfilled;
        uint256 timestamp;
    }
    
    // ============ EVENTS ============
    event VRFRequested(uint256 indexed invoiceId, uint256 requestId);
    event VRFFulfilled(uint256 indexed invoiceId, uint256 randomness, uint256 finalAPR);
    event APRCalculated(uint256 indexed invoiceId, uint256 aprBasisPoints);
    
    // ============ MODIFIERS ============
    modifier onlyCoreContract() {
        require(msg.sender == coreContract, "Only core contract");
        _;
    }
    
    modifier onlyVRFCoordinator() {
        require(msg.sender == address(i_vrfCoordinator), "Only VRF Coordinator");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _vrfSubscriptionId,
        address _riskCalculator
    ) {
        i_vrfCoordinator = IVRFCoordinatorV2(_vrfCoordinator);
        i_keyHash = _keyHash;
        i_vrfSubscriptionId = _vrfSubscriptionId;
        riskCalculator = YieldXRiskCalculator(_riskCalculator);
    }
    
    function setCoreContract(address _coreContract) external {
        require(coreContract == address(0), "Core contract already set");
        coreContract = _coreContract;
    }
    
    // ============ VRF FUNCTIONS ============
    function requestRandomAPR(uint256 invoiceId) external onlyCoreContract returns (uint256) {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            uint64(i_vrfSubscriptionId),
            3, // minimumRequestConfirmations
            100000, // callbackGasLimit
            1 // numWords
        );
        
        vrfRequestToInvoice[requestId] = invoiceId;
        vrfData[invoiceId] = VRFData({
            invoiceId: invoiceId,
            requestId: requestId,
            randomness: 0,
            calculatedAPR: 0,
            fulfilled: false,
            timestamp: block.timestamp
        });
        
        emit VRFRequested(invoiceId, requestId);
        
        return requestId;
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external onlyVRFCoordinator {
        uint256 invoiceId = vrfRequestToInvoice[requestId];
        require(invoiceId != 0, "Invalid VRF request ID");
        
        VRFData storage vrf = vrfData[invoiceId];
        vrf.randomness = randomWords[0];
        vrf.fulfilled = true;
        
        emit VRFFulfilled(invoiceId, vrf.randomness, 0); // APR will be calculated separately
        
        // Notify core contract that VRF is complete
        IYieldXCore(coreContract).onVRFComplete(invoiceId, vrf.randomness);
    }
    
    function calculateFinalAPR(
        uint256 invoiceId,
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        uint256 amount,
        uint256 dueDate,
        uint256 riskScore
    ) external onlyCoreContract returns (uint256) {
        VRFData storage vrf = vrfData[invoiceId];
        require(vrf.fulfilled, "VRF not fulfilled");
        
        // Calculate APR using risk calculator with VRF randomness
        uint256 aprBasisPoints = riskCalculator.calculateAPR(
            commodity,
            supplierCountry,
            buyerCountry,
            amount,
            dueDate,
            vrf.randomness
        );
        
        // Adjust APR based on verification risk score
        aprBasisPoints = _adjustAPRForRisk(aprBasisPoints, riskScore);
        
        vrf.calculatedAPR = aprBasisPoints;
        
        emit APRCalculated(invoiceId, aprBasisPoints);
        
        return aprBasisPoints;
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
    
    function calculateAPREstimate(uint256 riskScore, uint256 dueDate) external view returns (uint256) {
        uint256 timeToMaturity = dueDate - block.timestamp;
        uint256 monthsToMaturity = timeToMaturity / 30 days;
        
        // Base APR: 5% + (risk_score * 0.1%) + time premium
        uint256 baseAPR = 500; // 5% in basis points
        uint256 riskPremium = riskScore * 10; // 0.1% per risk point
        uint256 timePremium = monthsToMaturity * 20; // 0.2% per month
        
        return baseAPR + riskPremium + timePremium;
    }
    
    // ============ VIEW FUNCTIONS ============
    function getVRFData(uint256 invoiceId) external view returns (
        uint256 requestId,
        uint256 randomness,
        uint256 calculatedAPR,
        bool fulfilled,
        uint256 timestamp
    ) {
        VRFData memory vrf = vrfData[invoiceId];
        return (
            vrf.requestId,
            vrf.randomness,
            vrf.calculatedAPR,
            vrf.fulfilled,
            vrf.timestamp
        );
    }
    
    function getVRFConfig() external view returns (
        address coordinator,
        bytes32 keyHash,
        uint256 subscriptionId
    ) {
        return (
            address(i_vrfCoordinator),
            i_keyHash,
            i_vrfSubscriptionId
        );
    }
    
    function isVRFFulfilled(uint256 invoiceId) external view returns (bool) {
        return vrfData[invoiceId].fulfilled;
    }
    
    function getRandomness(uint256 invoiceId) external view returns (uint256) {
        require(vrfData[invoiceId].fulfilled, "VRF not fulfilled");
        return vrfData[invoiceId].randomness;
    }
    
    function getCalculatedAPR(uint256 invoiceId) external view returns (uint256) {
        require(vrfData[invoiceId].calculatedAPR > 0, "APR not calculated");
        return vrfData[invoiceId].calculatedAPR;
    }
}

// Interface for core contract callback
interface IYieldXCore {
    function onVRFComplete(uint256 invoiceId, uint256 randomness) external;
}
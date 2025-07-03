// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MockUSDC.sol";

/**
 * @title YieldXInvestmentModule
 * @notice Handles investment management and fund distribution
 */
contract YieldXInvestmentModule {
    
    // ============ STATE VARIABLES ============
    MockUSDC public immutable usdcToken;
    address public coreContract;
    
    // Investment tracking
    mapping(uint256 => mapping(address => uint256)) public investments;
    mapping(uint256 => address[]) public invoiceInvestors;
    mapping(uint256 => uint256) public totalInvestments;
    mapping(address => uint256[]) public investorInvoices;
    
    // ============ EVENTS ============
    event InvestmentMade(uint256 indexed invoiceId, address indexed investor, uint256 amount, uint256 totalFunding);
    event InvestmentRefunded(uint256 indexed invoiceId, address indexed investor, uint256 amount);
    event ReturnsDistributed(uint256 indexed invoiceId, uint256 totalAmount, uint256 profit);
    
    // ============ MODIFIERS ============
    modifier onlyCoreContract() {
        require(msg.sender == coreContract, "Only core contract");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    constructor(address _usdcToken) {
        usdcToken = MockUSDC(_usdcToken);
    }
    
    function setCoreContract(address _coreContract) external {
        require(coreContract == address(0), "Core contract already set");
        coreContract = _coreContract;
    }
    
    // ============ INVESTMENT FUNCTIONS ============
    function makeInvestment(
    uint256 invoiceId,
    address investor,
    uint256 amount,
    uint256 targetFunding,
    uint256 currentFunding,
    address supplier
) external onlyCoreContract returns (uint256 newTotalFunding) {
    require(amount > 0, "Investment amount must be positive");
    require(currentFunding + amount <= targetFunding, "Exceeds target");
    require(investor != supplier, "Supplier cannot invest in own invoice");
    
   
    
    // Record investment (USDC already transferred by Core)
    if (investments[invoiceId][investor] == 0) {
        invoiceInvestors[invoiceId].push(investor);
        investorInvoices[investor].push(invoiceId);
    }
    
    investments[invoiceId][investor] += amount;
    totalInvestments[invoiceId] += amount;
    newTotalFunding = currentFunding + amount;
    
    emit InvestmentMade(invoiceId, investor, amount, newTotalFunding);
    
    return newTotalFunding;
}
    
    function transferFundsToSupplier(
        uint256 invoiceId,
        address supplier,
        uint256 amount
    ) external onlyCoreContract returns (bool) {
        require(amount > 0, "Amount must be positive");
        require(amount <= totalInvestments[invoiceId], "Insufficient funds");
        
        return usdcToken.transfer(supplier, amount);
    }
    
    function processRepayment(
        uint256 invoiceId,
        address buyer,
        uint256 repaymentAmount,
        uint256 principalAmount
    ) external onlyCoreContract returns (uint256 totalProfit) {
        require(repaymentAmount > 0, "Repayment amount must be positive");
        
        // Transfer repayment from buyer to this contract
        require(usdcToken.transferFrom(buyer, address(this), repaymentAmount), "Repayment failed");
        
        // Distribute returns to investors proportionally
        totalProfit = _distributeReturns(invoiceId, repaymentAmount, principalAmount);
        
        emit ReturnsDistributed(invoiceId, repaymentAmount, totalProfit);
        
        return totalProfit;
    }
    
    function refundInvestors(uint256 invoiceId) external onlyCoreContract {
        address[] memory investors = invoiceInvestors[invoiceId];
        
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investmentAmount = investments[invoiceId][investor];
            
            if (investmentAmount > 0) {
                require(usdcToken.transfer(investor, investmentAmount), "Refund failed");
                investments[invoiceId][investor] = 0;
                emit InvestmentRefunded(invoiceId, investor, investmentAmount);
            }
        }
        
        totalInvestments[invoiceId] = 0;
    }
    
    function _distributeReturns(
        uint256 invoiceId,
        uint256 totalRepayment,
        uint256 principalAmount
    ) internal returns (uint256) {
        address[] memory investors = invoiceInvestors[invoiceId];
        uint256 totalProfit = totalRepayment - principalAmount;
        
        for (uint i = 0; i < investors.length; i++) {
            address investor = investors[i];
            uint256 investmentAmount = investments[invoiceId][investor];
            
            if (investmentAmount > 0) {
                // Calculate proportional return
                uint256 returnAmount = (totalRepayment * investmentAmount) / principalAmount;
                
                // Transfer return to investor
                require(usdcToken.transfer(investor, returnAmount), "Return transfer failed");
                
                // Clear investment record
                investments[invoiceId][investor] = 0;
            }
        }
        
        return totalProfit;
    }
    
    // ============ VIEW FUNCTIONS ============
    function getInvestmentInfo(uint256 invoiceId) external view returns (
        uint256 totalInvestment,
        uint256 numInvestors,
        address[] memory investors
    ) {
        return (
            totalInvestments[invoiceId],
            invoiceInvestors[invoiceId].length,
            invoiceInvestors[invoiceId]
        );
    }
    
    function getInvestorData(address investor, uint256 invoiceId) external view returns (
        uint256 investmentAmount
    ) {
        return investments[invoiceId][investor];
    }
    
    function getInvestorInvoices(address investor) external view returns (uint256[] memory) {
        return investorInvoices[investor];
    }
    
    function calculateExpectedReturn(
        uint256 invoiceId,
        address investor,
        uint256 aprBasisPoints,
        uint256 timeElapsed
    ) external view returns (uint256 expectedReturn) {
        uint256 investmentAmount = investments[invoiceId][investor];
        
        if (investmentAmount > 0 && aprBasisPoints > 0) {
            uint256 annualReturn = (investmentAmount * aprBasisPoints) / 10000;
            expectedReturn = investmentAmount + (annualReturn * timeElapsed) / 365 days;
        }
        
        return expectedReturn;
    }
    
    function getTotalInvestmentStats() external view returns (
        uint256 totalInvestmentVolume,
        uint256 totalActiveInvestors
    ) {
        // This would need to be implemented with additional tracking
        // For now, return 0s to avoid complexity
        return (0, 0);
    }
    
    // ============ ADMIN FUNCTIONS ============
    function emergencyWithdraw(uint256 amount) external {
        require(msg.sender == coreContract, "Only core contract");
        require(usdcToken.transfer(msg.sender, amount), "Withdrawal failed");
    }
    
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
}

// Helper mappings that need to be accessible from core contract
contract InvestmentStorage {
    mapping(address => uint256[]) public investorInvoices;
    
    function addInvestorInvoice(address investor, uint256 invoiceId) external {
        investorInvoices[investor].push(invoiceId);
    }
}
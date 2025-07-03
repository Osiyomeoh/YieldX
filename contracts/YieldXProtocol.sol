// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./YieldXInvoiceNFT.sol";
import "./MockUSDC.sol";
import "./YieldXPriceManager.sol";
import "./YieldXVerificationModule.sol";
import "./YieldXInvestmentModule.sol";
import "./YieldXVRFModule.sol";

/**
 * @title YieldXCore - Fixed Investment Flow
 * @notice Main contract with working investment system
 */
contract YieldXCore {
    
    // ============ CORE CONTRACTS ============
    YieldXInvoiceNFT public immutable invoiceNFT;
    MockUSDC public immutable usdcToken;
    YieldXPriceManager public immutable priceManager;
    
    // ============ MODULES ============
    YieldXVerificationModule public immutable verificationModule;
    YieldXInvestmentModule public immutable investmentModule;
    YieldXVRFModule public immutable vrfModule;
    
    // ============ STATE VARIABLES ============
    address public owner;
    uint256 public invoiceCounter;
    bool public paused;
    
    // ============ STRUCTS ============
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
        InvoiceStatus status;
        uint256 createdAt;
        bool documentVerified;
        uint256 targetFunding;
        uint256 currentFunding;
    }
    
    enum InvoiceStatus { 
        Submitted,       // 0 - Just submitted
        Verifying,       // 1 - Under verification
        Verified,        // 2 - Verified, open for investment ✅
        FullyFunded,     // 3 - Investment target reached
        Approved,        // 4 - APR calculated, ready to fund
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
    event InvoiceVerified(uint256 indexed invoiceId, uint256 aprBasisPoints, uint256 riskScore);
    event InvestmentMade(uint256 indexed invoiceId, address indexed investor, uint256 amount, uint256 newTotal);
    event InvoiceFullyFunded(uint256 indexed invoiceId, uint256 totalAmount, uint256 numInvestors);
    event InvoiceApproved(uint256 indexed invoiceId, uint256 aprBasisPoints);
    event InvoiceFunded(uint256 indexed invoiceId, uint256 fundingAmount);
    event InvoiceRepaid(uint256 indexed invoiceId, uint256 repaymentAmount, uint256 profitDistributed);
    event InvoiceRejected(uint256 indexed invoiceId, string reason);
    
    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier validInvoice(uint256 invoiceId) {
        require(invoiceId > 0 && invoiceId <= invoiceCounter, "Invalid invoice");
        _;
    }
    
    modifier notPaused() {
        require(!paused, "Protocol is paused");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    constructor(
        address _invoiceNFT,
        address _usdcToken,
        address _priceManager,
        address _verificationModule,
        address _investmentModule,
        address _vrfModule
    ) {
        invoiceNFT = YieldXInvoiceNFT(_invoiceNFT);
        usdcToken = MockUSDC(_usdcToken);
        priceManager = YieldXPriceManager(_priceManager);
        verificationModule = YieldXVerificationModule(_verificationModule);
        investmentModule = YieldXInvestmentModule(_investmentModule);
        vrfModule = YieldXVRFModule(_vrfModule);
        owner = msg.sender;
    }
    
    function initializeProtocol() external onlyOwner {
        // Set this contract as the core contract for all modules
        verificationModule.setCoreContract(address(this));
        investmentModule.setCoreContract(address(this));
        vrfModule.setCoreContract(address(this));
        
        // Initialize NFT protocol  
        invoiceNFT.setProtocolAddress(address(this));
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
        
        // Create invoice in storage
        Invoice storage newInvoice = invoices[invoiceId];
        newInvoice.id = invoiceId;
        newInvoice.supplier = msg.sender;
        newInvoice.buyer = buyer;
        newInvoice.amount = amount;
        newInvoice.commodity = commodity;
        newInvoice.supplierCountry = supplierCountry;
        newInvoice.buyerCountry = buyerCountry;
        newInvoice.exporterName = exporterName;
        newInvoice.buyerName = buyerName;
        newInvoice.dueDate = dueDate;
        newInvoice.aprBasisPoints = 0;
        newInvoice.status = InvoiceStatus.Submitted;
        newInvoice.createdAt = block.timestamp;
        newInvoice.documentVerified = false;
        newInvoice.targetFunding = targetFunding;
        newInvoice.currentFunding = 0;
        
        supplierInvoices[msg.sender].push(invoiceId);
        
        emit InvoiceSubmitted(invoiceId, msg.sender, amount, targetFunding);
        
        // Start document verification through module
        newInvoice.status = InvoiceStatus.Verifying;
        verificationModule.startDocumentVerification(
            invoiceId,
            documentHash,
            commodity,
            amount,
            supplierCountry,
            buyerCountry,
            exporterName,
            buyerName
        );
        
        return invoiceId;
    }
    
    // ============ FIXED VERIFICATION CALLBACK ============
    function onDocumentVerificationComplete(
        uint256 invoiceId,
        bool isValid,
        uint256 riskScore,
        string memory creditRating
    ) external {
        require(msg.sender == address(verificationModule), "Only verification module");
        require(invoiceId > 0 && invoiceId <= invoiceCounter, "Invalid invoice ID");
        
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.Verifying, "Invoice not in verifying status");
        
        invoice.documentVerified = isValid;
        
        if (isValid) {
            // ✅ FIXED: Calculate APR immediately and set status to Verified
            // Calculate APR based on risk score (8-15% range)
            uint256 baseAPR = 800; // 8% in basis points
            uint256 riskPremium = (riskScore * 700) / 100; // Up to 7% additional based on risk
            invoice.aprBasisPoints = baseAPR + riskPremium;
            
            // Set status to verified - now available for investment
            invoice.status = InvoiceStatus.Verified;
            
            emit InvoiceVerified(invoiceId, invoice.aprBasisPoints, riskScore);
        } else {
            invoice.status = InvoiceStatus.Rejected;
            emit InvoiceRejected(invoiceId, "Failed document verification");
        }
    }
    
    // ============ FIXED INVESTMENT SYSTEM ============
    function investInInvoice(uint256 invoiceId, uint256 amount) external validInvoice(invoiceId) notPaused {
        Invoice storage invoice = invoices[invoiceId];
        
        // ✅ FIXED: Better validation and error messages
        require(invoice.status == InvoiceStatus.Verified, "Invoice must be verified for investment");
        require(amount > 0, "Investment amount must be positive");
        require(invoice.currentFunding + amount <= invoice.targetFunding, "Investment exceeds target funding");
        require(msg.sender != invoice.supplier, "Supplier cannot invest in own invoice");
        
        // ✅ FIXED: Check USDC allowance first
       uint256 allowance = usdcToken.allowance(msg.sender, address(this));
       require(allowance >= amount, "Insufficient USDC allowance for core contract");

       require(usdcToken.transferFrom(msg.sender, address(investmentModule), amount), "USDC transfer failed");
        
        // Process investment through module
        uint256 newTotalFunding = investmentModule.makeInvestment(
            invoiceId,
            msg.sender,
            amount,
            invoice.targetFunding,
            invoice.currentFunding,
            invoice.supplier
        );
        
        // Update invoice funding
        invoice.currentFunding = newTotalFunding;
        
        emit InvestmentMade(invoiceId, msg.sender, amount, newTotalFunding);
        
        // ✅ FIXED: Simplified fully funded logic
        if (invoice.currentFunding >= invoice.targetFunding) {
            invoice.status = InvoiceStatus.FullyFunded;
            
            (uint256 totalInvestment, uint256 numInvestors,) = investmentModule.getInvestmentInfo(invoiceId);
            emit InvoiceFullyFunded(invoiceId, totalInvestment, numInvestors);
            
            // ✅ FIXED: Directly fund without VRF complexity
            _fundInvoiceDirectly(invoiceId);
        }
    }
    
    // ✅ FIXED: Simplified funding without VRF dependency
    function _fundInvoiceDirectly(uint256 invoiceId) internal {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.FullyFunded, "Invoice not fully funded");
        
        uint256 fundingAmount = invoice.currentFunding;
        
        // Transfer funds through investment module
        require(
            investmentModule.transferFundsToSupplier(invoiceId, invoice.supplier, fundingAmount),
            "Transfer to supplier failed"
        );
        
        // Mint NFT to supplier
        invoiceNFT.mintToSupplier(
            invoice.supplier,
            invoiceId,
            invoice.commodity,
            invoice.amount,
            invoice.exporterName,
            invoice.buyerName,
            invoice.buyerCountry,
            invoice.dueDate,
            uint8(invoice.status),
            invoice.createdAt,
            0, // Risk score - can be retrieved from verification module
            invoice.aprBasisPoints
        );
        
        invoice.status = InvoiceStatus.Funded;
        emit InvoiceFunded(invoiceId, fundingAmount);
    }
    
    // ============ VRF CALLBACK (Optional) ============
    function onVRFComplete(uint256 invoiceId, uint256 randomness) external {
        require(msg.sender == address(vrfModule), "Only VRF module");
        // This is optional and doesn't affect the main investment flow
        // Can be used for additional randomness if needed
    }
    
    // ============ REPAYMENT ============
    function repayInvoice(uint256 invoiceId) external validInvoice(invoiceId) notPaused {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == InvoiceStatus.Funded, "Invoice not funded");
        require(msg.sender == invoice.buyer, "Only buyer can repay");
        
        // Calculate repayment amount with interest
        uint256 timeElapsed = block.timestamp - invoice.createdAt;
        uint256 annualInterest = (invoice.amount * invoice.aprBasisPoints) / 10000;
        uint256 interest = (annualInterest * timeElapsed) / 365 days;
        uint256 repaymentAmount = invoice.amount + interest;
        
        // Process repayment through investment module
        uint256 totalProfit = investmentModule.processRepayment(
            invoiceId,
            msg.sender,
            repaymentAmount,
            invoice.currentFunding
        );
        
        invoice.status = InvoiceStatus.Repaid;
        emit InvoiceRepaid(invoiceId, repaymentAmount, totalProfit);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getInvoiceBasics(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 id,
        address supplier,
        uint256 amount,
        InvoiceStatus status
    ) {
        Invoice memory invoice = invoices[invoiceId];
        return (invoice.id, invoice.supplier, invoice.amount, invoice.status);
    }
    
    function getInvoiceParties(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        address buyer,
        string memory exporterName,
        string memory buyerName,
        string memory commodity
    ) {
        Invoice memory invoice = invoices[invoiceId];
        return (invoice.buyer, invoice.exporterName, invoice.buyerName, invoice.commodity);
    }
    
    function getInvoiceLocations(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        string memory supplierCountry,
        string memory buyerCountry
    ) {
        Invoice memory invoice = invoices[invoiceId];
        return (invoice.supplierCountry, invoice.buyerCountry);
    }
    
    function getInvoiceFinancials(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 targetFunding,
        uint256 currentFunding,
        uint256 aprBasisPoints,
        uint256 dueDate
    ) {
        Invoice memory invoice = invoices[invoiceId];
        return (invoice.targetFunding, invoice.currentFunding, invoice.aprBasisPoints, invoice.dueDate);
    }
    
    function getInvoiceMetadata(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 createdAt,
        bool documentVerified,
        uint256 remainingFunding
    ) {
        Invoice memory invoice = invoices[invoiceId];
        return (
            invoice.createdAt, 
            invoice.documentVerified, 
            invoice.targetFunding - invoice.currentFunding
        );
    }
    
    function getInvestmentBasics(uint256 invoiceId) external view validInvoice(invoiceId) returns (
        uint256 targetFunding,
        uint256 currentFunding,
        uint256 remainingFunding,
        uint256 numInvestors
    ) {
        Invoice memory invoice = invoices[invoiceId];
        (,uint256 numInvestors_,) = investmentModule.getInvestmentInfo(invoiceId);
        
        return (
            invoice.targetFunding,
            invoice.currentFunding,
            invoice.targetFunding - invoice.currentFunding,
            numInvestors_
        );
    }
    
    // ✅ FIXED: Only return verified invoices with APR > 0
    function getInvestmentOpportunities() external view returns (uint256[] memory) {
        uint256[] memory opportunities = new uint256[](invoiceCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            Invoice memory invoice = invoices[i];
            if (invoice.status == InvoiceStatus.Verified && 
                invoice.aprBasisPoints > 0 && 
                invoice.currentFunding < invoice.targetFunding) {
                opportunities[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = opportunities[i];
        }
        
        return result;
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
        uint256 fundedInvoices
    ) {
        uint256 pending = 0;
        uint256 verified = 0;
        uint256 funded = 0;
        uint256 totalRaised = 0;
        
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
        }
        
        return (invoiceCounter, totalRaised, pending, verified, funded);
    }
    
    // ============ SIMPLE GETTERS ============
    function getInvoiceStatus(uint256 invoiceId) external view validInvoice(invoiceId) returns (InvoiceStatus) {
        return invoices[invoiceId].status;
    }
    
    function getInvoiceAmount(uint256 invoiceId) external view validInvoice(invoiceId) returns (uint256) {
        return invoices[invoiceId].amount;
    }
    
    function getInvoiceSupplier(uint256 invoiceId) external view validInvoice(invoiceId) returns (address) {
        return invoices[invoiceId].supplier;
    }
    
    function getInvoiceBuyer(uint256 invoiceId) external view validInvoice(invoiceId) returns (address) {
        return invoices[invoiceId].buyer;
    }
    
    function getInvoiceCommodity(uint256 invoiceId) external view validInvoice(invoiceId) returns (string memory) {
        return invoices[invoiceId].commodity;
    }
    
    function isInvoiceVerified(uint256 invoiceId) external view validInvoice(invoiceId) returns (bool) {
        return invoices[invoiceId].documentVerified;
    }
    
    // ============ MODULE ACCESS FUNCTIONS ============
    function getVerificationModule() external view returns (address) {
        return address(verificationModule);
    }
    
    function getInvestmentModule() external view returns (address) {
        return address(investmentModule);
    }
    
    function getVRFModule() external view returns (address) {
        return address(vrfModule);
    }
    
    // ============ CONVENIENCE FUNCTIONS ============
    function getAllInvoices() external view returns (uint256[] memory) {
        uint256[] memory allInvoices = new uint256[](invoiceCounter);
        for (uint256 i = 1; i <= invoiceCounter; i++) {
            allInvoices[i - 1] = i;
        }
        return allInvoices;
    }
    
    function getSupplierInvoices(address supplier) external view returns (uint256[] memory) {
        return supplierInvoices[supplier];
    }
    
    function getInvestorInvoices(address investor) external view returns (uint256[] memory) {
        return investmentModule.getInvestorInvoices(investor);
    }
    
    function getInvestorData(address investor, uint256 invoiceId) external view validInvoice(invoiceId) returns (uint256) {
        return investmentModule.getInvestorData(investor, invoiceId);
    }
    
    // ============ ADMIN FUNCTIONS ============
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
            investmentModule.refundInvestors(invoiceId);
            invoice.currentFunding = 0;
        }
        
        emit InvoiceRejected(invoiceId, reason);
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
    
    // ============ VERSION & INFO ============
    function version() external pure returns (string memory) {
        return "YieldXCore v4.2.0 - Fixed Investment Flow";
    }
    
    function getContractInfo() external view returns (
        string memory name,
        string memory version_,
        address owner_,
        bool paused_,
        uint256 totalInvoices
    ) {
        return (
            "YieldX Protocol - Fixed Investment",
            this.version(),
            owner,
            paused,
            invoiceCounter
        );
    }
}
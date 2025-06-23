// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IChainlinkFallbackContract {
    function getFallbackCommodityPrice(string memory commodity) external view returns (uint256);
    function getFallbackCountryRisk(string memory country) external view returns (uint256);
    function generatePseudoRandomness(uint256 seed) external view returns (uint256);
}

interface IPriceManager {
    function calculateMarketVolatility() external view returns (uint256);
    function getLatestPrices() external view returns (int256, int256, int256, int256, uint256);
}

contract YieldXRiskCalculator {
    IChainlinkFallbackContract public fallbackContract;
    IPriceManager public priceManager;
    
    uint256 public constant BASE_APR = 800; // 8.00%
    uint256 public constant MAX_RISK_APR = 1000; // 10.00%
    
    address public owner;
    
    constructor(address _fallbackContract, address _priceManager) {
        fallbackContract = IChainlinkFallbackContract(_fallbackContract);
        priceManager = IPriceManager(_priceManager);
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    function calculateAPR(
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        uint256 amount,
        uint256 dueDate,
        uint256 vrfRandomness
    ) external view returns (uint256) {
        // Base APR
        uint256 totalAPR = BASE_APR;
        
        // Commodity Risk (0-300 basis points)
        uint256 commodityRisk = _calculateCommodityRisk(commodity);
        totalAPR += commodityRisk;
        
        // Country Risk (0-500 basis points)
        uint256 countryRisk = _calculateCountryRisk(supplierCountry, buyerCountry);
        totalAPR += countryRisk;
        
        // Market Volatility Risk (0-200 basis points)
        uint256 marketRisk = _calculateMarketRisk();
        totalAPR += marketRisk;
        
        // VRF Random Risk (0-1000 basis points)
        uint256 randomRisk = _calculateVRFRisk(vrfRandomness);
        totalAPR += randomRisk;
        
        // Amount Risk (0-100 basis points)
        uint256 amountRisk = _calculateAmountRisk(amount);
        totalAPR += amountRisk;
        
        // Duration Risk (0-200 basis points)
        uint256 durationRisk = _calculateDurationRisk(dueDate);
        totalAPR += durationRisk;
        
        return totalAPR;
    }
    
    function _calculateCommodityRisk(string memory commodity) internal view returns (uint256) {
        uint256 commodityPrice = fallbackContract.getFallbackCommodityPrice(commodity);
        
        // Higher volatility commodities = higher risk
        if (_stringContains(commodity, "oil") || _stringContains(commodity, "gas")) {
            return 250; // 2.5% - Energy commodities
        } else if (_stringContains(commodity, "gold") || _stringContains(commodity, "silver")) {
            return 150; // 1.5% - Precious metals
        } else if (_stringContains(commodity, "wheat") || _stringContains(commodity, "corn")) {
            return 200; // 2.0% - Agricultural
        } else if (_stringContains(commodity, "coffee") || _stringContains(commodity, "cocoa")) {
            return 180; // 1.8% - Soft commodities
        } else {
            return 100; // 1.0% - Default
        }
    }
    
    function _calculateCountryRisk(string memory supplierCountry, string memory buyerCountry) internal view returns (uint256) {
        uint256 supplierRisk = fallbackContract.getFallbackCountryRisk(supplierCountry);
        uint256 buyerRisk = fallbackContract.getFallbackCountryRisk(buyerCountry);
        
        // Average the risks and scale to basis points
        return (supplierRisk + buyerRisk) / 2;
    }
    
    function _calculateMarketRisk() internal view returns (uint256) {
        uint256 volatility = priceManager.calculateMarketVolatility();
        
        // Scale volatility to 0-200 basis points
        if (volatility > 20) return 200; // 2.0% max
        return volatility * 10; // Convert to basis points
    }
    
    function _calculateVRFRisk(uint256 vrfRandomness) internal pure returns (uint256) {
        if (vrfRandomness == 0) {
            // Use fallback randomness
            return 500; // 5.0% default random risk
        }
        
        // Scale VRF randomness (0-999) to 0-1000 basis points
        return (vrfRandomness % 1000);
    }
    
    function _calculateAmountRisk(uint256 amount) internal pure returns (uint256) {
        // Larger amounts = lower risk (economies of scale)
        if (amount >= 100000 * 10**6) return 25; // $100k+ = 0.25%
        if (amount >= 50000 * 10**6) return 50;  // $50k+ = 0.5%
        if (amount >= 10000 * 10**6) return 75;  // $10k+ = 0.75%
        return 100; // <$10k = 1.0%
    }
    
    function _calculateDurationRisk(uint256 dueDate) internal view returns (uint256) {
        uint256 duration = dueDate > block.timestamp ? dueDate - block.timestamp : 0;
        uint256 durationDays = duration / 86400; // Convert to days
        
        // Longer duration = higher risk
        if (durationDays <= 30) return 50;   // 0.5% for ≤30 days
        if (durationDays <= 60) return 100;  // 1.0% for ≤60 days
        if (durationDays <= 90) return 150;  // 1.5% for ≤90 days
        return 200; // 2.0% for >90 days
    }
    
    function _stringContains(string memory str, string memory substr) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory substrBytes = bytes(substr);
        
        if (substrBytes.length > strBytes.length) return false;
        
        for (uint256 i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
    
    function updatePriceManager(address _priceManager) external onlyOwner {
        priceManager = IPriceManager(_priceManager);
    }
    
    function updateFallbackContract(address _fallbackContract) external onlyOwner {
        fallbackContract = IChainlinkFallbackContract(_fallbackContract);
    }
}
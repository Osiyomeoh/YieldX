// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChainlinkFallbackContract {
    // Events
    event ChainlinkFallbackTriggered(uint256 indexed invoiceId, string service, string reason);
    event FallbackDataUsed(uint256 indexed invoiceId, string dataType, uint256 value);
    
    // 📊 GET FALLBACK COMMODITY PRICE
    function getFallbackCommodityPrice(string memory commodity) external pure returns (uint256) {
        // Agricultural commodities (USD per kg)
        if (stringContains(commodity, "Coffee") || stringContains(commodity, "coffee")) {
            return 8500; // $8.50/kg
        }
        if (stringContains(commodity, "Cocoa") || stringContains(commodity, "cocoa")) {
            return 4200; // $4.20/kg
        }
        if (stringContains(commodity, "Tea") || stringContains(commodity, "tea")) {
            return 15000; // $15/kg
        }
        if (stringContains(commodity, "Cotton") || stringContains(commodity, "cotton")) {
            return 1800; // $1.80/kg
        }
        if (stringContains(commodity, "Rice") || stringContains(commodity, "rice")) {
            return 1200; // $1.20/kg
        }
        if (stringContains(commodity, "Wheat") || stringContains(commodity, "wheat")) {
            return 800; // $0.80/kg
        }
        
        // Precious metals (USD per gram)
        if (stringContains(commodity, "Gold") || stringContains(commodity, "gold")) {
            return 65000; // $65/gram
        }
        if (stringContains(commodity, "Silver") || stringContains(commodity, "silver")) {
            return 800; // $0.80/gram
        }
        
        // Energy commodities
        if (stringContains(commodity, "Oil") || stringContains(commodity, "oil")) {
            return 800; // ~$0.80/kg
        }
        
        // Spices
        if (stringContains(commodity, "Vanilla") || stringContains(commodity, "vanilla")) {
            return 500000; // $500/kg
        }
        if (stringContains(commodity, "Saffron") || stringContains(commodity, "saffron")) {
            return 5000000; // $5,000/kg
        }
        
        return 5000; // Default $5/kg
    }
    
    // 🌍 GET FALLBACK COUNTRY RISK
    function getFallbackCountryRisk(string memory country) external pure returns (uint256) {
        // Very Low Risk (100-175 bps)
        if (stringContains(country, "Singapore") || 
            stringContains(country, "Switzerland") ||
            stringContains(country, "Norway") ||
            stringContains(country, "Denmark")) {
            return 125;
        }
        
        // Low Risk (175-250 bps)
        if (stringContains(country, "Germany") || 
            stringContains(country, "Japan") ||
            stringContains(country, "Canada") ||
            stringContains(country, "Australia") ||
            stringContains(country, "United States")) {
            return 200;
        }
        
        // Medium Risk (350-450 bps)
        if (stringContains(country, "China") || 
            stringContains(country, "India") ||
            stringContains(country, "Brazil") ||
            stringContains(country, "Mexico")) {
            return 400;
        }
        
        // Medium-High Risk (450-550 bps)
        if (stringContains(country, "Kenya") || 
            stringContains(country, "Ghana") ||
            stringContains(country, "Rwanda") ||
            stringContains(country, "Uganda")) {
            return 500;
        }
        
        // High Risk (550-650 bps)
        if (stringContains(country, "Nigeria") || 
            stringContains(country, "Ethiopia") ||
            stringContains(country, "Tanzania")) {
            return 600;
        }
        
        // Very High Risk (650+ bps)
        if (stringContains(country, "Venezuela") || 
            stringContains(country, "Zimbabwe")) {
            return 750;
        }
        
        return 450; // Default medium-high risk
    }
    
    // 🎲 GENERATE PSEUDO RANDOMNESS
    function generatePseudoRandomness(
        uint256 invoiceId,
        address sender,
        string memory commodity,
        string memory country
    ) external view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            sender,
            invoiceId,
            commodity,
            country
        ))) % 1000;
    }
    
    // 📈 GET FALLBACK MARKET RISK
    function getFallbackMarketRisk(uint256 deploymentTime) external view returns (uint256) {
        if (deploymentTime == 0) return 200; // Safe default
        
        uint256 daysSinceDeployment = (block.timestamp - deploymentTime) / 86400;
        uint256 cyclePosition = daysSinceDeployment % 365;
        
        if (cyclePosition < 90) return 150;      // Q1: Bull market
        else if (cyclePosition < 180) return 200; // Q2: Peak
        else if (cyclePosition < 270) return 300; // Q3: Bear market
        else return 100;                         // Q4: Recovery
    }
    
    // 🔗 STRING UTILITIES
    function stringContains(string memory str, string memory substr) public pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory substrBytes = bytes(substr);
        if (substrBytes.length > strBytes.length) return false;
        
        for (uint i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
    
    function stringContainsOrAll(string memory list, string memory item) external pure returns (bool) {
        return stringContains(list, "All") || stringContains(list, item);
    }
}
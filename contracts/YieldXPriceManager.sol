// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract YieldXPriceManager{
    // Chainlink Price Feeds
    AggregatorV3Interface public ethUsdFeed;
    AggregatorV3Interface public usdcUsdFeed;
    AggregatorV3Interface public btcUsdFeed;
    AggregatorV3Interface public linkUsdFeed;
    
    // Price State
    int256 public lastETHPrice = 3200 * 10**8;   // $3,200 default
    int256 public lastUSDCPrice = 100000000;     // $1.00 default
    int256 public lastBTCPrice = 65000 * 10**8;  // $65,000 default
    int256 public lastLINKPrice = 25 * 10**8;    // $25 default
    uint256 public lastMarketUpdate;
    bool public initialPricesFetched = false;
    
    address public owner;
    
    event PricesUpdated(int256 ethPrice, int256 usdcPrice, int256 btcPrice, int256 linkPrice);
    event PriceFeedError(string feed, string error);
    
    constructor(
        address _ethUsdFeed,
        address _usdcUsdFeed,
        address _btcUsdFeed,
        address _linkUsdFeed
    ) {
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        usdcUsdFeed = AggregatorV3Interface(_usdcUsdFeed);
        btcUsdFeed = AggregatorV3Interface(_btcUsdFeed);
        linkUsdFeed = AggregatorV3Interface(_linkUsdFeed);
        owner = msg.sender;
        lastMarketUpdate = block.timestamp;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // ✅ WORKING UPDATE PATTERN - Based on your Remix success!
    function updateLivePrices() external {
        bool anySuccess = false;
        
        // Try updating ETH/USD (1 hour staleness)
        try ethUsdFeed.latestRoundData() returns (
            uint80, int256 price, uint256, uint256 updatedAt, uint80
        ) {
            if (price > 0 && block.timestamp - updatedAt < 3600) {
                lastETHPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("ETH/USD", reason);
        } catch {
            emit PriceFeedError("ETH/USD", "Unknown error");
        }
        
        // Try updating USDC/USD (1 hour staleness)
        try usdcUsdFeed.latestRoundData() returns (
            uint80, int256 price, uint256, uint256 updatedAt, uint80
        ) {
            if (price > 0 && block.timestamp - updatedAt < 3600) {
                lastUSDCPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("USDC/USD", reason);
        } catch {
            emit PriceFeedError("USDC/USD", "Unknown error");
        }
        
        // Try updating BTC/USD (1 hour staleness)
        try btcUsdFeed.latestRoundData() returns (
            uint80, int256 price, uint256, uint256 updatedAt, uint80
        ) {
            if (price > 0 && block.timestamp - updatedAt < 3600) {
                lastBTCPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("BTC/USD", reason);
        } catch {
            emit PriceFeedError("BTC/USD", "Unknown error");
        }
        
        // Try updating LINK/USD (1 hour staleness)
        try linkUsdFeed.latestRoundData() returns (
            uint80, int256 price, uint256, uint256 updatedAt, uint80
        ) {
            if (price > 0 && block.timestamp - updatedAt < 3600) {
                lastLINKPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("LINK/USD", reason);
        } catch {
            emit PriceFeedError("LINK/USD", "Unknown error");
        }
        
        if (anySuccess) {
            initialPricesFetched = true;
            lastMarketUpdate = block.timestamp;
            emit PricesUpdated(lastETHPrice, lastUSDCPrice, lastBTCPrice, lastLINKPrice);
        }
    }
    
    // ✅ FORCE UPDATE - No staleness check (for testing)
    function forceUpdateLivePrices() external {
        bool anySuccess = false;
        
        try ethUsdFeed.latestRoundData() returns (uint80, int256 price, uint256, uint256, uint80) {
            if (price > 0) {
                lastETHPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("ETH/USD", reason);
        } catch {
            emit PriceFeedError("ETH/USD", "Unknown error");
        }
        
        try usdcUsdFeed.latestRoundData() returns (uint80, int256 price, uint256, uint256, uint80) {
            if (price > 0) {
                lastUSDCPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("USDC/USD", reason);
        } catch {
            emit PriceFeedError("USDC/USD", "Unknown error");
        }
        
        try btcUsdFeed.latestRoundData() returns (uint80, int256 price, uint256, uint256, uint80) {
            if (price > 0) {
                lastBTCPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("BTC/USD", reason);
        } catch {
            emit PriceFeedError("BTC/USD", "Unknown error");
        }
        
        try linkUsdFeed.latestRoundData() returns (uint80, int256 price, uint256, uint256, uint80) {
            if (price > 0) {
                lastLINKPrice = price;
                anySuccess = true;
            }
        } catch Error(string memory reason) {
            emit PriceFeedError("LINK/USD", reason);
        } catch {
            emit PriceFeedError("LINK/USD", "Unknown error");
        }
        
        if (anySuccess) {
            initialPricesFetched = true;
            lastMarketUpdate = block.timestamp;
            emit PricesUpdated(lastETHPrice, lastUSDCPrice, lastBTCPrice, lastLINKPrice);
        }
    }
    
    // ✅ INDIVIDUAL FEED TESTING - Your proven debugging approach!
    function testEthFeed() external view returns (
        int256 price,
        uint256 updatedAt,
        bool isRecent,
        string memory status
    ) {
        try ethUsdFeed.latestRoundData() returns (
            uint80, int256 _price, uint256, uint256 _updatedAt, uint80
        ) {
            price = _price;
            updatedAt = _updatedAt;
            isRecent = block.timestamp - _updatedAt < 3600;
            status = isRecent ? "Fresh data" : "Stale data";
        } catch {
            status = "Feed error";
        }
    }
    
    function testUsdcFeed() external view returns (
        int256 price,
        uint256 updatedAt,
        bool isRecent,
        string memory status
    ) {
        try usdcUsdFeed.latestRoundData() returns (
            uint80, int256 _price, uint256, uint256 _updatedAt, uint80
        ) {
            price = _price;
            updatedAt = _updatedAt;
            isRecent = block.timestamp - _updatedAt < 3600;
            status = isRecent ? "Fresh data" : "Stale data";
        } catch {
            status = "Feed error";
        }
    }
    
    function testBtcFeed() external view returns (
        int256 price,
        uint256 updatedAt,
        bool isRecent,
        string memory status
    ) {
        try btcUsdFeed.latestRoundData() returns (
            uint80, int256 _price, uint256, uint256 _updatedAt, uint80
        ) {
            price = _price;
            updatedAt = _updatedAt;
            isRecent = block.timestamp - _updatedAt < 3600;
            status = isRecent ? "Fresh data" : "Stale data";
        } catch {
            status = "Feed error";
        }
    }
    
    function testLinkFeed() external view returns (
        int256 price,
        uint256 updatedAt,
        bool isRecent,
        string memory status
    ) {
        try linkUsdFeed.latestRoundData() returns (
            uint80, int256 _price, uint256, uint256 _updatedAt, uint80
        ) {
            price = _price;
            updatedAt = _updatedAt;
            isRecent = block.timestamp - _updatedAt < 3600;
            status = isRecent ? "Fresh data" : "Stale data";
        } catch {
            status = "Feed error";
        }
    }
    
    // Standard interface functions
    function getLatestPrices() external view returns (
        int256 ethPrice,
        int256 usdcPrice,
        int256 btcPrice,
        int256 linkPrice,
        uint256 lastUpdate
    ) {
        return (lastETHPrice, lastUSDCPrice, lastBTCPrice, lastLINKPrice, lastMarketUpdate);
    }
    
    function calculateMarketVolatility() public view returns (uint256) {
        uint256 ethVol = uint256(lastETHPrice > 3000 * 10**8 ? lastETHPrice - 3000 * 10**8 : 3000 * 10**8 - lastETHPrice) * 100 / (3000 * 10**8);
        uint256 btcVol = uint256(lastBTCPrice > 60000 * 10**8 ? lastBTCPrice - 60000 * 10**8 : 60000 * 10**8 - lastBTCPrice) * 100 / (60000 * 10**8);
        
        return (ethVol + btcVol) / 2;
    }
    
    function getFormattedPrices() external view returns (
        string memory ethFormatted,
        string memory usdcFormatted,
        string memory btcFormatted,
        string memory linkFormatted
    ) {
        return (
            _formatPrice(lastETHPrice, "ETH"),
            _formatPrice(lastUSDCPrice, "USDC"),
            _formatPrice(lastBTCPrice, "BTC"),
            _formatPrice(lastLINKPrice, "LINK")
        );
    }
    
    function _formatPrice(int256 price, string memory symbol) internal pure returns (string memory) {
        uint256 dollars = uint256(price) / 10**8;
        uint256 cents = (uint256(price) % 10**8) / 10**6;
        
        return string(abi.encodePacked(
            symbol, ": $",
            _toString(dollars),
            ".",
            _toString(cents)
        ));
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
    
    function getMarketConditions() external view returns (
        uint256 volatility,
        bool pricesStale,
        uint256 lastUpdateAge
    ) {
        return (
            calculateMarketVolatility(),
            (block.timestamp - lastMarketUpdate) > 3600,
            block.timestamp - lastMarketUpdate
        );
    }
    
    // Manual override for testing
    function setTestPrices(
        int256 _ethPrice,
        int256 _usdcPrice,
        int256 _btcPrice,
        int256 _linkPrice
    ) external onlyOwner {
        lastETHPrice = _ethPrice;
        lastUSDCPrice = _usdcPrice;
        lastBTCPrice = _btcPrice;
        lastLINKPrice = _linkPrice;
        lastMarketUpdate = block.timestamp;
        initialPricesFetched = true;
        
        emit PricesUpdated(lastETHPrice, lastUSDCPrice, lastBTCPrice, lastLINKPrice);
    }
}
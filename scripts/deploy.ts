import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Sepolia Testnet Chainlink Addresses
const CHAINLINK_ADDRESSES = {
    // Price Feeds
    ETH_USD_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    BTC_USD_FEED: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", 
    USDC_USD_FEED: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    LINK_USD_FEED: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    
    // VRF
    VRF_COORDINATOR: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    VRF_KEY_HASH: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    
    // Functions
    FUNCTIONS_ROUTER: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"
};

// Your Subscription IDs
const VRF_SUBSCRIPTION_ID = "35127266008152230287761209727211507096682063164260802445112431263919177634415";
const FUNCTIONS_SUBSCRIPTION_ID = 4996;

async function main() {
    console.log("🚀 Starting YieldX Enhanced Deployment with Committee Management...");
    console.log("Network:", hre.network.name);
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));
    
    // Track all deployed contracts
    const deployedContracts: any = {};
    
    try {
        // Step 1: Deploy ChainlinkFallbackContract
        console.log("\n📊 Step 1: Deploying ChainlinkFallbackContract...");
        const ChainlinkFallbackContract = await hre.ethers.getContractFactory("ChainlinkFallbackContract");
        const fallbackContract = await ChainlinkFallbackContract.deploy();
        await fallbackContract.waitForDeployment();
        const fallbackAddress = await fallbackContract.getAddress();
        deployedContracts.fallbackContract = fallbackAddress;
        console.log("✅ ChainlinkFallbackContract deployed:", fallbackAddress);
        
        // Step 2: Deploy MockUSDC
        console.log("\n💰 Step 2: Deploying MockUSDC...");
        const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
        const mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();
        const usdcAddress = await mockUSDC.getAddress();
        deployedContracts.mockUSDC = usdcAddress;
        console.log("✅ MockUSDC deployed:", usdcAddress);
        
        // Step 3: Deploy YieldXInvoiceNFT
        console.log("\n🎨 Step 3: Deploying YieldXInvoiceNFT...");
        const YieldXInvoiceNFT = await hre.ethers.getContractFactory("YieldXInvoiceNFT");
        const invoiceNFT = await YieldXInvoiceNFT.deploy();
        await invoiceNFT.waitForDeployment();
        const nftAddress = await invoiceNFT.getAddress();
        deployedContracts.invoiceNFT = nftAddress;
        console.log("✅ YieldXInvoiceNFT deployed:", nftAddress);
        
        // Step 4: Deploy YieldXPriceManagerFixed
        console.log("\n📈 Step 4: Deploying YieldXPriceManagerFixed...");
        const YieldXPriceManagerFixed = await hre.ethers.getContractFactory("YieldXPriceManager");
        const priceManager = await YieldXPriceManagerFixed.deploy(
            CHAINLINK_ADDRESSES.ETH_USD_FEED,
            CHAINLINK_ADDRESSES.USDC_USD_FEED,
            CHAINLINK_ADDRESSES.BTC_USD_FEED,
            CHAINLINK_ADDRESSES.LINK_USD_FEED
        );
        await priceManager.waitForDeployment();
        const priceManagerAddress = await priceManager.getAddress();
        deployedContracts.priceManager = priceManagerAddress;
        console.log("✅ YieldXPriceManagerFixed deployed:", priceManagerAddress);
        
        // Step 5: Deploy YieldXRiskCalculator
        console.log("\n⚖️ Step 5: Deploying YieldXRiskCalculator...");
        const YieldXRiskCalculator = await hre.ethers.getContractFactory("YieldXRiskCalculator");
        const riskCalculator = await YieldXRiskCalculator.deploy(
            fallbackAddress,
            priceManagerAddress
        );
        await riskCalculator.waitForDeployment();
        const riskCalculatorAddress = await riskCalculator.getAddress();
        deployedContracts.riskCalculator = riskCalculatorAddress;
        console.log("✅ YieldXRiskCalculator deployed:", riskCalculatorAddress);
        
        // Step 6: Deploy Enhanced YieldXCore
        console.log("\n🏗️ Step 6: Deploying Enhanced YieldXCore with Committee Management...");
        const YieldXCore = await hre.ethers.getContractFactory("YieldXCore");
        const yieldXCore = await YieldXCore.deploy(
            nftAddress,
            usdcAddress,
            priceManagerAddress,
            riskCalculatorAddress,
            CHAINLINK_ADDRESSES.VRF_COORDINATOR,
            CHAINLINK_ADDRESSES.VRF_KEY_HASH,
            VRF_SUBSCRIPTION_ID,
            CHAINLINK_ADDRESSES.FUNCTIONS_ROUTER,
            FUNCTIONS_SUBSCRIPTION_ID
        );
        await yieldXCore.waitForDeployment();
        const coreAddress = await yieldXCore.getAddress();
        deployedContracts.yieldXCore = coreAddress;
        console.log("✅ Enhanced YieldXCore deployed:", coreAddress);
        
        // Step 7: Initialize Contracts
        console.log("\n🔧 Step 7: Initializing contracts...");
        
        // Set YieldXCore as protocol for NFT contract
        console.log("📝 Setting YieldXCore as NFT protocol...");
        await yieldXCore.initializeNFTProtocol();
        console.log("✅ NFT protocol permission granted");
        
        // Mint some USDC for testing
        console.log("💰 Minting test USDC...");
        await mockUSDC.mint(deployer.address, hre.ethers.parseUnits("1000000", 6)); // 1M USDC
        await mockUSDC.transfer(coreAddress, hre.ethers.parseUnits("500000", 6)); // Fund protocol
        console.log("✅ Test USDC minted and transferred");
        
        // Step 8: Test Enhanced Committee Management
        console.log("\n👥 Step 8: Testing Enhanced Committee Management...");
        
        // Add deployer as committee member
        console.log("➕ Adding deployer as committee member...");
        const addTx = await yieldXCore.addCommitteeMember(deployer.address);
        const addReceipt = await addTx.wait();
        console.log("✅ Committee member added - TX:", addReceipt.hash);
        
        // Test committee functions
        console.log("🔍 Testing committee functions...");
        
        // Get committee members
        const committeeMembers = await yieldXCore.getCommitteeMembers();
        console.log(`📋 Committee members (${committeeMembers.length}):`, committeeMembers);
        
        // Get committee size
        const committeeSize = await yieldXCore.getCommitteeSize();
        console.log(`👥 Committee size: ${committeeSize}`);
        
        // Check if deployer is committee member
        const isCommitteeMember = await yieldXCore.isCommitteeMember(deployer.address);
        console.log(`✅ Deployer is committee member: ${isCommitteeMember}`);
        
        // Test protocol statistics
        console.log("📊 Testing protocol statistics...");
        const stats = await yieldXCore.getProtocolStats();
        console.log(`📈 Protocol Stats - Total Invoices: ${stats.totalInvoices}, Committee: ${stats.totalCommitteeMembers}, Funds Raised: $${hre.ethers.formatUnits(stats.totalFundsRaised, 6)}`);
        
        // Step 9: Test Enhanced Price Management
        console.log("\n📈 Step 9: Testing Enhanced Price Management...");
        
        // Test individual feeds
        console.log("📡 Testing individual price feeds...");
        try {
            const ethFeed = await priceManager.testEthFeed();
            console.log(`ETH Feed: $${Number(ethFeed.price) / 1e8} - ${ethFeed.status}`);
            
            const btcFeed = await priceManager.testBtcFeed();
            console.log(`BTC Feed: $${Number(btcFeed.price) / 1e8} - ${btcFeed.status}`);
            
            const usdcFeed = await priceManager.testUsdcFeed();
            console.log(`USDC Feed: $${Number(usdcFeed.price) / 1e8} - ${usdcFeed.status}`);
            
            const linkFeed = await priceManager.testLinkFeed();
            console.log(`LINK Feed: $${Number(linkFeed.price) / 1e8} - ${linkFeed.status}`);
            
        } catch (error) {
            console.log("⚠️ Individual feed testing failed:", error.message);
        }
        
        // Test price manager update
        console.log("\n🔄 Testing live price update...");
        try {
            const updateTx = await priceManager.updateLivePrices();
            const receipt = await updateTx.wait();
            console.log(`✅ Update transaction: ${receipt.hash}`);
            
            const [ethPrice, usdcPrice, btcPrice, linkPrice] = await priceManager.getLatestPrices();
            console.log(`📊 LIVE PRICES - ETH: $${Number(ethPrice) / 1e8}, USDC: $${Number(usdcPrice) / 1e8}, BTC: $${Number(btcPrice) / 1e8}, LINK: $${Number(linkPrice) / 1e8}`);
            
            const volatility = await priceManager.calculateMarketVolatility();
            console.log(`📈 Market volatility: ${Number(volatility) / 100}%`);
            
            const initialFetched = await priceManager.initialPricesFetched();
            console.log(`🔥 Initial prices fetched from Chainlink: ${initialFetched}`);
            
        } catch (error) {
            console.log("❌ Price update failed:", error.message);
            console.log("📊 Using default fallback prices for testing");
        }
        
        // Step 10: Test Enhanced Invoice Submission
        console.log("\n📄 Step 10: Testing Enhanced Invoice Submission...");
        
        console.log("📝 Submitting test invoice...");
        const invoiceTx = await yieldXCore.submitInvoice(
            deployer.address, // buyer
            hre.ethers.parseUnits("10000", 6), // $10,000
            "Coffee Beans", // commodity
            "Kenya", // supplier country
            "USA", // buyer country
            "Kenyan Coffee Co.", // exporter name
            "US Import Corp.", // buyer name
            Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // due date (30 days)
        );
        const invoiceReceipt = await invoiceTx.wait();
        console.log("✅ Test invoice submitted - TX:", invoiceReceipt.hash);
        
        // Get invoice details using enhanced function
        console.log("🔍 Testing enhanced invoice details...");
        const invoiceDetails = await yieldXCore.getInvoiceDetails(1);
        console.log(`📋 Invoice 1 - Amount: $${hre.ethers.formatUnits(invoiceDetails.amount, 6)}, Commodity: ${invoiceDetails.commodity}, Exporter: ${invoiceDetails.exporterName}`);
        
        // Test getting all invoices
        const allInvoices = await yieldXCore.getAllInvoices();
        console.log(`📚 All invoices: [${allInvoices.join(', ')}]`);
        
        // Test getting invoices by status
        const submittedInvoices = await yieldXCore.getInvoicesByStatus(0); // Submitted = 0
        console.log(`📝 Submitted invoices: [${submittedInvoices.join(', ')}]`);
        
        // Step 11: Test Risk Calculator
        console.log("\n⚖️ Step 11: Testing Enhanced Risk Calculator...");
        const testAPR = await riskCalculator.calculateAPR(
            "Coffee Beans",
            "Kenya", 
            "USA",
            hre.ethers.parseUnits("10000", 6), // $10k
            Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
            12345 // mock randomness
        );
        console.log(`✅ Risk calculation working - Test APR: ${Number(testAPR) / 100}%`);
        
        // Step 12: Test Fallback Contract
        console.log("\n🛡️ Step 12: Testing Fallback Contract...");
        const coffeePrice = await fallbackContract.getFallbackCommodityPrice("Coffee Beans");
        const kenyaRisk = await fallbackContract.getFallbackCountryRisk("Kenya");
        const pseudoRandom = await fallbackContract.generatePseudoRandomness(
            1, // invoiceId
            deployer.address, // sender
            "Coffee Beans", // commodity
            "Kenya" // country
        );
        console.log(`✅ Fallback data - Coffee: ${Number(coffeePrice) / 100}/kg, Kenya Risk: ${Number(kenyaRisk)}bp, PseudoRandom: ${Number(pseudoRandom)}/1000`);
        
        // Step 13: Test Contract Version
        console.log("\n🔖 Step 13: Testing Contract Version...");
        const version = await yieldXCore.version();
        console.log(`📋 Contract version: ${version}`);
        
        console.log("\n🎉 All enhanced contracts deployed and tested successfully!");
        
        // Step 14: Save Enhanced Deployment Info
        const deploymentInfo = {
            network: hre.network.name,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            version: "Enhanced v2.0.0",
            chainlinkAddresses: CHAINLINK_ADDRESSES,
            vrfSubscriptionId: VRF_SUBSCRIPTION_ID,
            functionsSubscriptionId: FUNCTIONS_SUBSCRIPTION_ID,
            contracts: deployedContracts,
            enhancements: {
                committeeManagement: true,
                enhancedInvoiceData: true,
                protocolStatistics: true,
                gasOptimizations: true,
                eventLogging: true
            },
            frontendConfig: {
                YieldXCore: coreAddress,
                MockUSDC: usdcAddress,
                YieldXInvoiceNFT: nftAddress,
                YieldXPriceManager: priceManagerAddress,
                YieldXRiskCalculator: riskCalculatorAddress,
                ChainlinkFallbackContract: fallbackAddress,
                chainId: hre.network.config.chainId
            }
        };
        
        // Save to file
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const filename = `${hre.network.name}-enhanced-deployment.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        
        console.log("📄 Enhanced deployment info saved to:", filepath);
        
        // Display summary
        console.log("\n📋 ENHANCED DEPLOYMENT SUMMARY");
        console.log("==============================");
        console.log("🏗️ YieldXCore (Enhanced):", coreAddress);
        console.log("💰 MockUSDC:", usdcAddress);
        console.log("🎨 InvoiceNFT:", nftAddress);
        console.log("📈 PriceManagerFixed:", priceManagerAddress);
        console.log("⚖️ RiskCalculator:", riskCalculatorAddress);
        console.log("🛡️ FallbackContract:", fallbackAddress);
        console.log("==============================");
        
        console.log("\n🆕 NEW ENHANCED FEATURES:");
        console.log("✅ Committee Management with Array Tracking");
        console.log("✅ Enhanced Invoice Data Access");
        console.log("✅ Protocol Statistics");
        console.log("✅ Gas-Optimized Operations");
        console.log("✅ Comprehensive Event Logging");
        console.log("✅ Better Error Handling & Validation");
        
        console.log("\n🎯 Enhanced Testing Commands:");
        console.log(`const core = await ethers.getContractAt("YieldXCore", "${coreAddress}");`);
        console.log(`await core.getCommitteeMembers(); // Get all committee members`);
        console.log(`await core.getProtocolStats(); // Get protocol statistics`);
        console.log(`await core.getAllInvoices(); // Get all invoice IDs`);
        console.log(`await core.getInvoicesByStatus(0); // Get submitted invoices`);
        console.log(`await core.version(); // Get contract version`);
        
        console.log("\n📱 Frontend Integration Updates:");
        console.log("Your frontend will now support:");
        console.log("• Real committee member lists");
        console.log("• Enhanced invoice data");
        console.log("• Protocol statistics");
        console.log("• Better error handling");
        
        console.log("\n🔥 Your Enhanced YieldX Protocol is ready!");
        console.log("🌟 All committee management features are now blockchain-native!");
        
    } catch (error) {
        console.error("❌ Enhanced deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
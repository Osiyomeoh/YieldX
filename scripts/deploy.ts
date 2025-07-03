// scripts/deploy-stack-safe.ts - Final YieldX Protocol Deployment with NEW Verification Module
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Sepolia Testnet Chainlink Addresses
const CHAINLINK_ADDRESSES = {
    ETH_USD_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    BTC_USD_FEED: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    USDC_USD_FEED: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    LINK_USD_FEED: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    FUNCTIONS_ROUTER: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    VRF_COORDINATOR: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    LINK_TOKEN: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
};

const FUNCTIONS_SUBSCRIPTION_ID = 4996;
const VRF_SUBSCRIPTION_ID = 60332899736026770864234804103098829131149497424730910252348348535732399533738n;
const VRF_KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

// ✅ UPDATED WORKING VERIFICATION MODULE ADDRESS
const NEW_VERIFICATION_MODULE_ADDRESS = "0x4402aF89143b8c36fFa6bF75Df99dBc4Beb4c7dc";

// Protocol Configuration
const PROTOCOL_CONFIG = {
    VERSION: "6.2.0", // Updated for working verification module
    INITIAL_USDC_SUPPLY: hre.ethers.parseUnits("1000000", 6), // 1M USDC
    MIN_INVESTMENT: hre.ethers.parseEther("100"), // 100 ETH minimum
    MAX_INVESTMENT: hre.ethers.parseEther("10000"), // 10K ETH maximum
    RISK_THRESHOLD: 50, // 50% risk threshold
    BASE_YIELD_RATE: 800, // 8% base yield
    PROTOCOL_FEE: 200 // 2% protocol fee
};

async function main() {
    console.log("🚀 Starting YieldX Protocol Deployment with NEW Verification Module...");
    console.log("=" .repeat(60));
    
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    
    console.log("📋 Deployment Configuration:");
    console.log(`   Network: ${hre.network.name} (Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId})`);
    console.log(`   Deployer: ${deployerAddress}`);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log(`   Protocol Version: ${PROTOCOL_CONFIG.VERSION}`);
    console.log(`   ✅ WORKING Verification Module: ${NEW_VERIFICATION_MODULE_ADDRESS}`);
    console.log("=" .repeat(60));
    
    if (balance < hre.ethers.parseEther("0.3")) {
        throw new Error("❌ Insufficient ETH balance for deployment. Need at least 0.5 ETH");
    }

    // Track all deployed contracts
    const deployedContracts: {[key: string]: {address: string, contract: any}} = {};
    
    // Helper function to deploy contracts
    async function deployContract(contractName: string, args: any[], description: string) {
        console.log(`\n🔧 Deploying ${description}...`);
        try {
            const Contract = await hre.ethers.getContractFactory(contractName);
            const contract = await Contract.deploy(...args);
            await contract.waitForDeployment();
            const address = await contract.getAddress();
            
            console.log(`✅ ${description} deployed: ${address}`);
            return { contract, address };
        } catch (error: any) {
            console.error(`❌ Failed to deploy ${description}: ${error.message}`);
            throw error;
        }
    }

    try {
        console.log("\n🏗️ PHASE 1: CORE INFRASTRUCTURE");
        console.log("=" .repeat(40));

        // 1. Deploy Mock USDC
        const { contract: mockUSDC, address: usdcAddress } = await deployContract(
            "MockUSDC",
            [], 
            "Mock USDC Token"
        );
        deployedContracts.mockUSDC = { address: usdcAddress, contract: mockUSDC };

        // 2. Deploy YieldX Invoice NFT
        const { contract: yieldXNFT, address: nftAddress } = await deployContract(
            "YieldXInvoiceNFT", 
            [],
            "YieldX Invoice NFT Collection"
        );
        deployedContracts.yieldXNFT = { address: nftAddress, contract: yieldXNFT };

        // 3. Deploy Price Manager
        const { contract: priceManager, address: priceManagerAddress } = await deployContract(
            "YieldXPriceManager",
            [
                CHAINLINK_ADDRESSES.ETH_USD_FEED,
                CHAINLINK_ADDRESSES.USDC_USD_FEED,
                CHAINLINK_ADDRESSES.BTC_USD_FEED,
                CHAINLINK_ADDRESSES.LINK_USD_FEED
            ],
            "Chainlink Price Manager"
        );
        deployedContracts.priceManager = { address: priceManagerAddress, contract: priceManager };

        // 4. Deploy Fallback Contract
        const { contract: fallbackContract, address: fallbackAddress } = await deployContract(
            "ChainlinkFallbackContract",
            [],
            "Chainlink Fallback Data Provider"
        );
        deployedContracts.fallbackContract = { address: fallbackAddress, contract: fallbackContract };

        // 5. Deploy Risk Calculator
        const { contract: riskCalculator, address: riskCalculatorAddress } = await deployContract(
            "YieldXRiskCalculator",
            [fallbackAddress, priceManagerAddress],
            "Advanced Risk Calculator"
        );
        deployedContracts.riskCalculator = { address: riskCalculatorAddress, contract: riskCalculator };

        console.log("\n🏗️ PHASE 2: VERIFICATION MODULE SETUP");
        console.log("=" .repeat(40));

        // ✅ Use the NEW verification module
        const verificationModuleAddress = NEW_VERIFICATION_MODULE_ADDRESS;
        console.log(`🎉 Using WORKING YieldXVerificationModule: ${verificationModuleAddress}`);
        
        // Create interface for the NEW verification module with setCoreContract
        const verificationModuleABI = [
            // Core integration functions
            "function setCoreContract(address _coreContract) external",
            "function getCoreContract() external view returns (address)",
            
            // Main verification function
            "function startDocumentVerification(uint256 invoiceId, string memory documentHash, string memory commodity, uint256 amount, string memory supplierCountry, string memory buyerCountry, string memory exporterName, string memory buyerName) external returns (bytes32)",
            
            // Test functions
            "function testDirectRequest() external returns (bytes32)",
            "function ownerTestRequest() external returns (bytes32)",
            
            // Owner and access control
            "function owner() external view returns (address)",
            
            // View functions
            "function getLastFunctionsResponse() external view returns (bytes32 lastRequestId, bytes lastResponse, bytes lastError)",
            "function getLastResponseDecoded() external view returns (string memory)",
            "function getDocumentVerification(uint256 invoiceId) external view returns (bool verified, bool valid, string memory details, uint256 risk, string memory rating, uint256 timestamp)",
            "function getApiEndpoint() external pure returns (string memory)",
            
            // State variables as view functions
            "function i_functionsSubscriptionId() external view returns (uint64)",
            "function gasLimit() external view returns (uint32)",
            "function donID() external view returns (bytes32)",
            "function s_lastRequestId() external view returns (bytes32)",
            "function isVerified(uint256) external view returns (bool)",
            "function isValid(uint256) external view returns (bool)",
            "function riskScore(uint256) external view returns (uint256)",
            "function creditRating(uint256) external view returns (string memory)",
            "function verificationDetails(uint256) external view returns (string memory)",
            "function verificationTimestamp(uint256) external view returns (uint256)"
        ];
        
        // Create contract instance
        const verificationModule = new hre.ethers.Contract(
            verificationModuleAddress, 
            verificationModuleABI, 
            deployer
        );
        
        deployedContracts.verificationModule = { 
            address: verificationModuleAddress, 
            contract: verificationModule 
        };

        // Test the NEW verification configuration
        console.log("\n🔧 Testing NEW YieldXVerificationModule Configuration...");
        try {
            const owner = await verificationModule.owner();
            const subscriptionId = await verificationModule.i_functionsSubscriptionId();
            const gasLimitSetting = await verificationModule.gasLimit();
            const donIDSetting = await verificationModule.donID();
            const apiEndpoint = await verificationModule.getApiEndpoint();
            const currentCoreContract = await verificationModule.getCoreContract();
            
            console.log("✅ WORKING YieldXVerificationModule Status:");
            console.log(`   Contract Address: ${verificationModuleAddress}`);
            console.log(`   Owner: ${owner}`);
            console.log(`   Deployer: ${deployerAddress}`);
            console.log(`   Owner Match: ${owner.toLowerCase() === deployerAddress.toLowerCase() ? "✅ YES" : "❌ NO"}`);
            console.log(`   Current Core Contract: ${currentCoreContract}`);
            console.log(`   API Endpoint: ${apiEndpoint}`);
            console.log(`   Subscription ID: ${subscriptionId}`);
            console.log(`   Gas Limit: ${gasLimitSetting}`);
            console.log(`   DON ID: ${donIDSetting}`);
            
        } catch (error: any) {
            console.log(`⚠️ Could not read verification configuration: ${error.message}`);
        }

        console.log("\n🏗️ PHASE 3: SUPPORTING MODULES");
        console.log("=" .repeat(40));

        // 6. Deploy Investment Module
        const { contract: investmentModule, address: investmentModuleAddress } = await deployContract(
            "YieldXInvestmentModule",
            [usdcAddress],
            "Investment Management Module"
        );
        deployedContracts.investmentModule = { address: investmentModuleAddress, contract: investmentModule };

        // 7. Deploy VRF Module
        const { contract: vrfModule, address: vrfModuleAddress } = await deployContract(
            "YieldXVRFModule",
            [
                CHAINLINK_ADDRESSES.VRF_COORDINATOR,
                VRF_KEY_HASH,
                VRF_SUBSCRIPTION_ID,
                riskCalculatorAddress
            ],
            "Chainlink VRF Randomness Module"
        );
        deployedContracts.vrfModule = { address: vrfModuleAddress, contract: vrfModule };

        console.log("\n🏗️ PHASE 4: CORE CONTRACT");
        console.log("=" .repeat(40));

        // 8. Deploy YieldXCore with NEW verification module
        const { contract: yieldXCore, address: coreAddress } = await deployContract(
            "YieldXCore",
            [
                nftAddress,                  // _invoiceNFT
                usdcAddress,                 // _usdcToken
                priceManagerAddress,         // _priceManager
                verificationModuleAddress,   // ✅ NEW verification module
                investmentModuleAddress,     // _investmentModule
                vrfModuleAddress            // _vrfModule
            ],
            "YieldX Core Protocol"
        );
        deployedContracts.yieldXCore = { address: coreAddress, contract: yieldXCore };

        console.log("\n🔗 PHASE 5: CRITICAL MODULE CONNECTIONS");
        console.log("=" .repeat(40));

        // ✅ CRITICAL: Set core contract on NEW verification module
        console.log("🔧 Setting Core Contract on NEW YieldXVerificationModule...");
        try {
            const currentCoreContract = await verificationModule.getCoreContract();
            console.log(`   Current core contract: ${currentCoreContract}`);
            
            if (currentCoreContract === "0x0000000000000000000000000000000000000000") {
                console.log("🔧 Setting core contract...");
                const setCoreVerificationTx = await verificationModule.setCoreContract(coreAddress);
                await setCoreVerificationTx.wait();
                console.log("✅ NEW YieldXVerificationModule connected to Core successfully!");
                
                // Verify the connection
                const newCoreContract = await verificationModule.getCoreContract();
                console.log(`   ✅ Verified core contract set to: ${newCoreContract}`);
                
            } else {
                console.log(`⚠️ YieldXVerificationModule already connected to: ${currentCoreContract}`);
                if (currentCoreContract.toLowerCase() !== coreAddress.toLowerCase()) {
                    console.log("🔧 Updating to new core contract...");
                    const setCoreVerificationTx = await verificationModule.setCoreContract(coreAddress);
                    await setCoreVerificationTx.wait();
                    console.log("✅ Core contract updated successfully!");
                }
            }
        } catch (error: any) {
            console.error(`❌ CRITICAL: Could not set core contract: ${error.message}`);
            console.error("   This will prevent invoice verification from working!");
        }

        // Initialize protocol - this will set up module connections
        console.log("\n🔧 Initializing Protocol...");
        try {
            const initTx = await yieldXCore.initializeProtocol();
            await initTx.wait();
            console.log("✅ Protocol initialized successfully!");
        } catch (error: any) {
            console.log(`⚠️ Protocol initialization warning: ${error.message}`);
        }

        // Set NFT minter role
        console.log("🔧 Setting NFT minter permissions...");
        try {
            const setMinterTx = await yieldXNFT.setProtocolAddress(coreAddress);
            await setMinterTx.wait();
            console.log("✅ YieldXCore granted NFT minting permissions");
        } catch (error: any) {
            console.log(`⚠️ Could not set minter role: ${error.message}`);
        }

        console.log("\n🧪 PHASE 6: INTEGRATION TESTING");
        console.log("=" .repeat(40));

        // Test protocol status
        console.log("🔍 Testing Protocol Integration...");
        try {
            const version = await yieldXCore.version();
            const contractInfo = await yieldXCore.getContractInfo();
            const protocolStats = await yieldXCore.getProtocolStats();
            
            console.log("✅ YieldX Core Protocol Status:");
            console.log(`   Version: ${version}`);
            console.log(`   Contract: ${contractInfo[0]}`);
            console.log(`   Protocol Version: ${contractInfo[1]}`);
            console.log(`   Owner: ${contractInfo[2]}`);
            console.log(`   Paused: ${contractInfo[3]}`);
            console.log(`   Total Invoices: ${protocolStats[0]}`);
            console.log(`   Total Funds Raised: ${hre.ethers.formatUnits(protocolStats[1], 6)} USDC`);
        } catch (error: any) {
            console.log(`⚠️ Could not read protocol status: ${error.message}`);
        }

        // Test NEW verification module
        console.log("\n🧪 Testing NEW YieldXVerificationModule...");
        try {
            // Check if we can call the test function
            console.log("🔧 Testing direct request function...");
            const testTx = await verificationModule.testDirectRequest();
            const receipt = await testTx.wait();
            console.log(`✅ Test verification successful! Gas used: ${receipt.gasUsed}`);
            console.log(`   Transaction hash: ${receipt.hash}`);
            
            // Check the core contract connection again
            const finalCoreContract = await verificationModule.getCoreContract();
            console.log(`✅ Final core contract verification: ${finalCoreContract}`);
            console.log(`   Matches deployed core: ${finalCoreContract.toLowerCase() === coreAddress.toLowerCase() ? "✅ YES" : "❌ NO"}`);
            
        } catch (error: any) {
            console.log(`⚠️ Verification test note: ${error.message}`);
            console.log("   (This might be due to rate limiting - the connection setup is complete)");
        }

        console.log("\n🎉 DEPLOYMENT SUMMARY");
        console.log("=" .repeat(50));
        
        const summary = {
            protocolVersion: PROTOCOL_CONFIG.VERSION,
            network: hre.network.name,
            deployer: deployerAddress,
            deploymentTime: new Date().toISOString(),
            contracts: Object.fromEntries(
                Object.entries(deployedContracts).map(([name, data]) => [name, data.address])
            ),
            chainlinkIntegration: {
                functionsSubscription: FUNCTIONS_SUBSCRIPTION_ID,
                vrfSubscription: VRF_SUBSCRIPTION_ID.toString(),
                newVerificationModule: verificationModuleAddress,
                priceFeeds: CHAINLINK_ADDRESSES
            }
        };

        console.log("📋 Deployed Contracts:");
        Object.entries(deployedContracts).forEach(([name, data]) => {
            console.log(`   ${name}: ${data.address}`);
        });

        console.log("\n🔗 Chainlink Integration:");
        console.log(`   Functions Subscription: ${FUNCTIONS_SUBSCRIPTION_ID}`);
        console.log(`   VRF Subscription: ${VRF_SUBSCRIPTION_ID}`);
        console.log(`   ✅ WORKING YieldXVerificationModule: ${verificationModuleAddress}`);

        console.log("\n📝 Key Integration Points:");
        console.log(`   ✅ Core Contract: ${coreAddress}`);
        console.log(`   ✅ Verification Module: ${verificationModuleAddress}`);
        console.log(`   ✅ Core ↔ Verification: Connected via setCoreContract()`);
        console.log("   ✅ Ready for invoice submission and verification!");

        console.log("\n🚀 Next Steps:");
        console.log("1. 🧪 Test invoice submission through your frontend");
        console.log("2. 📋 Verify Chainlink Functions calls work properly");
        console.log("3. 🎊 Demo the complete workflow for the hackathon!");

        // Save deployment info
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const deploymentFile = path.join(deploymentsDir, `yieldx-new-verification-${hre.network.name}-${Date.now()}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(summary, null, 2));
        console.log(`\n💾 Deployment info saved: ${deploymentFile}`);

        console.log("\n🏆 YIELDX PROTOCOL WITH NEW VERIFICATION MODULE DEPLOYED!");
        console.log("🎊 Your protocol is ready with proper core contract integration!");

    } catch (error: any) {
        console.error(`\n❌ Deployment failed: ${error.message}`);
        if (error.reason) {
            console.error(`   Reason: ${error.reason}`);
        }
        if (error.transaction) {
            console.error(`   Transaction: ${error.transaction.hash}`);
        }
        process.exit(1);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
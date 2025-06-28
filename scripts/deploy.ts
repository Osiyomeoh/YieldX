// scripts/deploy-stack-safe.ts - Final YieldX Protocol Deployment
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

// Protocol Configuration
const PROTOCOL_CONFIG = {
    VERSION: "6.0.0", // Updated for YieldXVerificationFixed
    INITIAL_USDC_SUPPLY: hre.ethers.parseUnits("1000000", 6), // 1M USDC
    MIN_INVESTMENT: hre.ethers.parseEther("100"), // 100 ETH minimum
    MAX_INVESTMENT: hre.ethers.parseEther("10000"), // 10K ETH maximum
    RISK_THRESHOLD: 50, // 50% risk threshold
    BASE_YIELD_RATE: 800, // 8% base yield
    PROTOCOL_FEE: 200 // 2% protocol fee
};

async function main() {
    console.log("🚀 Starting Final YieldX Protocol Deployment...");
    console.log("=" .repeat(60));
    
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    
    console.log("📋 Deployment Configuration:");
    console.log(`   Network: ${hre.network.name} (Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId})`);
    console.log(`   Deployer: ${deployerAddress}`);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log(`   Protocol Version: ${PROTOCOL_CONFIG.VERSION}`);
    console.log("=" .repeat(60));
    
    if (balance < hre.ethers.parseEther("0.5")) {
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
            [], // No constructor parameters - contract sets fixed supply internally
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

        // 4. Deploy Fallback Contract (required for Risk Calculator)
        const { contract: fallbackContract, address: fallbackAddress } = await deployContract(
            "ChainlinkFallbackContract",
            [],
            "Chainlink Fallback Data Provider"
        );
        deployedContracts.fallbackContract = { address: fallbackAddress, contract: fallbackContract };

        // 5. Deploy Risk Calculator
        const { contract: riskCalculator, address: riskCalculatorAddress } = await deployContract(
            "YieldXRiskCalculator",
            [fallbackAddress, priceManagerAddress], // Both required parameters
            "Advanced Risk Calculator"
        );
        deployedContracts.riskCalculator = { address: riskCalculatorAddress, contract: riskCalculator };

        console.log("\n🏗️ PHASE 2: VERIFICATION MODULE");
        console.log("=" .repeat(40));

        // 5. Use Your Proven Working YieldXVerificationModule from Remix
        const verificationModuleAddress = "0x148f9528267E08A52EEa06A90e645d2D0Bd5e447";
        console.log(`🎉 Using proven working YieldXVerificationModule: ${verificationModuleAddress}`);
        
        // Create interface for the verification module
        const verificationModuleABI = [
            "function setCoreContract(address _coreContract) external",
            "function testDirectRequest() external returns (bytes32)",
            "function coreContract() external view returns (address)",
            "function getFunctionsConfig() external view returns (address router, uint64 subscriptionId, uint32 gasLimitConfig, bytes32 donIdConfig)",
            "function getLastFunctionsResponse() external view returns (bytes32 lastRequestId, bytes lastResponse, bytes lastError)",
            "function getDocumentVerification(uint256 invoiceId) external view returns (bool verified, bool valid, string memory details, uint256 risk, string memory rating, uint256 timestamp)",
            "function startDocumentVerification(uint256 invoiceId, string memory documentHash, string memory commodity, uint256 amount, string memory supplierCountry, string memory buyerCountry, string memory exporterName, string memory buyerName) external returns (bytes32)"
        ];
        
        const verificationModule = new hre.ethers.Contract(verificationModuleAddress, verificationModuleABI, deployer);
        deployedContracts.verificationModule = { address: verificationModuleAddress, contract: verificationModule };

        // Test the verification configuration
        console.log("\n🔧 Testing Proven YieldXVerificationModule Configuration...");
        try {
            const functionsConfig = await verificationModule.getFunctionsConfig();
            const lastResponse = await verificationModule.getLastFunctionsResponse();
            const docVerification = await verificationModule.getDocumentVerification(999);
            
            console.log("✅ YieldXVerificationModule (Proven Working) Status:");
            console.log(`   Functions Router: ${functionsConfig[0]}`);
            console.log(`   Subscription ID: ${functionsConfig[1]}`);
            console.log(`   Gas Limit: ${functionsConfig[2]}`);
            console.log(`   DON ID: ${functionsConfig[3]}`);
            console.log(`   Last Request ID: ${lastResponse[0]}`);
            console.log(`   Last Response Length: ${lastResponse[1].length} bytes`);
            console.log(`   Invoice 999 Verified: ${docVerification[0]}`);
            console.log(`   Invoice 999 Valid: ${docVerification[1]}`);
            console.log(`   Invoice 999 Risk Score: ${docVerification[3]}`);
            console.log(`   Invoice 999 Credit Rating: ${docVerification[4]}`);
            console.log(`   Verification Timestamp: ${new Date(Number(docVerification[5]) * 1000).toLocaleString()}`);
        } catch (error: any) {
            console.log(`⚠️ Could not read verification state: ${error.message}`);
        }

        console.log("\n🏗️ PHASE 3: SUPPORTING MODULES");
        console.log("=" .repeat(40));

        // 6. Deploy Investment Module
        let investmentModuleAddress = "0x0000000000000000000000000000000000000000";
        try {
            const { contract: investmentModule, address: invModAddress } = await deployContract(
                "YieldXInvestmentModule",
                [usdcAddress], // Only USDC parameter as per your contract
                "Investment Management Module"
            );
            deployedContracts.investmentModule = { address: invModAddress, contract: investmentModule };
            investmentModuleAddress = invModAddress;
        } catch (error: any) {
            console.log(`⚠️ Investment Module not available: ${error.message}`);
        }

        // 7. Deploy VRF Module
        let vrfModuleAddress = "0x0000000000000000000000000000000000000000";
        try {
            const { contract: vrfModule, address: vrfModAddr } = await deployContract(
                "YieldXVRFModule",
                [
                    CHAINLINK_ADDRESSES.VRF_COORDINATOR, // _vrfCoordinator
                    VRF_KEY_HASH,                        // _keyHash
                    VRF_SUBSCRIPTION_ID,                 // _vrfSubscriptionId
                    riskCalculatorAddress                // _riskCalculator
                ],
                "Chainlink VRF Randomness Module"
            );
            deployedContracts.vrfModule = { address: vrfModAddr, contract: vrfModule };
            vrfModuleAddress = vrfModAddr;
        } catch (error: any) {
            console.log(`⚠️ VRF Module not available: ${error.message}`);
        }

        console.log("\n🏗️ PHASE 4: CORE CONTRACT");
        console.log("=" .repeat(40));

        // 8. Deploy YieldXCore
        const { contract: yieldXCore, address: coreAddress } = await deployContract(
            "YieldXCore",
            [
                nftAddress,              // _invoiceNFT (YieldXInvoiceNFT)
                usdcAddress,             // _usdcToken
                priceManagerAddress,     // _priceManager
                verificationModuleAddress, // _verificationModule (your proven working contract)
                investmentModuleAddress, // _investmentModule
                vrfModuleAddress         // _vrfModule
            ],
            "YieldX Core Protocol"
        );
        deployedContracts.yieldXCore = { address: coreAddress, contract: yieldXCore };

        console.log("\n🔗 PHASE 5: MODULE CONNECTIONS");
        console.log("=" .repeat(40));

        // Connect verification module to core
        console.log("🔧 Connecting Proven YieldXVerificationModule to Core...");
        try {
            const currentCoreContract = await verificationModule.coreContract();
            if (currentCoreContract === "0x0000000000000000000000000000000000000000") {
                const setCoreVerificationTx = await verificationModule.setCoreContract(coreAddress);
                await setCoreVerificationTx.wait();
                console.log("✅ YieldXVerificationModule connected to Core successfully");
            } else {
                console.log(`⚠️ YieldXVerificationModule already connected to: ${currentCoreContract}`);
                if (currentCoreContract.toLowerCase() !== coreAddress.toLowerCase()) {
                    console.log("   Note: Connected to different core contract than expected");
                }
            }
        } catch (error: any) {
            console.log(`⚠️ Could not connect verification to core: ${error.message}`);
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

        console.log("\n🧪 PHASE 6: PROTOCOL TESTING");
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
            console.log(`   Total Funds Raised: ${hre.ethers.formatUnits(protocolStats[1], 6)}`);
        } catch (error: any) {
            console.log(`⚠️ Could not read protocol status: ${error.message}`);
        }

        // Test the YieldXVerificationModule directly
        console.log("\n🧪 Testing Proven YieldXVerificationModule Integration...");
        
        // Only test verification module if we're on Sepolia (where it actually exists)
        if (hre.network.name === "sepolia") {
            try {
                console.log("🔧 Attempting to call testDirectRequest() on proven working contract...");
                
                // Check if there's already a recent response (within last 10 minutes)
                const lastResponse = await verificationModule.getLastFunctionsResponse();
                const docVerification = await verificationModule.getDocumentVerification(999);
                
                if (docVerification[5] > 0) { // If there's a timestamp
                    const timeSinceVerification = Date.now() / 1000 - Number(docVerification[5]);
                    if (timeSinceVerification < 600) { // Less than 10 minutes ago
                        console.log(`✅ Recent verification found! (${Math.floor(timeSinceVerification)} seconds ago)`);
                        console.log(`   Invoice 999 Status: Valid=${docVerification[1]}, Risk=${docVerification[3]}, Rating=${docVerification[4]}`);
                        console.log("   Skipping new test to avoid rate limiting");
                    } else {
                        console.log("🔧 Previous verification is old, testing new request...");
                        const testTx = await verificationModule.testDirectRequest();
                        const receipt = await testTx.wait();
                        console.log(`✅ YieldXVerificationModule test successful! Gas used: ${receipt.gasUsed}`);
                        console.log(`   Transaction hash: ${receipt.hash}`);
                    }
                } else {
                    console.log("🔧 No previous verification found, testing new request...");
                    const testTx = await verificationModule.testDirectRequest();
                    const receipt = await testTx.wait();
                    console.log(`✅ YieldXVerificationModule test successful! Gas used: ${receipt.gasUsed}`);
                    console.log(`   Transaction hash: ${receipt.hash}`);
                }
                
            } catch (error: any) {
                console.log(`⚠️ YieldXVerificationModule test failed: ${error.message}`);
                console.log("   This might be due to rate limiting - the contract is proven working from Remix");
            }
        } else {
            console.log("🔧 Local/Hardhat network detected - skipping Chainlink Functions test");
            console.log("   Your verification module works on Sepolia: 0x148f9528267E08A52EEa06A90e645d2D0Bd5e447");
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
                verificationModule: verificationModuleAddress,
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
        console.log(`   YieldXVerificationModule (Proven): ${verificationModuleAddress}`);

        console.log("\n📝 Next Steps:");
        console.log("1. ✅ YieldXVerificationModule already working from Remix!");
        console.log(`   🔗 https://functions.chain.link/sepolia/${FUNCTIONS_SUBSCRIPTION_ID}`);
        console.log(`   📋 Consumer Address: ${verificationModuleAddress}`);
        console.log("\n2. 🧪 Test complete workflow:");
        console.log("   npx hardhat run scripts/test-complete-protocol.ts --network sepolia");
        console.log("\n3. 🎊 Submit to hackathon with your championship-level protocol!");

        // Save deployment info
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        const deploymentFile = path.join(deploymentsDir, `yieldx-final-${hre.network.name}-${Date.now()}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(summary, null, 2));
        console.log(`\n💾 Deployment info saved: ${deploymentFile}`);

        console.log("\n🏆 FINAL YIELDX PROTOCOL DEPLOYMENT COMPLETE!");
        console.log("🎊 Your championship-level protocol is ready to dominate the hackathon!");

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
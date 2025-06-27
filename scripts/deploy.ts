// scripts/deploy-stack-safe.ts - Deploys stack-safe YieldX Protocol
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Sepolia Testnet Chainlink Addresses
const CHAINLINK_ADDRESSES = {
    ETH_USD_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    BTC_USD_FEED: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", 
    USDC_USD_FEED: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    LINK_USD_FEED: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    VRF_COORDINATOR: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    VRF_KEY_HASH: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    FUNCTIONS_ROUTER: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"
};

// Your subscription IDs
const VRF_SUBSCRIPTION_ID = "35127266008152230287761209727211507096682063164260802445112431263919177634415";
const FUNCTIONS_SUBSCRIPTION_ID = 4996;

async function analyzeConstructor(contractName: string) {
    try {
        const factory = await hre.ethers.getContractFactory(contractName);
        const iface = factory.interface;
        const constructor = iface.fragments.find(f => f.type === 'constructor');
        
        if (constructor && 'inputs' in constructor) {
            console.log(`📋 ${contractName} Constructor Analysis:`);
            console.log(`   Parameters: ${constructor.inputs.length}`);
            constructor.inputs.forEach((input, index) => {
                console.log(`   ${index + 1}. ${input.name || `param${index + 1}`} (${input.type})`);
            });
            return constructor.inputs;
        }
        
        console.log(`📋 ${contractName}: No constructor parameters`);
        return [];
    } catch (error) {
        console.log(`❌ Contract ${contractName} not found: ${error.message}`);
        return null;
    }
}

async function deployContract(contractName: string, args: any[] = [], description: string = "") {
    console.log(`\n🏗️ Deploying ${contractName}${description ? ` (${description})` : ''}...`);
    
    const factory = await hre.ethers.getContractFactory(contractName);
    console.log(`📝 Deploying with ${args.length} arguments...`);
    
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`✅ ${contractName} deployed: ${address}`);
    
    return { contract, address };
}

async function main() {
    console.log("🚀 Starting Stack-Safe YieldX Protocol Deployment...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    const network = await hre.ethers.provider.getNetwork();
    
    console.log("📋 Deployment Configuration:");
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   Deployer: ${deployer.address}`);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    if (balance < hre.ethers.parseEther("0.2")) {
        console.log("⚠️  Warning: Low ETH balance for deployment");
    }
    
    const deployedContracts: any = {};
    
    try {
        console.log("\n" + "=".repeat(60));
        console.log("🏗️  PHASE 1: CORE INFRASTRUCTURE");
        console.log("=".repeat(60));

        // Step 1: Deploy MockUSDC
        const { contract: mockUSDC, address: usdcAddress } = await deployContract("MockUSDC", [], "Test USDC Token");
        deployedContracts.mockUSDC = usdcAddress;

        // Step 2: Deploy YieldXInvoiceNFT
        const { contract: invoiceNFT, address: nftAddress } = await deployContract("YieldXInvoiceNFT", [], "Invoice NFT Contract");
        deployedContracts.invoiceNFT = nftAddress;

        // Step 3: Deploy YieldXPriceManager
        const { contract: priceManager, address: priceManagerAddress } = await deployContract(
            "YieldXPriceManager",
            [
                CHAINLINK_ADDRESSES.ETH_USD_FEED,
                CHAINLINK_ADDRESSES.USDC_USD_FEED,
                CHAINLINK_ADDRESSES.BTC_USD_FEED,
                CHAINLINK_ADDRESSES.LINK_USD_FEED
            ],
            "Price Feeds Manager"
        );
        deployedContracts.priceManager = priceManagerAddress;

        // Step 4: Deploy ChainlinkFallbackContract first (required for YieldXRiskCalculator)
        console.log("\n🛡️ Step 4: Deploying ChainlinkFallbackContract...");
        const { contract: fallbackContract, address: fallbackAddress } = await deployContract(
            "ChainlinkFallbackContract", 
            [], 
            "Chainlink Fallback Data Provider"
        );
        deployedContracts.fallbackContract = fallbackAddress;

        // Step 5: Deploy YieldXRiskCalculator with both required parameters
        console.log("\n⚖️ Step 5: Deploying YieldXRiskCalculator...");
        await analyzeConstructor("YieldXRiskCalculator");
        
        const { contract: riskCalculator, address: riskCalculatorAddress } = await deployContract(
            "YieldXRiskCalculator",
            [fallbackAddress, priceManagerAddress], // Both required parameters
            "Risk Assessment Calculator"
        );
        deployedContracts.riskCalculator = riskCalculatorAddress;

        console.log("\n" + "=".repeat(60));
        console.log("🔍 PHASE 2: ARCHITECTURE DETECTION");
        console.log("=".repeat(60));

        // Check if modular contracts exist
        const verificationParams = await analyzeConstructor("YieldXVerificationModule");
        const investmentParams = await analyzeConstructor("YieldXInvestmentModule");
        const vrfParams = await analyzeConstructor("YieldXVRFModule");
        
        const isModular = verificationParams !== null && investmentParams !== null && vrfParams !== null;
        
        if (isModular) {
            console.log("📋 Detected MODULAR architecture - deploying modules...");
            
            // Deploy modules
            const { contract: verificationModule, address: verificationAddress } = await deployContract(
                "YieldXVerificationModule",
                [
                    CHAINLINK_ADDRESSES.FUNCTIONS_ROUTER,
                    FUNCTIONS_SUBSCRIPTION_ID
                ],
                "Document Verification Module"
            );
            deployedContracts.verificationModule = verificationAddress;

            const { contract: investmentModule, address: investmentAddress } = await deployContract(
                "YieldXInvestmentModule",
                [usdcAddress],
                "Investment Management Module"
            );
            deployedContracts.investmentModule = investmentAddress;

            const { contract: vrfModule, address: vrfAddress } = await deployContract(
                "YieldXVRFModule",
                [
                    CHAINLINK_ADDRESSES.VRF_COORDINATOR,
                    CHAINLINK_ADDRESSES.VRF_KEY_HASH,
                    VRF_SUBSCRIPTION_ID,
                    riskCalculatorAddress
                ],
                "VRF and APR Module"
            );
            deployedContracts.vrfModule = vrfAddress;

            console.log("\n" + "=".repeat(60));
            console.log("🎯 PHASE 3: MODULAR CORE DEPLOYMENT");
            console.log("=".repeat(60));

            // Deploy modular YieldXCore
            const { contract: yieldXCore, address: coreAddress } = await deployContract(
                "YieldXCore",
                [
                    nftAddress,              // _invoiceNFT
                    usdcAddress,             // _usdcToken
                    priceManagerAddress,     // _priceManager
                    verificationAddress,     // _verificationModule
                    investmentAddress,       // _investmentModule
                    vrfAddress               // _vrfModule
                ],
                "Modular Core Contract"
            );
            deployedContracts.yieldXCore = coreAddress;

            console.log("\n🔗 Initializing modular connections...");
            console.log("\n🔗 Initializing modular connections...");
// Check core contract status before setting
const verificationCore = await verificationModule.coreContract();
if (verificationCore === "0x0000000000000000000000000000000000000000") {
    await verificationModule.setCoreContract(coreAddress);
    console.log("✅ VerificationModule core contract set");
} else {
    console.log(`⚠️ VerificationModule core contract already set to: ${verificationCore}`);
}

const investmentCore = await investmentModule.coreContract();
if (investmentCore === "0x0000000000000000000000000000000000000000") {
    await investmentModule.setCoreContract(coreAddress);
    console.log("✅ InvestmentModule core contract set");
} else {
    console.log(`⚠️ InvestmentModule core contract already set to: ${investmentCore}`);
}

const vrfCore = await vrfModule.coreContract();
if (vrfCore === "0x0000000000000000000000000000000000000000") {
    await vrfModule.setCoreContract(coreAddress);
    console.log("✅ VRFModule core contract set");
} else {
    console.log(`⚠️ VRFModule core contract already set to: ${vrfCore}`);
}

await invoiceNFT.setProtocolAddress(coreAddress);
console.log("✅ InvoiceNFT protocol address set");

await yieldXCore.initializeProtocol();
console.log("✅ All modules connected and initialized!");
            await verificationModule.setCoreContract(coreAddress);
            await investmentModule.setCoreContract(coreAddress);
            await vrfModule.setCoreContract(coreAddress);
            await yieldXCore.initializeProtocol();
            console.log("✅ All modules connected and initialized!");

        } else {
            console.log("📋 Detected SINGLE CONTRACT architecture - analyzing YieldXCore...");
            
            const coreParams = await analyzeConstructor("YieldXCore");
            
            if (!coreParams) {
                throw new Error("YieldXCore contract not found!");
            }

            console.log("\n" + "=".repeat(60));
            console.log("🎯 PHASE 3: SINGLE CORE DEPLOYMENT");
            console.log("=".repeat(60));

            let coreArgs: any[] = [];
            
            if (coreParams.length === 9) {
                console.log("📝 Detected 9-parameter constructor (Full Features):");
                coreArgs = [
                    nftAddress,                                 // _invoiceNFT
                    usdcAddress,                                // _usdcToken
                    priceManagerAddress,                        // _priceManager
                    riskCalculatorAddress,                      // _riskCalculator
                    CHAINLINK_ADDRESSES.VRF_COORDINATOR,        // _vrfCoordinator
                    CHAINLINK_ADDRESSES.VRF_KEY_HASH,           // _keyHash
                    VRF_SUBSCRIPTION_ID,                        // _vrfSubscriptionId
                    CHAINLINK_ADDRESSES.FUNCTIONS_ROUTER,       // _functionsRouter
                    FUNCTIONS_SUBSCRIPTION_ID                   // _functionsSubscriptionId
                ];
            } else if (coreParams.length === 6) {
                console.log("📝 Detected 6-parameter constructor (Simplified):");
                coreArgs = [
                    nftAddress,                                 // _invoiceNFT
                    usdcAddress,                                // _usdcToken
                    priceManagerAddress,                        // _priceManager
                    riskCalculatorAddress,                      // _riskCalculator
                    CHAINLINK_ADDRESSES.VRF_COORDINATOR,        // _vrfCoordinator
                    CHAINLINK_ADDRESSES.FUNCTIONS_ROUTER        // _functionsRouter
                ];
            } else {
                throw new Error(`Unsupported constructor with ${coreParams.length} parameters`);
            }

            const { contract: yieldXCore, address: coreAddress } = await deployContract(
                "YieldXCore",
                coreArgs,
                "Single Contract"
            );
            deployedContracts.yieldXCore = coreAddress;

            console.log("\n🔗 Initializing protocol...");
            await yieldXCore.initializeNFTProtocol();
            console.log("✅ Protocol initialized!");
        }

        console.log("\n" + "=".repeat(60));
        console.log("💰 PHASE 4: TEST ENVIRONMENT SETUP");
        console.log("=".repeat(60));

        console.log("📝 Minting test USDC tokens...");
        const testAmount = hre.ethers.parseUnits("1000000", 6);
        await mockUSDC.mint(deployer.address, testAmount);
        console.log(`✅ Minted ${hre.ethers.formatUnits(testAmount, 6)} test USDC`);

        console.log("📝 Approving USDC spending...");
        await mockUSDC.approve(deployedContracts.yieldXCore, testAmount);
        console.log("✅ USDC spending approved");

        console.log("\n" + "=".repeat(60));
        console.log("🧪 PHASE 5: DEPLOYMENT VERIFICATION");
        console.log("=".repeat(60));

        const yieldXCore = await hre.ethers.getContractAt("YieldXCore", deployedContracts.yieldXCore);
        
        console.log("📋 Verifying contract integration...");
        
        try {
            const version = await yieldXCore.version();
            console.log(`✅ Protocol Version: ${version}`);
            
            const stats = await yieldXCore.getProtocolStats();
            console.log(`✅ Protocol Stats: ${stats[0]} invoices, $${hre.ethers.formatUnits(stats[1], 6)} funding`);
            
            // Test stack-safe functions
            console.log("🔍 Testing stack-safe view functions...");
            
            // Test basic function first
            const contractInfo = await yieldXCore.getContractInfo();
            console.log(`✅ Contract Info: ${contractInfo[0]} - ${contractInfo[1]}`);
            
            // Test invoice submission
            console.log("📝 Testing invoice submission...");
            const testInvoice = await yieldXCore.submitInvoice(
                deployer.address, // buyer
                hre.ethers.parseUnits("50000", 6), // $50,000
                "Coffee Beans", // commodity
                "Kenya", // supplier country
                "USA", // buyer country
                "Kenyan Coffee Co.", // exporter name
                "US Coffee Corp.", // buyer name
                Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // due date (30 days)
                "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" // document hash
            );
            await testInvoice.wait();
            console.log("✅ Test invoice submitted");
            
            // Test stack-safe view functions
            console.log("🔍 Testing stack-safe invoice functions...");
            const basics = await yieldXCore.getInvoiceBasics(1);
            console.log(`✅ Invoice Basics: ID=${basics[0]}, Amount=$${hre.ethers.formatUnits(basics[2], 6)}, Status=${basics[3]}`);
            
            const parties = await yieldXCore.getInvoiceParties(1);
            console.log(`✅ Invoice Parties: Buyer=${parties[0]}, Commodity=${parties[3]}`);
            
        } catch (error) {
            console.log(`⚠️ Some verification tests failed: ${error.message}`);
        }

        const currentBlock = await hre.ethers.provider.getBlockNumber();

        console.log("\n" + "=".repeat(60));
        console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(60));

        // Prepare deployment result
        const deploymentResult = {
            network: network.name,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            version: isModular ? "YieldXCore v4.1.0 - Stack Safe Modular" : "YieldXCore v4.1.0 - Stack Safe Single",
            architecture: isModular ? "modular" : "single",
            contracts: deployedContracts,
            chainlinkConfig: CHAINLINK_ADDRESSES,
            subscriptions: {
                vrfSubscriptionId: VRF_SUBSCRIPTION_ID,
                functionsSubscriptionId: FUNCTIONS_SUBSCRIPTION_ID
            },
            deploymentBlock: currentBlock,
            frontendConfig: {
                YieldXCore: deployedContracts.yieldXCore,
                MockUSDC: deployedContracts.mockUSDC,
                YieldXInvoiceNFT: deployedContracts.invoiceNFT,
                YieldXPriceManager: deployedContracts.priceManager,
                YieldXRiskCalculator: deployedContracts.riskCalculator,
                chainId: Number(network.chainId),
                apiUrl: "https://yieldx.onrender.com",
                explorerUrl: "https://sepolia.etherscan.io"
            }
        };

        // Save deployment info
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${network.name}-stack-safe-${timestamp}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentResult, null, 2));

        const latestPath = path.join(deploymentsDir, `${network.name}-latest.json`);
        fs.writeFileSync(latestPath, JSON.stringify(deploymentResult, null, 2));

        console.log("\n📋 DEPLOYMENT SUMMARY");
        console.log("=====================================");
        console.log(`Network: ${network.name} (${network.chainId})`);
        console.log(`Architecture: ${isModular ? 'Modular' : 'Single Contract'}`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Block: ${currentBlock}`);
        console.log("=====================================");
        
        Object.entries(deployedContracts).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
        });
        
        console.log("=====================================");
        console.log(`📄 Deployment saved: ${filepath}`);
        
        console.log("\n🚀 NEXT STEPS:");
        console.log("1. Test stack-safe functions: npm run test:stack-safe");
        console.log("2. Verify contracts: npm run verify:sepolia");
        console.log("3. Test API integration: curl https://yieldx.onrender.com/health");
        console.log("4. Submit to Chainlink Hackathon! 🏆");
        
        console.log("\n🔗 USEFUL LINKS:");
        console.log(`📊 YieldXCore: https://sepolia.etherscan.io/address/${deployedContracts.yieldXCore}`);
        console.log(`🎨 NFT Contract: https://sepolia.etherscan.io/address/${deployedContracts.invoiceNFT}`);
        console.log(`💰 USDC: https://sepolia.etherscan.io/address/${deployedContracts.mockUSDC}`);
        console.log(`🌐 Live API: https://yieldx.onrender.com`);

        return deploymentResult;

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED:", error);
        console.log("\n🔧 Troubleshooting Tips:");
        console.log("1. Run size check first: npm run size:check");
        console.log("2. Ensure contracts compile: npm run compile");
        console.log("3. Check constructor parameters match");
        console.log("4. Verify sufficient ETH balance");
        console.log("5. Check network configuration");
        
        throw error;
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then((result) => {
            console.log("\n✅ Stack-safe deployment completed successfully!");
            console.log(`📦 Architecture: ${result.architecture}`);
            console.log(`🏗️ Contracts: ${Object.keys(result.contracts).length}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ Deployment failed:", error);
            process.exit(1);
        });
}

export default main;
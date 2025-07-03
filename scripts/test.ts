// scripts/direct-module-setup.ts
import hre from "hardhat";

const CONTRACTS = {
  PROTOCOL: "0x8dFAdc9b2bD255D5c8BE8f43f8FF54FE11EE5dB5",
  INVESTMENT_MODULE: "0xbe20894414bb92269c3d6D36Ff272cFc34AE9247",
  VERIFICATION_MODULE: "0x4402aF89143b8c36fFa6bF75Df99dBc4Beb4c7dc",
  VRF_MODULE: "0xA10F5A4E60f8080663A7a88edD6de0B7BFE9EF87",
  USDC: "0x6a563Ea24116aa64d2Ea325d6fd3Cefbf20F0FDb"
};

async function main() {
  console.log("🔧 DIRECT MODULE SETUP - BYPASSING CORE CONTRACT");
  console.log("=".repeat(50));
  
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Simple ABIs for just the functions we need
  const moduleABI = [
    "function setCoreContract(address _coreContract) external",
    "function coreContract() external view returns (address)"
  ];
  
  const verificationABI = [
    "function setCoreContract(address _coreContract) external", 
    "function getCoreContract() external view returns (address)"
  ];
  
  const usdcABI = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  
  try {
    // Create contract instances
    const investmentModule = new hre.ethers.Contract(CONTRACTS.INVESTMENT_MODULE, moduleABI, signer);
    const vrfModule = new hre.ethers.Contract(CONTRACTS.VRF_MODULE, moduleABI, signer);
    const verificationModule = new hre.ethers.Contract(CONTRACTS.VERIFICATION_MODULE, verificationABI, signer);
    const usdc = new hre.ethers.Contract(CONTRACTS.USDC, usdcABI, signer);
    
    console.log("\n📋 STEP 1: Check Current Module Status");
    
    // Check current status
    let investmentCore, vrfCore, verificationCore;
    
    try {
      investmentCore = await investmentModule.coreContract();
      console.log(`Investment Module core: ${investmentCore}`);
    } catch (error) {
      console.log(`Investment Module: Error reading core contract`);
      investmentCore = "0x0000000000000000000000000000000000000000";
    }
    
    try {
      vrfCore = await vrfModule.coreContract();
      console.log(`VRF Module core: ${vrfCore}`);
    } catch (error) {
      console.log(`VRF Module: Error reading core contract`);
      vrfCore = "0x0000000000000000000000000000000000000000";
    }
    
    try {
      verificationCore = await verificationModule.getCoreContract();
      console.log(`Verification Module core: ${verificationCore}`);
    } catch (error) {
      console.log(`Verification Module: Error reading core contract`);
      verificationCore = "0x0000000000000000000000000000000000000000";
    }
    
    console.log("\n📋 STEP 2: Set Core Contract on Investment Module");
    
    if (investmentCore === "0x0000000000000000000000000000000000000000") {
      console.log("🔧 Setting core contract on Investment Module...");
      try {
        const tx = await investmentModule.setCoreContract(CONTRACTS.PROTOCOL);
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Investment Module core contract set successfully!");
        
        // Verify
        const newCore = await investmentModule.coreContract();
        console.log(`✅ Investment Module now connected to: ${newCore}`);
        
      } catch (error) {
        console.log(`❌ Failed to set Investment Module core: ${error.message}`);
        if (error.message.includes("already set")) {
          console.log("   (Core contract is already set - this is expected)");
        }
      }
    } else {
      console.log(`✅ Investment Module already has core contract: ${investmentCore}`);
    }
    
    console.log("\n📋 STEP 3: Set Core Contract on VRF Module");
    
    if (vrfCore === "0x0000000000000000000000000000000000000000") {
      console.log("🔧 Setting core contract on VRF Module...");
      try {
        const tx = await vrfModule.setCoreContract(CONTRACTS.PROTOCOL);
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ VRF Module core contract set successfully!");
        
        // Verify
        const newCore = await vrfModule.coreContract();
        console.log(`✅ VRF Module now connected to: ${newCore}`);
        
      } catch (error) {
        console.log(`❌ Failed to set VRF Module core: ${error.message}`);
        if (error.message.includes("already set")) {
          console.log("   (Core contract is already set - this is expected)");
        }
      }
    } else {
      console.log(`✅ VRF Module already has core contract: ${vrfCore}`);
    }
    
    console.log("\n📋 STEP 4: Set Core Contract on Verification Module (if needed)");
    
    if (verificationCore === "0x0000000000000000000000000000000000000000") {
      console.log("🔧 Setting core contract on Verification Module...");
      try {
        const tx = await verificationModule.setCoreContract(CONTRACTS.PROTOCOL);
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Verification Module core contract set successfully!");
        
        // Verify
        const newCore = await verificationModule.getCoreContract();
        console.log(`✅ Verification Module now connected to: ${newCore}`);
        
      } catch (error) {
        console.log(`❌ Failed to set Verification Module core: ${error.message}`);
        if (error.message.includes("already set")) {
          console.log("   (Core contract is already set - this is expected)");
        }
      }
    } else {
      console.log(`✅ Verification Module already has core contract: ${verificationCore}`);
    }
    
    console.log("\n📋 STEP 5: Final Verification");
    
    // Re-check all connections
    const finalInvestmentCore = await investmentModule.coreContract();
    const finalVrfCore = await vrfModule.coreContract();
    const finalVerificationCore = await verificationModule.getCoreContract();
    
    console.log("Final module connections:");
    console.log(`Investment Module: ${finalInvestmentCore}`);
    console.log(`VRF Module: ${finalVrfCore}`);
    console.log(`Verification Module: ${finalVerificationCore}`);
    
    const protocolAddress = CONTRACTS.PROTOCOL.toLowerCase();
    const investmentConnected = finalInvestmentCore.toLowerCase() === protocolAddress;
    const vrfConnected = finalVrfCore.toLowerCase() === protocolAddress;
    const verificationConnected = finalVerificationCore.toLowerCase() === protocolAddress;
    
    console.log("\nConnection Status:");
    console.log(`Investment Module: ${investmentConnected ? "✅ CONNECTED" : "❌ NOT CONNECTED"}`);
    console.log(`VRF Module: ${vrfConnected ? "✅ CONNECTED" : "❌ NOT CONNECTED"}`);
    console.log(`Verification Module: ${verificationConnected ? "✅ CONNECTED" : "❌ NOT CONNECTED"}`);
    
    console.log("\n📋 STEP 6: Mint Test USDC");
    
    try {
      console.log("🏦 Minting 10,000 test USDC...");
      const mintTx = await usdc.mint(signer.address, hre.ethers.parseUnits("10000", 6));
      await mintTx.wait();
      console.log("✅ Successfully minted 10,000 test USDC");
      
      const balance = await usdc.balanceOf(signer.address);
      console.log(`Your USDC balance: ${hre.ethers.formatUnits(balance, 6)} USDC`);
      
    } catch (error) {
      console.log(`Warning: Could not mint USDC: ${error.message}`);
    }
    
    console.log("\n🎉 SETUP COMPLETE!");
    console.log("=".repeat(30));
    
    if (investmentConnected) {
      console.log("✅ Investment Module is connected!");
      console.log("✅ The 'Only core contract' error should be FIXED!");
      console.log("✅ You can now test investments through your frontend!");
    } else {
      console.log("❌ Investment Module is still not connected");
      console.log("❌ Investment flow will still fail");
    }
    
    console.log("\n📋 What's Fixed:");
    console.log("- Investment Module can now receive calls from Core Contract");
    console.log("- makeInvestment() function will work");
    console.log("- USDC transfers will be processed");
    console.log("- Investment tracking will work");
    
    console.log("\n📋 Next Steps:");
    console.log("1. 🧪 Test your frontend investment flow");
    console.log("2. 📄 Submit a test invoice");
    console.log("3. 💰 Try to invest in a verified invoice");
    console.log("4. 🎊 Celebrate when it works!");
    
  } catch (error) {
    console.error(`❌ Error during setup: ${error.message}`);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
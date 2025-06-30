# YieldX Protocol - Tokenized African Trade Receivables

Real-world asset (RWA) tokenization platform for African trade finance using Chainlink infrastructure.

## 🌍 Problem Statement

African SMEs face a $40B trade finance gap. Export businesses wait 30-90 days for payment while having immediate cash needs.

## 💡 Solution

YieldX tokenizes verified export invoices, creating investable DeFi vaults that provide:
- **Instant liquidity** for African exporters
- **Real-world yield** for DeFi investors
- **Risk-assessed returns** via AI scoring

## 🔗 Chainlink Integration

- **Functions**: Real invoice verification via trade APIs
- **Automation**: Automated yield distribution at maturity
- **Data Feeds**: Currency rates and country risk scoring
- **CCIP**: Cross-chain vault accessibility
- **Proof of Reserve**: Insurance verification
- **VRF**: Fair liquidation in edge cases

## ⚠️ Chainlink Hackathon Eligibility Requirements

- **Each project must use Chainlink in some form to make a state change on a blockchain.**
  - Simply reading Chainlink data feeds in the frontend is **not sufficient**.
  - You must use one of: Chainlink Data Feeds, Data Streams, VRF, Proof of Reserves, Automation, Functions, or CCIP **inside your smart contracts**.
- For sponsor prizes, Chainlink is not required, but to be eligible for both sponsor and Chainlink core prizes, it is recommended.
- **No past hackathon projects** unless you are adding new components (must be clearly documented).
- **Required for submission:**
  - 3-5 minute, publicly viewable demo video
  - Publicly accessible source code (e.g., GitHub public repo)

## 📂 Files Using Chainlink

Below are all files in the project that directly reference or integrate with Chainlink (oracles, Functions, VRF, price feeds, etc):

### Smart Contracts
- [contracts/YieldXProtocol.sol](https://github.com/your-org/your-repo/blob/main/contracts/YieldXProtocol.sol)
- [contracts/YieldXInvestmentModule.sol](https://github.com/your-org/your-repo/blob/main/contracts/YieldXInvestmentModule.sol)

### Frontend (React)
- [frontend1/src/hooks/useYieldX.ts](https://github.com/your-org/your-repo/blob/main/frontend1/src/hooks/useYieldX.ts)
- [frontend1/src/hooks/useNFTIvoiceSystem.ts](https://github.com/your-org/your-repo/blob/main/frontend1/src/hooks/useNFTIvoiceSystem.ts)
- [frontend1/src/hooks/useInvestmentCommittee.ts](https://github.com/your-org/your-repo/blob/main/frontend1/src/hooks/useInvestmentCommittee.ts)
- [frontend1/src/components/pages/InvestPage.tsx](https://github.com/your-org/your-repo/blob/main/frontend1/src/components/pages/InvestPage.tsx)
- [frontend1/src/components/pages/SubmitInvoice.tsx](https://github.com/your-org/your-repo/blob/main/frontend1/src/components/pages/SubmitInvoice.tsx)
- [frontend1/src/components/pages/Dashboard.tsx](https://github.com/your-org/your-repo/blob/main/frontend1/src/components/pages/Dashboard.tsx)
- [frontend1/src/components/pages/LandingPage.tsx](https://github.com/your-org/your-repo/blob/main/frontend1/src/components/pages/LandingPage.tsx)
- [frontend1/src/components/InvoiceVerification.tsx](https://github.com/your-org/your-repo/blob/main/frontend1/src/components/InvoiceVerification.tsx)
- [frontend1/src/components/CommitteeDashboard.tsx](https://github.com/your-org/your-repo/blob/main/frontend1/src/components/CommitteeDashboard.tsx)

### Backend/API
- [yieldx-verification-api/src/verification/verification.controller.ts](https://github.com/your-org/your-repo/blob/main/yieldx-verification-api/src/verification/verification.controller.ts)
- [yieldx-verification-api/src/verification/verification.service.ts](https://github.com/your-org/your-repo/blob/main/yieldx-verification-api/src/verification/verification.service.ts)
- [yieldx-verification-api/src/main.ts](https://github.com/your-org/your-repo/blob/main/yieldx-verification-api/src/main.ts)
- [yieldx-verification-api/src/config/configuration.ts](https://github.com/your-org/your-repo/blob/main/yieldx-verification-api/src/config/configuration.ts)

### Scripts/Deployment
- [scripts/deploy.ts](https://github.com/your-org/your-repo/blob/main/scripts/deploy.ts)
- [scripts/test.ts](https://github.com/your-org/your-repo/blob/main/scripts/test.ts)

### Services
- [frontend1/src/services/pingService.ts](https://github.com/your-org/your-repo/blob/main/frontend1/src/services/pingService.ts)

## 🏗️ Project Description, Stack & Architecture

**YieldX Protocol** is a real-world asset (RWA) tokenization platform for African trade finance, built on a modular, stack-safe smart contract architecture and deeply integrated with Chainlink services.

### What It Does
- Tokenizes verified export invoices as NFTs, creating investable DeFi vaults.
- Uses Chainlink Functions for real-time document verification via trade APIs.
- Automates yield distribution and risk scoring using Chainlink Automation and Data Feeds.
- Provides real-world yield for DeFi investors and instant liquidity for African exporters.

### Core Stack
- **Smart Contracts:** Solidity 0.8.x, modular architecture (Core, Investment, Verification, PriceManager, VRF, NFT)
- **Oracles:** Chainlink (Functions, Automation, Data Feeds, VRF, CCIP, Proof of Reserve)
- **Frontend:** React (TypeScript), ethers.js, custom hooks for protocol integration
- **Backend/API:** NestJS (TypeScript), MongoDB, Chainlink-compatible endpoints for verification
- **Storage:** IPFS via Pinata for document and metadata storage
- **Testing:** Hardhat, Sepolia & Mumbai testnets, custom scripts
- **Deployment:** Hardhat scripts, environment-based config, modular upgrades

### Architecture Overview
- **Modular Contracts:**  
  - `YieldXCore` (main entry, stack-safe)
  - `YieldXInvestmentModule` (investments, returns)
  - `YieldXVerificationModule` (Chainlink Functions, document verification)
  - `YieldXPriceManager` (Chainlink price feeds)
  - `YieldXInvoiceNFT` (ERC721 tokenization)
  - `YieldXVRFModule` (Chainlink VRF for randomness)
- **Frontend:**  
  - React app with hooks for all protocol actions
  - Live Chainlink data and verification status in UI
- **Backend:**  
  - API for document verification, optimized for Chainlink Functions
  - MongoDB for audit/history

### Key Chainlink Integrations
- **Functions:** Real-time document verification
- **Data Feeds:** FX rates, country risk, commodity prices
- **Automation:** Scheduled yield distribution
- **VRF:** Randomness for liquidation/lottery
- **CCIP:** Cross-chain asset movement (future)
- **Proof of Reserve:** Insurance and asset backing

## 🎥 Demo Video

- [Add your 3-5 minute public demo video link here]

## 🌐 Live Demo

- [Add your live deployed demo link here]

## 🛠 Technology Stack

- **Smart Contracts**: Solidity 0.8.19
- **Framework**: Hardhat with TypeScript
- **Frontend**: React with ethers.js
- **Storage**: IPFS via Pinata
- **Oracles**: Chainlink (6 services)
- **Testing**: Sepolia & Mumbai testnets

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Compile contracts
npm run compile

# Deploy to testnet
npm run deploy:sepolia

# Run tests
npm test

# Start frontend
cd frontend && npm start
```

## 📋 Contract Addresses

### Sepolia Testnet
- YieldXProtocol: `TBD`
- YieldXInvoiceNFT: `TBD`
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### Mumbai Testnet
- YieldXProtocol: `TBD`
- YieldXInvoiceNFT: `TBD`  
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Coverage
npm run coverage

# Gas report
npm run gas-report
```

## 📖 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Smart Contract API](docs/CONTRACTS.md)
- [Frontend Integration](docs/FRONTEND.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🏆 Hackathon Demo

Real workflow demonstration:
1. Submit actual Nigerian cocoa export invoice
2. Chainlink Functions verifies via trade APIs
3. Create investment vault with AI risk scoring
4. Investors provide USDC liquidity
5. Automated yield distribution via Chainlink Automation

## 🔒 Security

- Multiple audits planned
- Comprehensive test coverage
- Gradual rollout strategy
- Emergency pause mechanisms

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

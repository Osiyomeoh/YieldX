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

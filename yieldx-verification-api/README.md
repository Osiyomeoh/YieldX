# YieldX Verification API

Professional document verification service built with NestJS and MongoDB for the YieldX Protocol.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- Docker (optional)

### Installation
```bash
npm install
cp .env.example .env
npm run start:dev
```

### Docker Setup
```bash
docker-compose up -d
```

## 📋 API Endpoints

### Verification
- `POST /api/v1/verification/verify-documents` - Verify trade documents
- `GET /api/v1/verification/status/:id` - Get verification status
- `GET /api/v1/verification/history/:invoiceId` - Get verification history

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard data
- `GET /api/v1/analytics/verification-trends` - Trends analysis

### Health
- `GET /api/v1/health` - Basic health check
- `GET /docs` - API documentation

## 🧪 Testing

Test the API:
```bash
curl -X POST http://localhost:3000/api/v1/verification/verify-documents \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "TEST-001",
    "documentHash": "0x1234567890abcdef",
    "invoiceDetails": {
      "commodity": "Electronics",
      "amount": "50000000",
      "supplierCountry": "Singapore",
      "buyerCountry": "United States",
      "exporterName": "Test Exports Ltd",
      "buyerName": "Test Corp USA"
    }
  }'
```

## 📚 Documentation

API documentation: http://localhost:3000/docs
Health check: http://localhost:3000/api/v1/health

## 🔧 Development

```bash
npm run start:dev    # Development mode
npm run build        # Build for production
npm run start:prod   # Production mode
npm run test         # Run tests
```

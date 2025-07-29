# CDI Oracle Service

A Node.js service that fetches CDI (Certificado de Depósito Interbancário) rates from the Brazilian Central Bank API and updates the on-chain CDI Oracle contract for the Rendex Token.

## 🎯 Purpose

This service acts as a bridge between the Brazilian Central Bank's CDI data and the blockchain, ensuring that the Rendex Token's yield simulation is based on real-world CDI rates.

## 🔗 Architecture

```
Brazilian Central Bank API → Oracle Service → CDI Oracle Contract → Rendex Token
```

## 🚀 Features

- **Automated CDI Fetching**: Fetches latest CDI rates from BCB API
- **Rate Conversion**: Converts monthly CDI to daily compound rate
- **Multiplier Application**: Applies 120% CDI multiplier as per contract
- **Scheduled Updates**: Daily updates at 00:00 UTC
- **Manual Updates**: Support for manual CDI updates
- **Error Handling**: Robust error handling and logging
- **Docker Support**: Containerized deployment

## 📦 Installation

### Prerequisites

- Node.js 18+
- Access to Ethereum network (Sepolia/Mainnet)
- Private key with admin permissions on CDI Oracle contract

### Local Setup

1. **Clone and install dependencies:**
```bash
cd oracle-service
npm install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start the service:**
```bash
# Start with scheduled updates
npm start

# Manual update only
npm run manual
```

### Docker Setup

1. **Build the image:**
```bash
docker build -t rendex-oracle .
```

2. **Run the container:**
```bash
docker run -d \
  --name rendex-oracle \
  --env-file .env \
  rendex-oracle
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `RPC_URL` | Ethereum RPC endpoint | Yes | - |
| `PRIVATE_KEY` | Private key for contract interactions | Yes | - |
| `CDI_ORACLE_ADDRESS` | Address of deployed CDI Oracle contract | Yes | - |
| `CDI_API_URL` | BCB API endpoint | No | BCB API URL |
| `LOG_LEVEL` | Logging level | No | `info` |
| `UPDATE_SCHEDULE` | Cron schedule for updates | No | `0 0 * * *` |

### Example Configuration

```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=0x1234567890abcdef...
CDI_ORACLE_ADDRESS=0xabcdef1234567890...
LOG_LEVEL=debug
```

## 🔄 How It Works

### 1. CDI Fetching
```javascript
// Fetches from: https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json
const monthlyCDI = await fetchCDIFromAPI(); // e.g., 12.5%
```

### 2. Rate Conversion
```javascript
// Convert monthly to daily compound rate
// Formula: daily_rate = (1 + monthly_cdi)^(1/30) - 1
const dailyCDI = convertMonthlyToDaily(monthlyCDI); // e.g., 0.395%
```

### 3. Multiplier Application
```javascript
// Apply 120% multiplier
const adjustedCDI = applyCDIMultiplier(dailyCDI); // e.g., 0.474%
```

### 4. Contract Update
```javascript
// Convert to contract format (18 decimals)
const contractCDI = convertToContractFormat(adjustedCDI);
await updateCDIOnChain(contractCDI);
```

## 📊 API Response Format

The BCB API returns data in this format:
```json
[
  {
    "data": "2024-01-15",
    "valor": 12.5
  }
]
```

## 🕐 Scheduling

### Default Schedule
- **Frequency**: Daily at 00:00 UTC
- **Cron Expression**: `0 0 * * *`

### Custom Schedule
Set `UPDATE_SCHEDULE` environment variable:
```env
# Every 6 hours
UPDATE_SCHEDULE=0 */6 * * *

# Every Monday at 9 AM
UPDATE_SCHEDULE=0 9 * * 1
```

## 🛠️ Usage

### Start Service
```bash
# Start with scheduled updates
npm start
```

### Manual Update
```bash
# Trigger immediate CDI update
npm run manual
```

### Development Mode
```bash
# Start with nodemon for development
npm run dev
```

## 📝 Logging

The service provides detailed logging:

```
🔄 Fetching CDI from BCB API...
📊 Latest CDI from API: 12.5%
🔄 Converting monthly CDI 12.5% to daily rate: 0.395%
📈 Applied 120% multiplier: 0.474%
🔢 Converting 0.474% to contract format: 4740000000000000
⛓️ Updating CDI on blockchain...
📝 Transaction hash: 0x1234...
✅ CDI updated successfully! Gas used: 45000
🎉 CDI update completed successfully!
```

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check internet connectivity
   - Verify BCB API is accessible
   - Check firewall settings

2. **Blockchain Transaction Failed**
   - Verify RPC URL is correct
   - Check private key has sufficient funds
   - Ensure private key has admin permissions

3. **Contract Not Found**
   - Verify CDI_ORACLE_ADDRESS is correct
   - Check contract is deployed on target network
   - Ensure ABI matches deployed contract

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

## 🔒 Security Considerations

- **Private Key**: Never commit private keys to version control
- **Environment Variables**: Use `.env` files for local development
- **Network Access**: Restrict RPC access to trusted endpoints
- **API Rate Limits**: BCB API has rate limits, respect them

## 🚀 Deployment

### Production Deployment

1. **Environment Setup:**
```bash
# Set production environment variables
export RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
export PRIVATE_KEY=your_production_private_key
export CDI_ORACLE_ADDRESS=deployed_oracle_address
```

2. **Docker Deployment:**
```bash
docker build -t rendex-oracle:latest .
docker run -d --name rendex-oracle-prod --env-file .env rendex-oracle:latest
```

3. **Process Manager (PM2):**
```bash
npm install -g pm2
pm2 start index.js --name "rendex-oracle"
pm2 startup
pm2 save
```

## 📞 Monitoring

### Health Checks
The service includes health checks for container orchestration:
```bash
# Check service health
curl http://localhost:3000/health
```

### Log Monitoring
```bash
# View logs
docker logs rendex-oracle

# Follow logs
docker logs -f rendex-oracle
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 
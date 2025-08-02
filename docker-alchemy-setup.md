# Alchemy SDK Docker Setup Guide

## Quick Setup

1. **Install dependencies locally first** (recommended):
   ```bash
   npm install
   cd oracle-service && npm install
   ```

2. **Build Docker images**:
   ```bash
   # Build main project
   docker build -t rendex .
   
   # Build oracle service
   docker build -t rendex-oracle ./oracle-service
   ```

3. **Set environment variables**:
   ```bash
   # Copy and edit environment files
   cp env.example .env
   cp oracle-service/env.example oracle-service/.env
   
   # Add your Alchemy API key to both .env files
   ALCHEMY_API_KEY=your_actual_alchemy_api_key_here
   ```

4. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

## Docker Compose Configuration

Your existing `docker-compose.yml` will automatically use the updated images with Alchemy SDK installed.

## Benefits of This Approach

1. **Multi-stage builds**: Dependencies are installed in a separate stage, keeping the final image lean
2. **Production optimization**: Only production dependencies are included in the final image
3. **Security**: Non-root users and minimal attack surface
4. **Caching**: Docker layer caching ensures fast rebuilds when only code changes

## Using Alchemy SDK in Your Code

```javascript
import { Alchemy, Network } from 'alchemy-sdk';

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA, // or Network.ETH_MAINNET
});

// Get latest block
const blockNumber = await alchemy.core.getBlockNumber();

// Get token balances
const balances = await alchemy.core.getTokenBalances(address);

// Get NFT metadata
const metadata = await alchemy.nft.getNftMetadata(contractAddress, tokenId);
```

## Troubleshooting

1. **API Key Issues**: Ensure `ALCHEMY_API_KEY` is set in your environment
2. **Network Issues**: Verify you're using the correct network (Sepolia/Mainnet)
3. **Rate Limits**: Alchemy has rate limits based on your plan
4. **Docker Build Issues**: Clear Docker cache with `docker system prune -a`

## Alternative: Using Alchemy RPC URLs

You can also use Alchemy's RPC URLs directly with ethers.js:

```javascript
// In your hardhat.config.ts
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

module.exports = {
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
``` 
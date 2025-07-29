# Rendex

**Rendex** is a simple Web3 simulation of an investment flow using a rebasing ERC-20 token. It mimics how users earn yield on invested funds, with returns based on a post-fixed rate tied to **CDI** — a Brazilian benchmark interest rate used in fixed-income financial products. The token balance grows daily through smart contract-controlled rebases, using an oracle-fed CDI value to simulate on-chain yield.

---

## 🔍 Overview

- **Token Type:** Rebasing ERC-20
- **Yield Rate:** 120% of CDI (daily rebase, compounded from monthly CDI)
- **Custody:** Off-chain (abstracted in the simulation)
- **Chain:** Sepolia (testnet)
- **Purpose:** Educational / Proof-of-Concept

---

## 💻 Tech Stack

| Layer           | Technology                  | Purpose                            |
|----------------|------------------------------|------------------------------------|
| Framework       | Next.js (TypeScript)         | Routing + SSR + scalability        |
| Wallet Connect  | RainbowKit + Wagmi           | MetaMask and WalletConnect support |
| Blockchain SDK  | Alchemy SDK                   | Contract calls + enhanced features |
| Styling         | Tailwind CSS                 | Fast UI development                |
| Provider        | Alchemy                      | RPC + observability + testnet/mainnet |
| Chain           | Sepolia                      | Testnet for MVP                    |

---

## 🧱 Architecture

### Smart Contracts

- `RendexToken`: ERC-20 token with `rebase()` function and CDI oracle integration
- `CDIOracle`: Oracle contract for CDI rate data

### Off-Chain Components

- **CDI Oracle Service**: A Node.js service that fetches the current CDI from the [Brazilian Central Bank API](https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json) and updates the on-chain oracle once per day. The monthly CDI rate is converted to a daily compound rate using the formula: `daily_rate = (1 + monthly_cdi)^(1/30) - 1`.
- **Rebaser**: A cronjob or script that calls `updateCDI()` and triggers `rebase()` daily to maintain the yield simulation.

---

## 🧪 MVP Features

- ✅ Connect wallet using MetaMask or WalletConnect
- ✅ View current token balance (auto-increasing via rebase)
- ✅ Admin-only button to trigger `rebase()`
- ✅ Display the current CDI rate from the on-chain oracle

---

## 📂 Folder Structure

```
/frontend
├── /components       # UI components like WalletConnect, TokenPanel
├── /lib              # wagmi setup, ABI files, constants
├── /pages            # Next.js pages
├── /styles           # Tailwind CSS
├── .env.local        # Alchemy key (not committed)
├── README.md
```

---

## 🚀 Getting Started

### Option 1: Docker (Recommended)

1. Clone the repo
2. Start development environment:

```bash
# Using Makefile (recommended)
make up-dev

# Or using Docker Compose directly
docker-compose up -d frontend-dev
```

3. Access the application at http://localhost:3001

4. View logs:
```bash
make logs-frontend-dev
```

### Option 2: Local Development

1. Clone the repo
2. Install dependencies:

```bash
npm install
```

3. Add your Alchemy key to `.env.local`

4. Run the dev server:

```bash
npm run dev
```

### Docker Commands

```bash
# Show all available Docker commands
make help

# Development
make up-dev         # Start development environment
make build-dev      # Build development image
make logs-frontend-dev  # View logs

# Oracle Service
make up-oracle      # Start oracle service only
make oracle-logs    # View oracle service logs
make oracle-manual  # Trigger manual CDI update
make oracle-status  # Check oracle service status

# Production
make build          # Build production image
make up             # Start production environment
make deploy-prod    # Deploy to production

# Maintenance
make down           # Stop all services
make clean          # Clean up containers and images
```

For detailed Docker documentation, see [README-Docker.md](README-Docker.md).

### Oracle Service Setup

The CDI Oracle Service is included in the Docker setup and will automatically start with the development environment. To configure it:

1. **Set environment variables** in your `.env` file:
```bash
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ORACLE_PRIVATE_KEY=your_private_key_here
CDI_ORACLE_ADDRESS=0x... # Address of deployed CDI Oracle contract
```

2. **Start the oracle service**:
```bash
make up-oracle
```

3. **Monitor the service**:
```bash
make oracle-logs
```

For detailed oracle service documentation, see [oracle-service/README.md](oracle-service/README.md).

---

## 🧪 Testing

```bash
# Run contract tests
npm run test

# Run frontend tests
npm run test:frontend
```

---

## 🚀 Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts on Etherscan
npm run verify:sepolia
```

---

## 🔧 API Integration

The CDI rate is fetched from the Brazilian Central Bank API:

- **Latest Rate:** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json`
- **Historical Data:** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA`

The monthly CDI rate is converted to daily compound rate: `daily_rate = (1 + monthly_cdi)^(1/30) - 1`

---

## 👨‍💼 Admin Functions

- `updateCDI(uint256 newRate)`: Update the CDI rate (admin only)
- `rebase()`: Trigger daily rebase (admin only)
- `setAdmin(address newAdmin)`: Transfer admin role (admin only)

---

## 📜 License

MIT (for code), simulation only — no real funds involved.

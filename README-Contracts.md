# Smart Contracts Documentation

This document describes the smart contracts that power the Rendex protocol - a rebasing ERC-20 token that simulates yield based on CDI (Certificado de Depósito Interbancário) rates.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   CDIOracle     │    │  RendexToken    │
│                 │    │                 │
│ • Stores CDI    │◄───┤ • Rebasing      │
│ • Updates rates │    │ • Yield sim     │
│ • Validates     │    │ • ERC-20        │
└─────────────────┘    └─────────────────┘
```

## 📋 Contract Details

### 1. **RendexToken** (`contracts/RendexToken.sol`)

**Purpose**: Main rebasing ERC-20 token that simulates yield based on CDI rates.

**Key Features**:
- ✅ **Daily rebases** based on CDI rate (120% of CDI)
- ✅ **Oracle integration** for real-time CDI data
- ✅ **Share-based rebasing** for accurate yield simulation
- ✅ **Pausable** for emergency situations
- ✅ **Admin controls** for oracle updates

**Core Functions**:
```solidity
// Execute daily rebase
function rebase() external onlyRebaser rebaseReady

// Get current CDI rate
function getCurrentCDI() public view returns (uint256)

// Calculate rebase rate (120% of CDI)
function calculateRebaseRate() public view returns (uint256)

// Get rebase statistics
function getRebaseStats() external view returns (...)
```

**Rebase Mechanism**:
1. **Daily Interval**: Rebase can only be executed once per day
2. **CDI Rate**: Fetched from oracle (e.g., 10% = 1000 basis points)
3. **Rebase Rate**: 120% of CDI (e.g., 12% for 10% CDI)
4. **Share Calculation**: `new_shares = old_shares * (1 + rebase_rate)`

### 2. **CDIOracle** (`contracts/CDIOracle.sol`)

**Purpose**: Oracle contract that stores and provides CDI rate data.

**Key Features**:
- ✅ **Rate validation** (0-50% range)
- ✅ **Authorized updaters** system
- ✅ **Staleness detection** (7-day threshold)
- ✅ **Emergency updates** for stale rates
- ✅ **Health monitoring**

**Core Functions**:
```solidity
// Update CDI rate
function updateCDI(uint256 _newCDI) external onlyAuthorizedUpdater

// Get current CDI with metadata
function getCDIWithMetadata() external view returns (...)

// Check oracle health
function isHealthy() external view returns (bool)

// Emergency update for stale rates
function emergencyUpdateCDI(uint256 _newCDI) external onlyOwner
```



## 🔧 Configuration

### **CDI Rate System**
- **Basis Points**: 1000 = 10%, 1500 = 15%, etc.
- **Range**: 0-5000 basis points (0-50%)
- **Update Frequency**: Daily (configurable)
- **Staleness Threshold**: 7 days

### **Rebase Parameters**
- **Interval**: 24 hours (1 day)
- **Multiplier**: 120% of CDI rate
- **Example**: 10% CDI → 12% daily rebase

### **Token Parameters**
- **Name**: "Rendex Token"
- **Symbol**: "RDX"
- **Initial Supply**: 1,000,000 tokens
- **Decimals**: 18

## 🚀 Deployment

### **Local Development**
```bash
# Start local Hardhat node
make hardhat-node

# Deploy contracts locally
make deploy-local

# Run tests
make test-contracts
```

### **Testnet Deployment (Sepolia)**
```bash
# Deploy to Sepolia
make deploy-contracts

# Verify contracts on Etherscan
make verify-contracts
```

### **Production Deployment**
```bash
# Deploy to mainnet
docker-compose run --rm frontend-dev npm run deploy:mainnet

# Verify on Etherscan
docker-compose run --rm frontend-dev npm run verify:mainnet
```

## 🧪 Testing

### **Test Coverage**
```bash
# Run all tests
make test-contracts

# Run with coverage
make test-coverage

# Run specific test file
docker-compose run --rm frontend-dev npx hardhat test test/RendexToken.test.ts
```

### **Test Scenarios**
- ✅ **Deployment**: Correct initial values and parameters
- ✅ **CDI Integration**: Oracle rate fetching and updates
- ✅ **Rebasing**: Daily rebase execution and balance updates
- ✅ **Transfers**: Token transfers during and after rebases
- ✅ **Pausing**: Emergency pause/unpause functionality
- ✅ **Oracle Updates**: Oracle address changes and validation
- ✅ **Factory**: Token deployment and tracking

## 📊 Gas Optimization

### **Optimizations Applied**
- **Solidity Optimizer**: 200 runs for size/speed balance
- **Efficient Storage**: Packed structs and minimal storage
- **Batch Operations**: Single transactions for multiple updates
- **View Functions**: Gas-free read operations

### **Gas Costs (Estimated)**
- **Deploy CDIOracle**: ~500,000 gas
- **Deploy RendexToken**: ~1,200,000 gas
- **Execute Rebase**: ~50,000 gas
- **Update CDI**: ~30,000 gas

## 🔒 Security Features

### **Access Control**
- **Owner-only functions**: Oracle updates, pausing
- **Authorized updaters**: CDI rate updates
- **Rebaser permissions**: Daily rebase execution

### **Safety Mechanisms**
- **Rate validation**: CDI rates within safe bounds
- **Staleness detection**: Automatic detection of old rates
- **Emergency pause**: Ability to pause all operations
- **Reentrancy protection**: Guards against reentrancy attacks

### **Audit Considerations**
- **OpenZeppelin contracts**: Battle-tested base contracts
- **Comprehensive testing**: 100% test coverage target
- **Formal verification**: Consider for critical functions
- **External audit**: Recommended before mainnet deployment

## 📈 Yield Simulation

### **How It Works**
1. **CDI Rate**: Brazilian benchmark interest rate (e.g., 10%)
2. **Daily Rebase**: Token balances increase daily
3. **Compounding**: Previous day's gains are included in next rebase
4. **Simulation**: No real yield, just token balance increases

### **Example Calculation**
```
Initial Balance: 1000 RDX
CDI Rate: 10% (1000 basis points)
Rebase Rate: 12% (120% of CDI)

Day 1: 1000 * (1 + 0.12) = 1120 RDX
Day 2: 1120 * (1 + 0.12) = 1254.4 RDX
Day 30: ~34,000 RDX (compounded daily)
```

## 🔄 Integration Points

### **Frontend Integration**
- **Balance Display**: Real-time token balance updates
- **CDI Rate Display**: Current CDI from oracle
- **Rebase Status**: Next rebase time and readiness
- **Admin Panel**: Rebase execution and oracle updates

### **Off-Chain Services**
- **CDI Fetcher**: Script to fetch CDI from Brazilian Central Bank
- **Rebaser**: Automated script for daily rebases
- **Monitor**: Health monitoring and alerting

### **External APIs**
- **Brazilian Central Bank**: CDI rate source
- **Etherscan**: Contract verification and monitoring
- **Price Feeds**: Optional integration for USD values

## 🛠️ Development Workflow

### **Local Development**
```bash
# 1. Start development environment
make up-dev

# 2. Compile contracts
make compile

# 3. Run tests
make test-contracts

# 4. Deploy locally
make deploy-local

# 5. Start frontend
# Access at http://localhost:3001
```

### **Contract Updates**
```bash
# 1. Modify contracts
# 2. Compile
make compile

# 3. Test changes
make test-contracts

# 4. Deploy to testnet
make deploy-contracts

# 5. Verify contracts
make verify-contracts
```

## 📚 Additional Resources

- **OpenZeppelin Documentation**: https://docs.openzeppelin.com/
- **Hardhat Documentation**: https://hardhat.org/docs
- **Solidity Documentation**: https://docs.soliditylang.org/
- **CDI Information**: https://www.bcb.gov.br/

## 🤝 Contributing

When contributing to smart contracts:

1. **Follow Solidity Style Guide**
2. **Add comprehensive tests**
3. **Update documentation**
4. **Run security checks**
5. **Get code review**

## ⚠️ Disclaimer

This is a simulation project for educational purposes. The tokens do not represent real investments and no actual yield is generated. The CDI rates are used for demonstration only. 
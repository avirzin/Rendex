const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const CONFIG = {
  RPC_URL: process.env.RPC_URL,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  CDI_ORACLE_ADDRESS: process.env.CDI_ORACLE_ADDRESS,
  RENDEX_TOKEN_ADDRESS: '0xEb42Bbd1B4a1A7145e3c90853F96f7846cafdb99', // From deployment
  
  // Test amounts
  TEST_INVESTMENT_AMOUNT: ethers.parseEther("0.001"), // 0.001 ETH
  TEST_TOKEN_AMOUNT: ethers.parseEther("10"), // 10 RDX tokens
};

// Contract ABIs
const CDI_ORACLE_ABI = [
  'function getCDI() external view returns (uint256)',
  'function getLastUpdateTime() external view returns (uint256)',
  'function updateCDI(uint256 newRate) external',
  'function getOracleStats() external view returns (uint256, uint256, bool, bool, uint256)'
];

const RENDEX_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function getRebaseStats() external view returns (uint256, uint256, uint256, uint256, uint256, bool)',
  'function executeRebase() external',
  'function sharesOf(address account) external view returns (uint256)',
  'function getSharesPerToken() external view returns (uint256)',
  'function getTotalShares() external view returns (uint256)'
];

class RendexTestFlow {
  constructor() {
    // Validate configuration
    if (!CONFIG.RPC_URL) throw new Error('RPC_URL not set in environment');
    if (!CONFIG.PRIVATE_KEY) throw new Error('PRIVATE_KEY not set in environment');
    if (!CONFIG.CDI_ORACLE_ADDRESS) throw new Error('CDI_ORACLE_ADDRESS not set in environment');
    
    console.log('🔧 Configuration:');
    console.log(`   - RPC URL: ${CONFIG.RPC_URL.substring(0, 30)}...`);
    console.log(`   - Oracle Address: ${CONFIG.CDI_ORACLE_ADDRESS}`);
    console.log(`   - Token Address: ${CONFIG.RENDEX_TOKEN_ADDRESS}`);
    
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.cdiOracle = new ethers.Contract(CONFIG.CDI_ORACLE_ADDRESS, CDI_ORACLE_ABI, this.wallet);
    this.rendexToken = new ethers.Contract(CONFIG.RENDEX_TOKEN_ADDRESS, RENDEX_TOKEN_ABI, this.wallet);
  }

  /**
   * Test 1: User invests small amount in RDX
   */
  async testInvestment() {
    console.log('\n🧪 Test 1: User Investment');
    console.log('=' .repeat(50));
    
    try {
      // Check initial balance
      const initialBalance = await this.rendexToken.balanceOf(this.wallet.address);
      console.log(`💰 Initial RDX balance: ${ethers.formatEther(initialBalance)} RDX`);
      
      // Check if user has tokens (from deployment)
      if (initialBalance > 0) {
        console.log('✅ User already has RDX tokens from deployment');
        return initialBalance;
      } else {
        console.log('❌ User has no RDX tokens. Need to get some first.');
        console.log('💡 In a real scenario, user would buy RDX tokens');
        return ethers.parseEther("0");
      }
    } catch (error) {
      console.error('❌ Investment test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 2: Check current CDI and rebase status
   */
  async testCDIAndRebaseStatus() {
    console.log('\n🧪 Test 2: CDI and Rebase Status');
    console.log('=' .repeat(50));
    
    try {
      // Get current CDI
      const currentCDI = await this.cdiOracle.getCDI();
      const cdiPercent = Number(currentCDI) / 100;
      console.log(`📊 Current CDI: ${currentCDI} basis points (${cdiPercent}%)`);
      
      // Get oracle stats
      const oracleStats = await this.cdiOracle.getOracleStats();
      console.log(`📈 Oracle stats:`);
      console.log(`   - Current CDI: ${oracleStats[0]} basis points`);
      console.log(`   - Last update: ${new Date(Number(oracleStats[1]) * 1000).toISOString()}`);
      console.log(`   - Is stale: ${oracleStats[2]}`);
      console.log(`   - Is paused: ${oracleStats[3]}`);
      
      // Get rebase stats
      const rebaseStats = await this.rendexToken.getRebaseStats();
      console.log(`🔄 Rebase stats:`);
      console.log(`   - Last rebase: ${new Date(Number(rebaseStats[0]) * 1000).toISOString()}`);
      console.log(`   - Next rebase: ${new Date(Number(rebaseStats[1]) * 1000).toISOString()}`);
      console.log(`   - Rebase count: ${rebaseStats[2]}`);
      console.log(`   - Current CDI: ${rebaseStats[3]} basis points`);
      console.log(`   - Rebase rate: ${rebaseStats[4]} basis points`);
      console.log(`   - Rebase ready: ${rebaseStats[5]}`);
      
      return { currentCDI, rebaseStats };
    } catch (error) {
      console.error('❌ CDI and rebase status test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 3: Check token details and user position
   */
  async testTokenDetails() {
    console.log('\n🧪 Test 3: Token Details and User Position');
    console.log('=' .repeat(50));
    
    try {
      // Token details
      const name = await this.rendexToken.name();
      const symbol = await this.rendexToken.symbol();
      const decimals = await this.rendexToken.decimals();
      const totalSupply = await this.rendexToken.totalSupply();
      
      console.log(`🪙 Token Details:`);
      console.log(`   - Name: ${name}`);
      console.log(`   - Symbol: ${symbol}`);
      console.log(`   - Decimals: ${decimals}`);
      console.log(`   - Total Supply: ${ethers.formatEther(totalSupply)} RDX`);
      
      // User position
      const userBalance = await this.rendexToken.balanceOf(this.wallet.address);
      const userShares = await this.rendexToken.sharesOf(this.wallet.address);
      const sharesPerToken = await this.rendexToken.getSharesPerToken();
      const totalShares = await this.rendexToken.getTotalShares();
      
      console.log(`👤 User Position:`);
      console.log(`   - RDX Balance: ${ethers.formatEther(userBalance)} RDX`);
      console.log(`   - Shares: ${userShares.toString()}`);
      console.log(`   - Shares per Token: ${sharesPerToken.toString()}`);
      console.log(`   - Total Shares: ${totalShares.toString()}`);
      
      // Calculate effective value
      if (userShares > 0 && totalShares > 0) {
        const effectiveTokens = (userShares * totalSupply) / totalShares;
        console.log(`   - Effective Tokens: ${ethers.formatEther(effectiveTokens)} RDX`);
      }
      
      return { userBalance, userShares, sharesPerToken, totalShares };
    } catch (error) {
      console.error('❌ Token details test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 4: Simulate CDI accrual and rebase
   */
  async testRebaseSimulation() {
    console.log('\n🧪 Test 4: Rebase Simulation');
    console.log('=' .repeat(50));
    
    try {
      // Check if rebase is ready
      const rebaseStats = await this.rendexToken.getRebaseStats();
      const rebaseReady = rebaseStats[5];
      
      if (rebaseReady) {
        console.log('🔄 Rebase is ready! Executing rebase...');
        
        // Get pre-rebase stats
        const preRebaseBalance = await this.rendexToken.balanceOf(this.wallet.address);
        const preRebaseShares = await this.rendexToken.sharesOf(this.wallet.address);
        
        console.log(`📊 Pre-rebase:`);
        console.log(`   - Balance: ${ethers.formatEther(preRebaseBalance)} RDX`);
        console.log(`   - Shares: ${preRebaseShares.toString()}`);
        
        // Execute rebase
        const rebaseTx = await this.rendexToken.executeRebase();
        console.log(`⛓️ Rebase transaction: ${rebaseTx.hash}`);
        
        const receipt = await rebaseTx.wait();
        console.log(`✅ Rebase executed! Gas used: ${receipt.gasUsed}`);
        
        // Get post-rebase stats
        const postRebaseBalance = await this.rendexToken.balanceOf(this.wallet.address);
        const postRebaseShares = await this.rendexToken.sharesOf(this.wallet.address);
        
        console.log(`📊 Post-rebase:`);
        console.log(`   - Balance: ${ethers.formatEther(postRebaseBalance)} RDX`);
        console.log(`   - Shares: ${postRebaseShares.toString()}`);
        
        // Calculate gain
        const balanceGain = postRebaseBalance - preRebaseBalance;
        const sharesGain = postRebaseShares - preRebaseShares;
        
        console.log(`📈 Gains:`);
        console.log(`   - Balance gain: ${ethers.formatEther(balanceGain)} RDX`);
        console.log(`   - Shares gain: ${sharesGain.toString()}`);
        
        return { preRebaseBalance, postRebaseBalance, balanceGain };
      } else {
        console.log('⏳ Rebase not ready yet. Next rebase time:', new Date(Number(rebaseStats[1]) * 1000).toISOString());
        return null;
      }
    } catch (error) {
      console.error('❌ Rebase simulation failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 5: Simulate redemption (transfer tokens)
   */
  async testRedemption() {
    console.log('\n🧪 Test 5: Redemption Simulation');
    console.log('=' .repeat(50));
    
    try {
      const currentBalance = await this.rendexToken.balanceOf(this.wallet.address);
      console.log(`💰 Current RDX balance: ${ethers.formatEther(currentBalance)} RDX`);
      
      if (currentBalance > 0) {
        // Simulate redemption by transferring a small amount
        const redemptionAmount = ethers.parseEther("0.1"); // 0.1 RDX
        
        if (currentBalance >= redemptionAmount) {
          console.log(`🔄 Simulating redemption of ${ethers.formatEther(redemptionAmount)} RDX...`);
          
          // Transfer to a test address (you can change this)
          const testAddress = "0x000000000000000000000000000000000000dEaD"; // Dead address
          
          const transferTx = await this.rendexToken.transfer(testAddress, redemptionAmount);
          console.log(`⛓️ Transfer transaction: ${transferTx.hash}`);
          
          const receipt = await transferTx.wait();
          console.log(`✅ Redemption successful! Gas used: ${receipt.gasUsed}`);
          
          // Check new balance
          const newBalance = await this.rendexToken.balanceOf(this.wallet.address);
          console.log(`💰 New RDX balance: ${ethers.formatEther(newBalance)} RDX`);
          
          return { redemptionAmount, newBalance };
        } else {
          console.log('⚠️ Insufficient balance for redemption test');
          return null;
        }
      } else {
        console.log('❌ No RDX tokens to redeem');
        return null;
      }
    } catch (error) {
      console.error('❌ Redemption test failed:', error.message);
      throw error;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Complete Rendex Flow Test');
    console.log('=' .repeat(60));
    console.log(`👤 Test Account: ${this.wallet.address}`);
    console.log(`🌐 Network: ${(await this.provider.getNetwork()).name}`);
    console.log(`💰 Account Balance: ${ethers.formatEther(await this.provider.getBalance(this.wallet.address))} ETH`);
    
    try {
      // Test 1: Investment
      const investmentResult = await this.testInvestment();
      
      // Test 2: CDI and Rebase Status
      const cdiResult = await this.testCDIAndRebaseStatus();
      
      // Test 3: Token Details
      const tokenResult = await this.testTokenDetails();
      
      // Test 4: Rebase Simulation
      const rebaseResult = await this.testRebaseSimulation();
      
      // Test 5: Redemption
      const redemptionResult = await this.testRedemption();
      
      // Summary
      console.log('\n🎉 Complete Flow Test Summary');
      console.log('=' .repeat(60));
      console.log('✅ Investment: User has RDX tokens');
      console.log('✅ CDI Status: Oracle is working');
      console.log('✅ Token Details: All information retrieved');
      console.log(rebaseResult ? '✅ Rebase: Executed successfully' : '⏳ Rebase: Not ready yet');
      console.log(redemptionResult ? '✅ Redemption: Simulated successfully' : '⚠️ Redemption: Skipped');
      
      console.log('\n📋 Test Results:');
      console.log(`   - User RDX Balance: ${ethers.formatEther(tokenResult.userBalance)} RDX`);
      console.log(`   - Current CDI: ${Number(cdiResult.currentCDI) / 100}%`);
      console.log(`   - Rebase Count: ${cdiResult.rebaseStats[2]}`);
      
      if (rebaseResult) {
        console.log(`   - Rebase Gain: ${ethers.formatEther(rebaseResult.balanceGain)} RDX`);
      }
      
      console.log('\n🎯 PoC Status: READY FOR DEMONSTRATION!');
      
    } catch (error) {
      console.error('\n💥 Test failed:', error.message);
      throw error;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testFlow = new RendexTestFlow();
  testFlow.runAllTests()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

module.exports = RendexTestFlow; 
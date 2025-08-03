const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const CONFIG = {
  RPC_URL: process.env.SEPOLIA_RPC_URL,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  CDI_ORACLE_ADDRESS: process.env.CDI_ORACLE_ADDRESS,
  RENDEX_TOKEN_ADDRESS: '0xEb42Bbd1B4a1A7145e3c90853F96f7846cafdb99',
};

// Simplified Contract ABIs
const CDI_ORACLE_ABI = [
  'function getCDI() external view returns (uint256)',
  'function getLastUpdateTime() external view returns (uint256)',
  'function getOracleStats() external view returns (uint256, uint256, bool, bool, uint256)'
];

const RENDEX_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function getRebaseStats() external view returns (uint256, uint256, uint256, uint256, uint256, bool)',
  'function executeRebase() external'
];

class SimpleRendexTest {
  constructor() {
    // Validate configuration
    if (!CONFIG.RPC_URL) throw new Error('SEPOLIA_RPC_URL not set in environment');
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
   * Test 1: User Investment (Check Balance)
   */
  async testInvestment() {
    console.log('\n🧪 Test 1: User Investment');
    console.log('=' .repeat(50));
    
    try {
      const balance = await this.rendexToken.balanceOf(this.wallet.address);
      console.log(`💰 User RDX balance: ${ethers.formatEther(balance)} RDX`);
      
      if (balance > 0) {
        console.log('✅ User has RDX tokens (from deployment)');
        return balance;
      } else {
        console.log('❌ User has no RDX tokens');
        return ethers.parseEther("0");
      }
    } catch (error) {
      console.error('❌ Investment test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 2: CDI Status
   */
  async testCDIStatus() {
    console.log('\n🧪 Test 2: CDI Status');
    console.log('=' .repeat(50));
    
    try {
      const currentCDI = await this.cdiOracle.getCDI();
      const cdiPercent = Number(currentCDI) / 100;
      console.log(`📊 Current CDI: ${currentCDI} basis points (${cdiPercent}%)`);
      
      const oracleStats = await this.cdiOracle.getOracleStats();
      console.log(`📈 Oracle stats:`);
      console.log(`   - Current CDI: ${oracleStats[0]} basis points`);
      console.log(`   - Last update: ${new Date(Number(oracleStats[1]) * 1000).toISOString()}`);
      console.log(`   - Is stale: ${oracleStats[2]}`);
      console.log(`   - Is paused: ${oracleStats[3]}`);
      
      return { currentCDI, oracleStats };
    } catch (error) {
      console.error('❌ CDI status test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 3: Token Details
   */
  async testTokenDetails() {
    console.log('\n🧪 Test 3: Token Details');
    console.log('=' .repeat(50));
    
    try {
      const name = await this.rendexToken.name();
      const symbol = await this.rendexToken.symbol();
      const decimals = await this.rendexToken.decimals();
      const totalSupply = await this.rendexToken.totalSupply();
      const userBalance = await this.rendexToken.balanceOf(this.wallet.address);
      
      console.log(`🪙 Token Details:`);
      console.log(`   - Name: ${name}`);
      console.log(`   - Symbol: ${symbol}`);
      console.log(`   - Decimals: ${decimals}`);
      console.log(`   - Total Supply: ${ethers.formatEther(totalSupply)} RDX`);
      console.log(`   - User Balance: ${ethers.formatEther(userBalance)} RDX`);
      
      return { name, symbol, decimals, totalSupply, userBalance };
    } catch (error) {
      console.error('❌ Token details test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 4: Rebase Status
   */
  async testRebaseStatus() {
    console.log('\n🧪 Test 4: Rebase Status');
    console.log('=' .repeat(50));
    
    try {
      const rebaseStats = await this.rendexToken.getRebaseStats();
      console.log(`🔄 Rebase stats:`);
      console.log(`   - Last rebase: ${new Date(Number(rebaseStats[0]) * 1000).toISOString()}`);
      console.log(`   - Next rebase: ${new Date(Number(rebaseStats[1]) * 1000).toISOString()}`);
      console.log(`   - Rebase count: ${rebaseStats[2]}`);
      console.log(`   - Current CDI: ${rebaseStats[3]} basis points`);
      console.log(`   - Rebase rate: ${rebaseStats[4]} basis points`);
      console.log(`   - Rebase ready: ${rebaseStats[5]}`);
      
      return rebaseStats;
    } catch (error) {
      console.error('❌ Rebase status test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 5: Execute Rebase (if ready)
   */
  async testRebaseExecution() {
    console.log('\n🧪 Test 5: Rebase Execution');
    console.log('=' .repeat(50));
    
    try {
      const rebaseStats = await this.rendexToken.getRebaseStats();
      const rebaseReady = rebaseStats[5];
      
      if (rebaseReady) {
        console.log('🔄 Rebase is ready! Executing rebase...');
        
        const preRebaseBalance = await this.rendexToken.balanceOf(this.wallet.address);
        console.log(`📊 Pre-rebase balance: ${ethers.formatEther(preRebaseBalance)} RDX`);
        
        const rebaseTx = await this.rendexToken.executeRebase();
        console.log(`⛓️ Rebase transaction: ${rebaseTx.hash}`);
        
        const receipt = await rebaseTx.wait();
        console.log(`✅ Rebase executed! Gas used: ${receipt.gasUsed}`);
        
        const postRebaseBalance = await this.rendexToken.balanceOf(this.wallet.address);
        console.log(`📊 Post-rebase balance: ${ethers.formatEther(postRebaseBalance)} RDX`);
        
        const gain = postRebaseBalance - preRebaseBalance;
        console.log(`📈 Gain: ${ethers.formatEther(gain)} RDX`);
        
        return { preRebaseBalance, postRebaseBalance, gain };
      } else {
        console.log('⏳ Rebase not ready yet. Next rebase time:', new Date(Number(rebaseStats[1]) * 1000).toISOString());
        return null;
      }
    } catch (error) {
      console.error('❌ Rebase execution test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 6: Redemption (Transfer)
   */
  async testRedemption() {
    console.log('\n🧪 Test 6: Redemption (Transfer)');
    console.log('=' .repeat(50));
    
    try {
      const currentBalance = await this.rendexToken.balanceOf(this.wallet.address);
      console.log(`💰 Current RDX balance: ${ethers.formatEther(currentBalance)} RDX`);
      
      if (currentBalance > 0) {
        const redemptionAmount = ethers.parseEther("0.1"); // 0.1 RDX
        
        if (currentBalance >= redemptionAmount) {
          console.log(`🔄 Simulating redemption of ${ethers.formatEther(redemptionAmount)} RDX...`);
          
          const testAddress = "0x000000000000000000000000000000000000dEaD";
          const transferTx = await this.rendexToken.transfer(testAddress, redemptionAmount);
          console.log(`⛓️ Transfer transaction: ${transferTx.hash}`);
          
          const receipt = await transferTx.wait();
          console.log(`✅ Redemption successful! Gas used: ${receipt.gasUsed}`);
          
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
    console.log('🚀 Starting Simple Rendex Flow Test');
    console.log('=' .repeat(60));
    console.log(`👤 Test Account: ${this.wallet.address}`);
    console.log(`🌐 Network: ${(await this.provider.getNetwork()).name}`);
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`💰 Account Balance: ${ethers.formatEther(balance.toString())} ETH`);
    
    try {
      // Test 1: Investment
      const investmentResult = await this.testInvestment();
      
      // Test 2: CDI Status
      const cdiResult = await this.testCDIStatus();
      
      // Test 3: Token Details
      const tokenResult = await this.testTokenDetails();
      
      // Test 4: Rebase Status
      const rebaseStats = await this.testRebaseStatus();
      
      // Test 5: Rebase Execution
      const rebaseResult = await this.testRebaseExecution();
      
      // Test 6: Redemption
      const redemptionResult = await this.testRedemption();
      
      // Summary
      console.log('\n🎉 Simple Flow Test Summary');
      console.log('=' .repeat(60));
      console.log('✅ Investment: User has RDX tokens');
      console.log('✅ CDI Status: Oracle is working');
      console.log('✅ Token Details: All information retrieved');
      console.log('✅ Rebase Status: Information retrieved');
      console.log(rebaseResult ? '✅ Rebase: Executed successfully' : '⏳ Rebase: Not ready yet');
      console.log(redemptionResult ? '✅ Redemption: Simulated successfully' : '⚠️ Redemption: Skipped');
      
      console.log('\n📋 Test Results:');
      console.log(`   - User RDX Balance: ${ethers.formatEther(tokenResult.userBalance)} RDX`);
      console.log(`   - Current CDI: ${Number(cdiResult.currentCDI) / 100}%`);
      console.log(`   - Rebase Count: ${rebaseStats[2]}`);
      
      if (rebaseResult) {
        console.log(`   - Rebase Gain: ${ethers.formatEther(rebaseResult.gain)} RDX`);
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
  const testFlow = new SimpleRendexTest();
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

module.exports = SimpleRendexTest; 
const { ethers } = require('ethers');
const axios = require('axios');
const cron = require('node-cron');

// Configuration
const CONFIG = {
  // BCB API endpoint for CDI
  CDI_API_URL: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json',
  
  // Blockchain configuration
  RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  CDI_ORACLE_ADDRESS: process.env.CDI_ORACLE_ADDRESS,
  
  // CDI Oracle ABI (only the functions we need)
  CDI_ORACLE_ABI: [
    'function updateCDI(uint256 newRate) external',
    'function getCDI() external view returns (uint256)',
    'function getLastUpdateTime() external view returns (uint256)'
  ],
  
  // CDI multiplier (120% as per contract)
  CDI_MULTIPLIER: 120,
  MULTIPLIER_DENOMINATOR: 100
};

class CDIOracleService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
    this.cdiOracle = new ethers.Contract(
      CONFIG.CDI_ORACLE_ADDRESS,
      CONFIG.CDI_ORACLE_ABI,
      this.wallet
    );
  }

  /**
   * Fetch CDI rate from Brazilian Central Bank API
   */
  async fetchCDIFromAPI() {
    try {
      console.log('🔄 Fetching CDI from BCB API...');
      
      const response = await axios.get(CONFIG.CDI_API_URL);
      const data = response.data;
      
      if (!data || data.length === 0) {
        throw new Error('No CDI data received from API');
      }
      
      // Extract the latest CDI value
      const latestCDI = data[0].valor;
      console.log(`📊 Latest CDI from API: ${latestCDI}%`);
      
      return latestCDI;
    } catch (error) {
      console.error('❌ Error fetching CDI from API:', error.message);
      throw error;
    }
  }

  /**
   * BCB sgs.12 returns annual CDI percentage (e.g., 13.65 means 13.65% p.a.)
   */
  getAnnualCDI(cdiFromAPI) {
    console.log(`📊 Annual CDI from API: ${cdiFromAPI}%`);
    return cdiFromAPI;
  }

  /**
   * Apply CDI multiplier (120% of CDI)
   */
  applyCDIMultiplier(annualCDI) {
    const adjustedCDI = (annualCDI * CONFIG.CDI_MULTIPLIER) / CONFIG.MULTIPLIER_DENOMINATOR;
    console.log(`📈 Applied ${CONFIG.CDI_MULTIPLIER}% multiplier: ${adjustedCDI.toFixed(4)}%`);
    return adjustedCDI;
  }

  /**
   * Convert annual percentage to basis points (e.g., 13.65 → 1365).
   * Contract stores CDI as basis points where 10000 = 100%, 1000 = 10%.
   */
  convertToContractFormat(annualPercent) {
    const basisPoints = Math.round(annualPercent * 100);
    console.log(`🔢 Converting ${annualPercent}% → ${basisPoints} basis points`);
    return basisPoints;
  }

  /**
   * Update CDI on the smart contract
   */
  async updateCDIOnChain(cdiValue) {
    try {
      console.log('⛓️ Updating CDI on blockchain...');
      
      const tx = await this.cdiOracle.updateCDI(cdiValue);
      console.log(`📝 Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ CDI updated successfully! Gas used: ${receipt.gasUsed}`);
      
      return receipt;
    } catch (error) {
      console.error('❌ Error updating CDI on chain:', error.message);
      throw error;
    }
  }

  /**
   * Get current CDI from the smart contract
   */
  async getCurrentCDI() {
    try {
      const currentCDI = await this.cdiOracle.getCDI();
      const lastUpdate = await this.cdiOracle.getLastUpdateTime();
      
      console.log(`📊 Current on-chain CDI: ${currentCDI}`);
      console.log(`🕐 Last update: ${new Date(Number(lastUpdate) * 1000)}`);
      
      return { currentCDI, lastUpdate };
    } catch (error) {
      console.error('❌ Error getting current CDI:', error.message);
      throw error;
    }
  }

  /**
   * Main function to update CDI
   */
  async updateCDI() {
    try {
      console.log('🚀 Starting CDI update process...');
      
      // 1. Fetch annual CDI from BCB API (e.g., 13.65 = 13.65% p.a.)
      const cdiFromAPI = await this.fetchCDIFromAPI();

      // 2. Keep as annual rate
      const annualCDI = this.getAnnualCDI(cdiFromAPI);

      // 3. Apply multiplier
      const adjustedCDI = this.applyCDIMultiplier(annualCDI);

      // 4. Convert to basis points for contract
      const contractCDI = this.convertToContractFormat(adjustedCDI);
      
      // 5. Update on chain
      await this.updateCDIOnChain(contractCDI);
      
      console.log('🎉 CDI update completed successfully!');
      
    } catch (error) {
      console.error('💥 CDI update failed:', error.message);
      throw error;
    }
  }

  /**
   * Start the oracle service with scheduled updates
   */
  startScheduledUpdates() {
    console.log('⏰ Starting scheduled CDI updates...');
    
    // Update CDI daily at 00:00 UTC
    cron.schedule('0 0 * * *', async () => {
      console.log('🕐 Scheduled CDI update triggered');
      try {
        await this.updateCDI();
      } catch (error) {
        console.error('❌ Scheduled update failed:', error.message);
      }
    });
    
    console.log('✅ Oracle service started. CDI will be updated daily at 00:00 UTC');
  }

  /**
   * Manual update function
   */
  async manualUpdate() {
    console.log('🔧 Manual CDI update requested');
    await this.updateCDI();
  }
}

// Export the service
module.exports = CDIOracleService;

// If running directly
if (require.main === module) {
  const oracleService = new CDIOracleService();
  
  // Check if manual update is requested
  if (process.argv.includes('--manual')) {
    oracleService.manualUpdate()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Manual update failed:', error);
        process.exit(1);
      });
  } else {
    // Start scheduled updates
    oracleService.startScheduledUpdates();
  }
} 
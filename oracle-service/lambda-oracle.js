const { ethers } = require('ethers');
const axios = require('axios');

// Configuration
const CONFIG = {
  // BCB API endpoint for CDI
  CDI_API_URL: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json',
  
  // Blockchain configuration
  RPC_URL: process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
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
   * Convert API percentage to decimal (API returns 13.65, we need 0.1365)
   */
  getDailyCDI(cdiFromAPI) {
    // API returns percentage (e.g., 13.65), convert to decimal (0.1365)
    const dailyCDIDecimal = cdiFromAPI / 100;
    console.log(`📊 CDI from API: ${cdiFromAPI}% → Decimal: ${dailyCDIDecimal}`);
    return dailyCDIDecimal;
  }

  /**
   * Apply CDI multiplier (120% of CDI)
   */
  applyCDIMultiplier(dailyCDI) {
    const adjustedCDI = (dailyCDI * CONFIG.CDI_MULTIPLIER) / CONFIG.MULTIPLIER_DENOMINATOR;
    console.log(`📈 Applied ${CONFIG.CDI_MULTIPLIER}% multiplier: ${adjustedCDI.toFixed(6)}`);
    return adjustedCDI;
  }

  /**
   * Convert decimal to contract format (parts per million - ppm)
   */
  convertToContractFormat(decimalValue) {
    // Convert decimal (e.g., 0.1638) to parts per million (163800)
    // Contract now expects ppm where 10000 = 1%
    // This gives us 4 decimal places of precision for daily rates
    const ppm = Math.floor(decimalValue * 1000000);
    
    console.log(`🔢 Converting ${decimalValue} to ppm: ${ppm}`);
    return ppm;
  }

  /**
   * Update CDI on the smart contract
   */
  async updateCDIOnChain(cdiValue) {
    try {
      console.log('⛓️ Updating CDI on blockchain...');
      
      const tx = await this.cdiOracle.updateCDI(cdiValue);
      console.log(`📝 Transaction hash: ${tx.hash}`);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error('❌ Error updating CDI on chain:', error.message);
      throw error;
    }
  }

  /**
   * Main function to update CDI
   */
  async updateCDI() {
    try {
      console.log('🚀 Starting CDI update process...');
      
      // Fetch CDI from API
      const cdiFromAPI = await this.fetchCDIFromAPI();
      
      // Get daily CDI (already daily rate from API)
      const dailyCDI = this.getDailyCDI(cdiFromAPI);
      
      // Apply multiplier
      const adjustedCDI = this.applyCDIMultiplier(dailyCDI);
      
      // Convert to contract format
      const contractValue = this.convertToContractFormat(adjustedCDI);
      
      // Update on blockchain
      const receipt = await this.updateCDIOnChain(contractValue);
      
      console.log('🎉 CDI update completed successfully!');
      
      return {
        success: true,
        cdiFromAPI,
        dailyCDI,
        adjustedCDI,
        contractValue: contractValue.toString(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      console.error('💥 CDI update failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Lambda handler
exports.handler = async (event, context) => {
  console.log('🔧 Lambda function triggered');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Validate environment variables
    if (!process.env.PRIVATE_KEY || !process.env.CDI_ORACLE_ADDRESS) {
      throw new Error('Missing required environment variables: PRIVATE_KEY or CDI_ORACLE_ADDRESS');
    }
    
    // Create oracle service instance
    const oracleService = new CDIOracleService();
    
    // Update CDI
    const result = await oracleService.updateCDI();
    
    // Return response
    return {
      statusCode: result.success ? 200 : 500,
      body: JSON.stringify(result, null, 2),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
  } catch (error) {
    console.error('💥 Lambda execution failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

// For local testing
if (require.main === module) {
  const oracleService = new CDIOracleService();
  oracleService.updateCDI()
    .then(result => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

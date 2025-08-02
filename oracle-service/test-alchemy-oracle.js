// Test Alchemy SDK in Oracle Service
require('dotenv').config();
const { Alchemy, Network } = require('alchemy-sdk');

async function testOracleWithAlchemy() {
  console.log('🔮 Testing Oracle Service with Alchemy SDK...');
  console.log('===============================================');
  
  try {
    // Check if we're in the oracle service environment
    console.log('🔍 Oracle Service Environment:');
    console.log('- RPC_URL:', process.env.RPC_URL ? 'Set' : 'Not set');
    console.log('- ALCHEMY_API_KEY:', process.env.ALCHEMY_API_KEY ? 'Set' : 'Not set');
    console.log('- CDI_ORACLE_ADDRESS:', process.env.CDI_ORACLE_ADDRESS || 'Not set');
    
    if (!process.env.ALCHEMY_API_KEY) {
      console.error('❌ ALCHEMY_API_KEY not found in oracle service!');
      return;
    }

    // Initialize Alchemy
    const alchemy = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      network: Network.ETH_SEPOLIA,
    });

    console.log('🔄 Testing Alchemy connection from Oracle Service...');
    
    // Test basic connectivity
    const latestBlock = await alchemy.core.getBlockNumber();
    console.log('✅ Latest block from oracle service:', latestBlock);
    
    // Test gas estimation (important for oracle updates)
    const gasPrice = await alchemy.core.getGasPrice();
    console.log('⛽ Gas price for oracle updates:', gasPrice.toString(), 'wei');
    
    // Test if we can get network info
    const network = await alchemy.core.getNetwork();
    console.log('🌐 Network:', network.name);
    
    console.log('===============================================');
    console.log('🎉 Oracle Service Alchemy test passed!');
    console.log('💡 Your oracle can now use Alchemy for blockchain interactions.');
    
  } catch (error) {
    console.error('❌ Oracle Alchemy test failed:', error.message);
  }
}

// Run the test
testOracleWithAlchemy(); 
// Docker-compatible Alchemy test script
const { Alchemy, Network } = require('alchemy-sdk');

async function testAlchemyInDocker() {
  console.log('🐳 Testing Alchemy SDK in Docker environment...');
  console.log('===============================================');
  
  try {
    // Check environment
    console.log('🔍 Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('- API Key present:', process.env.ALCHEMY_API_KEY ? '✅ Yes' : '❌ No');
    
    if (!process.env.ALCHEMY_API_KEY) {
      console.error('❌ ALCHEMY_API_KEY not found!');
      console.log('Make sure to set the environment variable in your Docker container.');
      process.exit(1);
    }

    // Initialize Alchemy
    const alchemy = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      network: Network.ETH_SEPOLIA,
    });

    console.log('🔄 Testing Alchemy connection...');
    
    // Test 1: Get latest block
    const latestBlock = await alchemy.core.getBlockNumber();
    console.log('✅ Latest block:', latestBlock);
    
    // Test 2: Get gas price
    const gasPrice = await alchemy.core.getGasPrice();
    console.log('⛽ Gas price:', gasPrice.toString(), 'wei');
    
    // Test 3: Get network info
    const network = await alchemy.core.getNetwork();
    console.log('🌐 Network:', network.name, '(chainId:', network.chainId, ')');
    
    console.log('===============================================');
    console.log('🎉 All Alchemy tests passed! Docker setup is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Debug info:');
    console.log('- Error type:', error.constructor.name);
    console.log('- API Key length:', process.env.ALCHEMY_API_KEY?.length || 0);
    process.exit(1);
  }
}

// Run the test
testAlchemyInDocker(); 
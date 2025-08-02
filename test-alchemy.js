// Test script to verify Alchemy API key is working
require('dotenv').config();
const { Alchemy, Network } = require('alchemy-sdk');

async function testAlchemyConnection() {
  try {
    // Check if API key is set
    if (!process.env.ALCHEMY_API_KEY) {
      console.error('❌ ALCHEMY_API_KEY not found in environment variables');
      console.log('Make sure you have:');
      console.log('1. Copied env.example to .env');
      console.log('2. Added your actual Alchemy API key to .env');
      return;
    }

    console.log('🔑 API Key found:', process.env.ALCHEMY_API_KEY.substring(0, 10) + '...');

    // Initialize Alchemy
    const alchemy = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      network: Network.ETH_SEPOLIA, // Using Sepolia for testing
    });

    // Test connection by getting latest block
    console.log('🔄 Testing connection to Alchemy...');
    const latestBlock = await alchemy.core.getBlockNumber();
    
    console.log('✅ Connection successful!');
    console.log('📦 Latest block number:', latestBlock);
    console.log('🌐 Network: Sepolia testnet');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('Possible issues:');
    console.log('- Invalid API key');
    console.log('- Network connectivity');
    console.log('- Alchemy service issues');
  }
}

// Run the test
testAlchemyConnection(); 
require('dotenv').config();
const axios = require('axios');

// Test configuration
const CONFIG = {
  CDI_API_URL: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json',
  CDI_MULTIPLIER: 120,
  MULTIPLIER_DENOMINATOR: 100
};

/**
 * Test CDI API connection
 */
async function testCDIAPI() {
  try {
    console.log('🧪 Testing CDI API connection...');
    
    const response = await axios.get(CONFIG.CDI_API_URL);
    const data = response.data;
    
    if (!data || data.length === 0) {
      throw new Error('No CDI data received from API');
    }
    
    const latestCDI = data[0].valor;
    console.log(`✅ CDI API test successful! Latest CDI: ${latestCDI}%`);
    
    return latestCDI;
  } catch (error) {
    console.error('❌ CDI API test failed:', error.message);
    throw error;
  }
}

/**
 * Test rate conversion logic (CDI is already daily)
 */
function testRateConversion(dailyCDI) {
  console.log('🧪 Testing rate conversion logic...');
  
  // CDI from API is already daily rate
  const dailyRatePercentage = parseFloat(dailyCDI);
  
  console.log(`📊 Daily CDI from API: ${dailyCDI}%`);
  console.log(`📊 Daily rate: ${dailyRatePercentage.toFixed(6)}%`);
  
  // Apply multiplier
  const adjustedCDI = (dailyRatePercentage * CONFIG.CDI_MULTIPLIER) / CONFIG.MULTIPLIER_DENOMINATOR;
  console.log(`📈 Adjusted CDI (120%): ${adjustedCDI.toFixed(6)}%`);
  
  // Convert to contract format
  const decimal = adjustedCDI / 100;
  const contractValue = BigInt(Math.floor(decimal * 1e18));
  console.log(`🔢 Contract value: ${contractValue}`);
  
  console.log('✅ Rate conversion test successful!');
  
  return {
    dailyCDI,
    dailyRate: dailyRatePercentage,
    adjustedCDI,
    contractValue
  };
}

/**
 * Test environment variables
 */
function testEnvironment() {
  console.log('🧪 Testing environment variables...');
  
  const requiredVars = ['RPC_URL', 'PRIVATE_KEY', 'CDI_ORACLE_ADDRESS'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.log('   These are required for blockchain interactions');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  return missingVars.length === 0;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Oracle Service Tests...\n');
  
  try {
    // Test 1: Environment variables
    const envOk = testEnvironment();
    console.log('');
    
    // Test 2: CDI API
    const monthlyCDI = await testCDIAPI();
    console.log('');
    
    // Test 3: Rate conversion
    const conversionResult = testRateConversion(monthlyCDI);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`   - Environment: ${envOk ? '✅ OK' : '⚠️  Missing vars'}`);
    console.log(`   - CDI API: ✅ OK (${monthlyCDI}%)`);
    console.log(`   - Rate Conversion: ✅ OK`);
    console.log(`   - Final Contract Value: ${conversionResult.contractValue}`);
    
  } catch (error) {
    console.error('\n💥 Tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testCDIAPI,
  testRateConversion,
  testEnvironment,
  runTests
}; 
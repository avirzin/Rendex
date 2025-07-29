const axios = require('axios');

// BCB API configuration
const BCB_API_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados';
const CDI_SERIES_ID = '12'; // CDI series ID

/**
 * Fetch CDI data from BCB API for a date range
 */
async function fetchCDIData(startDate, endDate) {
  try {
    console.log(`🔄 Fetching CDI data from ${startDate} to ${endDate}...`);
    
    const url = `${BCB_API_BASE}?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;
    console.log(`📡 API URL: ${url}`);
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || data.length === 0) {
      throw new Error('No CDI data received from API');
    }
    
    console.log(`✅ Successfully fetched ${data.length} CDI records`);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching CDI data:', error.message);
    throw error;
  }
}

/**
 * Calculate date range for last 12 months
 */
function getDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);
  
  // Format dates as DD/MM/YYYY for BCB API
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

/**
 * Calculate accumulated rate for the entire period
 */
function calculateAccumulatedRate(data) {
  console.log('\n🧮 Calculating accumulated rate for the entire period...');
  
  // Convert string values to numbers and filter valid data
  const validData = data
    .map(item => ({
      date: item.data,
      value: parseFloat(item.valor)
    }))
    .filter(item => !isNaN(item.value));
  
  if (validData.length === 0) {
    throw new Error('No valid CDI data found for accumulation calculation');
  }
  
  // Sort by date to ensure chronological order
  validData.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateA - dateB;
  });
  
  console.log(`📅 Calculating accumulation for ${validData.length} days`);
  
  // Calculate accumulated rate: (1 + r1) * (1 + r2) * ... * (1 + rn) - 1
  let accumulatedFactor = 1;
  let totalDays = 0;
  
  validData.forEach((item, index) => {
    const dailyRate = item.value / 100; // Convert percentage to decimal
    accumulatedFactor *= (1 + dailyRate);
    totalDays++;
    
    // Log every 50th day for progress tracking
    if ((index + 1) % 50 === 0 || index === validData.length - 1) {
      const currentAccumulated = (accumulatedFactor - 1) * 100;
      console.log(`   Day ${index + 1}: ${item.date} - Rate: ${item.value.toFixed(6)}% - Accumulated: ${currentAccumulated.toFixed(4)}%`);
    }
  });
  
  const accumulatedRate = (accumulatedFactor - 1) * 100;
  
  console.log(`\n📊 Accumulation Summary:`);
  console.log(`   Total Days: ${totalDays}`);
  console.log(`   Final Accumulated Rate: ${accumulatedRate.toFixed(4)}%`);
  console.log(`   Average Daily Rate: ${(accumulatedRate / totalDays).toFixed(6)}%`);
  
  return {
    accumulatedRate,
    totalDays,
    averageDailyRate: accumulatedRate / totalDays,
    dailyRates: validData
  };
}

/**
 * Analyze CDI data and calculate statistics
 */
function analyzeCDIData(data) {
  console.log('\n📊 Analyzing CDI data...');
  
  // Convert string values to numbers and filter valid data
  const validData = data
    .map(item => ({
      date: item.data,
      value: parseFloat(item.valor)
    }))
    .filter(item => !isNaN(item.value));
  
  console.log(`📈 Total valid records: ${validData.length}`);
  
  if (validData.length === 0) {
    throw new Error('No valid CDI data found');
  }
  
  // Calculate statistics
  const values = validData.map(item => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Find latest value
  const latest = validData[validData.length - 1];
  
  // Group by month to calculate monthly averages
  const monthlyData = {};
  validData.forEach(item => {
    const dateParts = item.date.split('/');
    const monthKey = `${dateParts[1]}/${dateParts[2]}`; // MM/YYYY
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(item.value);
  });
  
  // Calculate monthly averages
  const monthlyAverages = Object.entries(monthlyData).map(([month, values]) => ({
    month,
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length
  }));
  
  return {
    totalRecords: validData.length,
    latest: {
      date: latest.date,
      value: latest.value
    },
    statistics: {
      min,
      max,
      average: avg
    },
    monthlyAverages,
    allData: validData
  };
}

/**
 * Convert daily CDI to monthly rate
 */
function convertDailyToMonthly(dailyRate) {
  // Formula: monthly_rate = (1 + daily_rate)^30 - 1
  const dailyDecimal = dailyRate / 100;
  const monthlyDecimal = Math.pow(1 + dailyDecimal, 30) - 1;
  return monthlyDecimal * 100;
}

/**
 * Convert monthly CDI to daily compound rate
 */
function convertMonthlyToDaily(monthlyRate) {
  // Formula: daily_rate = (1 + monthly_rate)^(1/30) - 1
  const monthlyDecimal = monthlyRate / 100;
  const dailyDecimal = Math.pow(1 + monthlyDecimal, 1/30) - 1;
  return dailyDecimal * 100;
}

/**
 * Apply CDI multiplier (120%)
 */
function applyCDIMultiplier(dailyCDI) {
  return (dailyCDI * 120) / 100;
}

/**
 * Display results in a formatted way
 */
function displayResults(analysis, accumulatedData) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CDI ANALYSIS RESULTS (Last 12 Months)');
  console.log('='.repeat(80));
  
  // Latest CDI
  console.log(`\n🎯 LATEST CDI RATE:`);
  console.log(`   Date: ${analysis.latest.date}`);
  console.log(`   Daily Rate: ${analysis.latest.value.toFixed(6)}%`);
  console.log(`   Monthly Rate: ${convertDailyToMonthly(analysis.latest.value).toFixed(4)}%`);
  console.log(`   With 120% Multiplier: ${applyCDIMultiplier(analysis.latest.value).toFixed(6)}%`);
  
  // Accumulated Rate (NEW)
  console.log(`\n🏆 ACCUMULATED RATE (Last 12 Months):`);
  console.log(`   Total Accumulated: ${accumulatedData.accumulatedRate.toFixed(4)}%`);
  console.log(`   Total Days: ${accumulatedData.totalDays}`);
  console.log(`   Average Daily Rate: ${accumulatedData.averageDailyRate.toFixed(6)}%`);
  console.log(`   With 120% Multiplier: ${(accumulatedData.accumulatedRate * 1.2).toFixed(4)}%`);
  
  // Statistics
  console.log(`\n📈 STATISTICS:`);
  console.log(`   Total Records: ${analysis.totalRecords}`);
  console.log(`   Minimum Daily Rate: ${analysis.statistics.min.toFixed(6)}%`);
  console.log(`   Maximum Daily Rate: ${analysis.statistics.max.toFixed(6)}%`);
  console.log(`   Average Daily Rate: ${analysis.statistics.average.toFixed(6)}%`);
  console.log(`   Average Monthly Rate: ${convertDailyToMonthly(analysis.statistics.average).toFixed(4)}%`);
  
  // Monthly averages
  console.log(`\n📅 MONTHLY AVERAGES:`);
  analysis.monthlyAverages.forEach(month => {
    const monthlyRate = convertDailyToMonthly(month.average);
    console.log(`   ${month.month}: ${month.average.toFixed(6)}% daily (${monthlyRate.toFixed(4)}% monthly) - ${month.count} records`);
  });
  
  // Sample data points
  console.log(`\n📋 SAMPLE DATA POINTS (Last 10):`);
  const recentData = analysis.allData.slice(-10);
  recentData.forEach(item => {
    const monthlyRate = convertDailyToMonthly(item.value);
    console.log(`   ${item.date}: ${item.value.toFixed(6)}% daily (${monthlyRate.toFixed(4)}% monthly)`);
  });
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Test the rate conversion functions
 */
function testRateConversions() {
  console.log('\n🧪 TESTING RATE CONVERSIONS:');
  
  // Test with a sample daily rate
  const sampleDailyRate = 0.039270; // From your data
  const monthlyRate = convertDailyToMonthly(sampleDailyRate);
  const backToDaily = convertMonthlyToDaily(monthlyRate);
  const withMultiplier = applyCDIMultiplier(sampleDailyRate);
  
  console.log(`   Sample Daily Rate: ${sampleDailyRate}%`);
  console.log(`   → Monthly Rate: ${monthlyRate.toFixed(4)}%`);
  console.log(`   → Back to Daily: ${backToDaily.toFixed(6)}%`);
  console.log(`   → With 120% Multiplier: ${withMultiplier.toFixed(6)}%`);
  
  // Verify conversion accuracy
  const conversionError = Math.abs(sampleDailyRate - backToDaily);
  console.log(`   Conversion Error: ${conversionError.toFixed(8)}%`);
  
  if (conversionError < 0.000001) {
    console.log('   ✅ Rate conversion functions working correctly!');
  } else {
    console.log('   ⚠️  Rate conversion may have precision issues');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Testing BCB API for CDI Data (Last 12 Months)');
    console.log('='.repeat(80));
    
    // Get date range
    const { startDate, endDate } = getDateRange();
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    
    // Fetch data
    const data = await fetchCDIData(startDate, endDate);
    
    // Analyze data
    const analysis = analyzeCDIData(data);
    
    // Calculate accumulated rate
    const accumulatedData = calculateAccumulatedRate(data);
    
    // Display results
    displayResults(analysis, accumulatedData);
    
    // Test rate conversions
    testRateConversions();
    
    console.log('\n🎉 BCB API test completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fetchCDIData,
  analyzeCDIData,
  calculateAccumulatedRate,
  convertDailyToMonthly,
  convertMonthlyToDaily,
  applyCDIMultiplier
}; 
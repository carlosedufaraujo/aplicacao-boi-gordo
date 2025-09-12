// Test mortality API
const https = require('https');
const http = require('http');

async function testMortalityAPI() {
    try {
        console.log('🔍 Testing mortality patterns API...');
        
        const response = await fetch('http://localhost:3001/api/v1/analytics/mortality/patterns');
        const data = await response.json();
        
        console.log('📊 Mortality API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success && data.data.topCauses && data.data.topCauses.length > 0) {
            console.log('✅ API is returning correct data!');
            console.log(`   - Found ${data.data.topCauses.length} causes`);
            console.log(`   - First cause: ${data.data.topCauses[0].cause} (${data.data.topCauses[0].count} deaths)`);
        } else {
            console.log('❌ API response structure is unexpected');
        }
        
        // Test interventions history
        console.log('\n🔍 Testing interventions history API...');
        const interventionsResponse = await fetch('http://localhost:3001/api/v1/interventions/history');
        const interventionsData = await interventionsResponse.json();
        
        console.log('📊 Interventions API Response:');
        console.log(JSON.stringify(interventionsData, null, 2));
        
        if (interventionsData.status === 'success') {
            console.log(`✅ Interventions API working - ${interventionsData.results} records found`);
        } else {
            console.log('❌ Interventions API response structure is unexpected');
        }
        
    } catch (error) {
        console.error('❌ Error testing APIs:', error.message);
    }
}

testMortalityAPI();
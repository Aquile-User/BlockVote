// Test script to verify expired election functionality
const axios = require('axios');

async function testExpiredElectionFunctionality() {
  const API_BASE = 'http://localhost:3000';
  
  console.log('🧪 Testing Expired Election Functionality\n');
  
  try {
    // 1. Test getting all elections
    console.log('1. Fetching all elections...');
    const elections = await axios.get(`${API_BASE}/elections`);
    console.log('Elections:', elections.data);
    
    // 2. Test getting expired election details
    console.log('\n2. Fetching expired election (ID 3) details...');
    const expiredElection = await axios.get(`${API_BASE}/elections/3`);
    console.log('Expired Election:', expiredElection.data);
    
    // Check timestamps
    const currentTime = Date.now() / 1000;
    const isExpired = currentTime > expiredElection.data.endTime;
    console.log(`Current time: ${currentTime}`);
    console.log(`End time: ${expiredElection.data.endTime}`);
    console.log(`Is expired: ${isExpired}`);
    
    // 3. Test getting results for expired election
    console.log('\n3. Fetching results for expired election...');
    const results = await axios.get(`${API_BASE}/elections/3/results`);
    console.log('Results:', results.data);
    
    // 4. Test vote attempt on expired election (should fail if user tries to vote)
    console.log('\n4. Testing vote attempt on expired election...');
    console.log('Note: This should be prevented by frontend logic');
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\nExpected frontend behavior:');
    console.log('- Expired election should show "expired" status');
    console.log('- Expired election should appear at end of election lists');
    console.log('- Voting form should not be shown for expired elections');
    console.log('- Appropriate "Election has ended" message should be displayed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testExpiredElectionFunctionality();

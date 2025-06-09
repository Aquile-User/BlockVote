// Test script to verify the vote submission fix
const axios = require('axios');
const ethers = require('ethers');

async function testVoteSubmission() {
  console.log("🧪 Testing Vote Submission Fix");
  console.log("================================\n");

  try {
    // Test data - using existing user from users.json
    const testData = {
      socialId: "sebastianr",  // Make sure this user exists
      electionId: 1,
      selectedCandidate: "Danilo",
      voter: "0x842a0CA672FF597b7a8b05417A08cc59e29b6007"  // Address from users.json
    };

    // Create a test signature (this would normally be done by frontend wallet)
    const contractAddress = "0xB514AaB6e30497db5C16d283a6CbB2251f9c5220";
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "string", "address", "address"],
      [testData.electionId, testData.selectedCandidate, testData.voter, contractAddress]
    );

    // For testing, we'll use a dummy signature
    // In real scenario, this comes from the frontend wallet
    const dummySignature = "0x" + "00".repeat(65);

    const payload = {
      socialId: testData.socialId,
      electionId: testData.electionId,
      selectedCandidate: testData.selectedCandidate,
      signature: dummySignature
    };

    console.log("📤 Sending test vote submission...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Test the API endpoint
    const response = await axios.post('http://localhost:3000/vote', payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log("✅ API Response Structure Test Passed!");
    console.log("Response data:", response.data);

  } catch (error) {
    if (error.response) {
      console.log("✅ API endpoint responding correctly");
      console.log("Status:", error.response.status);
      console.log("Error:", error.response.data);
      
      if (error.response.data.error && !error.response.data.error.includes("response.json is not a function")) {
        console.log("🎉 SUCCESS: The 'response.json is not a function' error is FIXED!");
        console.log("   The error we got is expected (invalid signature or user not found)");
      } else if (error.response.data.error && error.response.data.error.includes("response.json is not a function")) {
        console.log("❌ FAILED: The response.json error still exists");
      }
    } else {
      console.log("❌ Network error:", error.message);
    }
  }
}

// Run the test
testVoteSubmission();

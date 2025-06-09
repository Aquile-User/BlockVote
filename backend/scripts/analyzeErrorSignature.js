const ethers = require("ethers");

/**
 * Reverse engineer what message the error signature was signed for
 */
async function analyzeErrorSignature() {
  const errorSignature = "0xb7d2350289d062aa52763197906479d8e7e53314b8fb3765d602fa19735189297f562ad4bb2f538a3069c6a251bec9c54d9d9237a0524a312086f560c8e655321b";
  const voterAddress = "0x842a0CA672FF597b7a8b05417A08cc59e29b6007";
  
  console.log("=== ANALYZING ERROR SIGNATURE ===");
  console.log("Error signature:", errorSignature);
  console.log("Expected signer:", voterAddress);

  // Test different possible messages that could have produced this signature
  const electionId = 1;
  const selectedCandidate = "Leonel";
  const contractAddress = "0xB514AaB6e30497db5C16d283a6CbB2251f9c5220";

  // Test 1: Without contract address (old format)
  const hash1 = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address"],
    [electionId, selectedCandidate, voterAddress]
  );
  console.log("\n--- Test 1: Without contract address ---");
  console.log("Hash:", hash1);
  try {
    const recovered1 = ethers.verifyMessage(ethers.getBytes(hash1), errorSignature);
    console.log("Recovered:", recovered1);
    console.log("Match:", recovered1.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Verification failed:", e.message);
  }

  // Test 2: With contract address (correct format) 
  const hash2 = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );
  console.log("\n--- Test 2: With contract address ---");
  console.log("Hash:", hash2);
  try {
    const recovered2 = ethers.verifyMessage(ethers.getBytes(hash2), errorSignature);
    console.log("Recovered:", recovered2);
    console.log("Match:", recovered2.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Verification failed:", e.message);
  }

  // Test 3: String directly (no bytes conversion)
  console.log("\n--- Test 3: String directly (no getBytes) ---");
  try {
    const recovered3 = ethers.verifyMessage(hash2, errorSignature);
    console.log("Recovered:", recovered3);
    console.log("Match:", recovered3.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Verification failed:", e.message);
  }

  // Test 4: Different candidate spelling/casing
  const hash4 = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, "leonel", voterAddress, contractAddress] // lowercase
  );
  console.log("\n--- Test 4: Lowercase candidate ---");
  console.log("Hash:", hash4);
  try {
    const recovered4 = ethers.verifyMessage(ethers.getBytes(hash4), errorSignature);
    console.log("Recovered:", recovered4);
    console.log("Match:", recovered4.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Verification failed:", e.message);
  }
}

analyzeErrorSignature().catch(console.error);

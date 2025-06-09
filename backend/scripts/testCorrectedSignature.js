const ethers = require("ethers");
const fs = require("fs");

/**
 * Test the corrected signature generation with ethers.getBytes()
 */
async function testCorrectedSignature() {
  // Use the exact same values from the error
  const electionId = 1;
  const selectedCandidate = "Leonel";
  const voterAddress = "0x842a0CA672FF597b7a8b05417A08cc59e29b6007";
  const contractAddress = "0xB514AaB6e30497db5C16d283a6CbB2251f9c5220";

  // Get the private key for this address
  const users = JSON.parse(fs.readFileSync("./users.json", "utf8"));
  const user = users["321"]; // socialId for this address
  const wallet = new ethers.Wallet(user.privateKey);

  console.log("=== CORRECTED FRONTEND SIMULATION ===");
  console.log("electionId:", electionId);
  console.log("selectedCandidate:", selectedCandidate);
  console.log("voterAddress:", voterAddress);
  console.log("contractAddress:", contractAddress);

  // 1. Create message hash exactly as frontend does
  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );
  console.log("messageHash:", messageHash);

  // 2. Sign with ethers.getBytes() as corrected
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  console.log("corrected signature:", signature);
  console.log("Original error signature:", "0xb7d2350289d062aa52763197906479d8e7e53314b8fb3765d602fa19735189297f562ad4bb2f538a3069c6a251bec9c54d9d9237a0524a312086f560c8e655321b");
  console.log("Signatures match now:", signature === "0xb7d2350289d062aa52763197906479d8e7e53314b8fb3765d602fa19735189297f562ad4bb2f538a3069c6a251bec9c54d9d9237a0524a312086f560c8e655321b");

  // 3. Verify locally with corrected method
  const recovered = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
  console.log("Locally recovered:", recovered);
  console.log("Local verification passed:", recovered.toLowerCase() === voterAddress.toLowerCase());

  // 4. Test what smart contract sees
  console.log("\n=== SMART CONTRACT VERIFICATION ===");
  
  const contractHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );
  console.log("Contract hash:", contractHash);
  
  const contractPrefixedHash = ethers.hashMessage(ethers.getBytes(contractHash));
  console.log("Contract prefixed hash:", contractPrefixedHash);
  
  const sig = ethers.Signature.from(signature);
  const contractRecovered = ethers.recoverAddress(contractPrefixedHash, sig);
  console.log("Contract recovered:", contractRecovered);
  console.log("Contract verification passed:", contractRecovered.toLowerCase() === voterAddress.toLowerCase());
}

testCorrectedSignature().catch(console.error);

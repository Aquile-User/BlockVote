const ethers = require("ethers");
const fs = require("fs");

/**
 * Test the final corrected signature generation
 */
async function testFinalCorrection() {
  const electionId = 1;
  const selectedCandidate = "Leonel";
  const voterAddress = "0x842a0CA672FF597b7a8b05417A08cc59e29b6007";
  const contractAddress = "0xB514AaB6e30497db5C16d283a6CbB2251f9c5220";

  const users = JSON.parse(fs.readFileSync("./users.json", "utf8"));
  const user = users["321"];
  const wallet = new ethers.Wallet(user.privateKey);

  console.log("=== FINAL CORRECTED SIGNATURE TEST ===");

  // Create message hash
  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );
  console.log("Message hash:", messageHash);

  // Sign with getBytes() for 32-byte compatibility
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  console.log("New signature:", signature);

  // Verify locally with same method
  const localRecovered = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
  console.log("Local verification:", localRecovered);
  console.log("Local match:", localRecovered.toLowerCase() === voterAddress.toLowerCase());

  // Test contract compatibility
  console.log("\n=== CONTRACT COMPATIBILITY TEST ===");
  
  const contractRawHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );
  const contractPrefixedHash = ethers.hashMessage(ethers.getBytes(contractRawHash));
  
  const sig = ethers.Signature.from(signature);
  const contractRecovered = ethers.recoverAddress(contractPrefixedHash, sig);
  
  console.log("Contract recovered:", contractRecovered);
  console.log("Contract compatible:", contractRecovered.toLowerCase() === voterAddress.toLowerCase());
  
  if (contractRecovered.toLowerCase() === voterAddress.toLowerCase()) {
    console.log("\n🎉 SUCCESS! This signature should work with the smart contract!");
  } else {
    console.log("\n❌ FAILED! Still not compatible with smart contract.");
  }
}

testFinalCorrection().catch(console.error);

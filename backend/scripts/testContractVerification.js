const ethers = require("ethers");

/**
 * Test exactly what the smart contract verification does
 */
async function testContractVerification() {
  // From the error
  const electionId = 1;
  const selectedCandidate = "Leonel";
  const voterAddress = "0x842a0CA672FF597b7a8b05417A08cc59e29b6007";
  const contractAddress = "0xB514AaB6e30497db5C16d283a6CbB2251f9c5220";
  const signature = "0xb7d2350289d062aa52763197906479d8e7e53314b8fb3765d602fa19735189297f562ad4bb2f538a3069c6a251bec9c54d9d9237a0524a312086f560c8e655321b";

  console.log("=== SMART CONTRACT VERIFICATION TEST ===");
  console.log("electionId:", electionId);
  console.log("candidate:", selectedCandidate);
  console.log("voter:", voterAddress);
  console.log("contract:", contractAddress);
  console.log("signature:", signature);

  // Smart contract does:
  // bytes32 message = prefixed(keccak256(abi.encodePacked(electionId, candidate, voter, address(this))));
  // require(recoverSigner(message, signature) == voter, "Invalid signature");

  // Step 1: keccak256(abi.encodePacked(electionId, candidate, voter, address(this)))
  const rawHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );
  console.log("\n1. Raw hash (abi.encodePacked):", rawHash);

  // Step 2: prefixed() function - adds Ethereum message prefix
  // function prefixed(bytes32 hash) internal pure returns (bytes32) {
  //     return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  // }
  const prefixedHash = ethers.hashMessage(ethers.getBytes(rawHash));
  console.log("2. Prefixed hash (contract prefixed()):", prefixedHash);

  // Step 3: recoverSigner using ecrecover
  const sig = ethers.Signature.from(signature);
  console.log("3. Signature components:");
  console.log("   r:", sig.r);
  console.log("   s:", sig.s);
  console.log("   v:", sig.v);

  const recoveredAddress = ethers.recoverAddress(prefixedHash, sig);
  console.log("4. Recovered address:", recoveredAddress);
  console.log("5. Expected address:", voterAddress);
  console.log("6. Addresses match:", recoveredAddress.toLowerCase() === voterAddress.toLowerCase());

  // Also test what happens if we sign the way the frontend does
  console.log("\n=== TESTING FRONTEND SIGNING COMPATIBILITY ===");
  
  // Frontend signs the hash string directly
  const frontendHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );
  console.log("Frontend hash:", frontendHash);
  
  // When frontend calls wallet.signMessage(hashString), ethers internally:
  // 1. Converts to bytes if needed
  // 2. Adds the "\x19Ethereum Signed Message:\n32" prefix
  // 3. Hashes again
  // 4. Signs the result
  
  const frontendPrefixedHash = ethers.hashMessage(frontendHash); // Note: string, not bytes
  console.log("Frontend prefixed hash:", frontendPrefixedHash);
  
  const frontendRecovered = ethers.recoverAddress(frontendPrefixedHash, sig);
  console.log("Frontend style recovery:", frontendRecovered);
  console.log("Frontend compatible:", frontendRecovered.toLowerCase() === voterAddress.toLowerCase());
}

testContractVerification().catch(console.error);

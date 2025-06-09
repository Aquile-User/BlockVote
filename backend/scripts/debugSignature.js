const ethers = require("ethers");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();

/**
 * Debug script to test signature generation exactly as the frontend does
 * Usage: node debugSignature.js <socialId> <electionId> <candidate>
 * e.g. node debugSignature.js alice123 1 "Leonel"
 */
async function main() {
  const [,, socialId, electionIdRaw, candidate] = process.argv;
  if (!socialId || !electionIdRaw || !candidate) {
    console.error("Usage: node debugSignature.js <socialId> <electionId> <candidate>");
    process.exit(1);
  }

  const electionId = Number(electionIdRaw);
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  console.log("=== SIGNATURE DEBUG ===");
  console.log("electionId:", electionId);
  console.log("candidate:", candidate);
  console.log("contractAddress:", contractAddress);

  // Load user from users.json
  const users = JSON.parse(fs.readFileSync("./users.json", "utf8"));
  const user = users[socialId];
  if (!user) {
    console.error(`No user found for socialId="${socialId}"`);
    process.exit(1);
  }

  const voterAddress = user.address;
  const wallet = new ethers.Wallet(user.privateKey);
  
  console.log("voterAddress:", voterAddress);
  console.log("wallet.address:", wallet.address);
  console.log("Addresses match:", voterAddress === wallet.address);

  // 1. Create message hash exactly as frontend does
  console.log("\n=== FRONTEND STYLE SIGNATURE ===");
  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, candidate, voterAddress, contractAddress]
  );
  console.log("messageHash:", messageHash);

  // 2. Sign with wallet.signMessage (this automatically adds the prefix)
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  console.log("signature:", signature);

  // 3. Verify the signature locally
  const recovered = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
  console.log("recovered address:", recovered);
  console.log("Signature verification:", recovered.toLowerCase() === voterAddress.toLowerCase());

  // 4. Now test what the smart contract would see
  console.log("\n=== SMART CONTRACT VERIFICATION ===");
  
  // Smart contract does: prefixed(keccak256(abi.encodePacked(electionId, candidate, voter, address(this))))
  const rawHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, candidate, voterAddress, contractAddress]
  );
  console.log("rawHash (before prefix):", rawHash);
  
  // The prefixed function in contract does: keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash))
  const prefixedHash = ethers.hashMessage(ethers.getBytes(rawHash));
  console.log("prefixedHash (what contract sees):", prefixedHash);

  // 5. Try to recover from the signature using the prefixed hash
  const sig = ethers.Signature.from(signature);
  const recoveredFromContract = ethers.recoverAddress(prefixedHash, sig);
  console.log("recovered by contract logic:", recoveredFromContract);
  console.log("Contract verification:", recoveredFromContract.toLowerCase() === voterAddress.toLowerCase());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

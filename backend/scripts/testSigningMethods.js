const ethers = require("ethers");
const fs = require("fs");

async function testSigningMethods() {
  const users = JSON.parse(fs.readFileSync("./users.json", "utf8"));
  const user = users["321"];
  const wallet = new ethers.Wallet(user.privateKey);
  const voterAddress = "0x842a0CA672FF597b7a8b05417A08cc59e29b6007";

  const electionId = 1;
  const selectedCandidate = "Leonel";
  const contractAddress = "0xB514AaB6e30497db5C16d283a6CbB2251f9c5220";

  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "string", "address", "address"],
    [electionId, selectedCandidate, voterAddress, contractAddress]
  );

  console.log("=== TESTING SIGNING METHODS ===");
  console.log("messageHash:", messageHash);

  // Method 1: Sign string directly, verify string directly
  console.log("\n--- Method 1: String -> String ---");
  const sig1 = await wallet.signMessage(messageHash);
  console.log("Signature:", sig1);
  try {
    const recovered1 = ethers.verifyMessage(messageHash, sig1);
    console.log("Recovered:", recovered1);
    console.log("Matches:", recovered1.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Error:", e.message);
  }

  // Method 2: Sign bytes, verify bytes  
  console.log("\n--- Method 2: Bytes -> Bytes ---");
  const sig2 = await wallet.signMessage(ethers.getBytes(messageHash));
  console.log("Signature:", sig2);
  try {
    const recovered2 = ethers.verifyMessage(ethers.getBytes(messageHash), sig2);
    console.log("Recovered:", recovered2);
    console.log("Matches:", recovered2.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Error:", e.message);
  }

  // Method 3: Sign string, verify bytes (WRONG)
  console.log("\n--- Method 3: String -> Bytes (WRONG) ---");
  try {
    const recovered3 = ethers.verifyMessage(ethers.getBytes(messageHash), sig1);
    console.log("Recovered:", recovered3);
    console.log("Matches:", recovered3.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Error:", e.message);
  }

  // Method 4: Sign bytes, verify string (WRONG)
  console.log("\n--- Method 4: Bytes -> String (WRONG) ---");
  try {
    const recovered4 = ethers.verifyMessage(messageHash, sig2);
    console.log("Recovered:", recovered4);
    console.log("Matches:", recovered4.toLowerCase() === voterAddress.toLowerCase());
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("\n--- Check against error signature ---");
  const errorSig = "0xb7d2350289d062aa52763197906479d8e7e53314b8fb3765d602fa19735189297f562ad4bb2f538a3069c6a251bec9c54d9d9237a0524a312086f560c8e655321b";
  console.log("sig1 === errorSig:", sig1 === errorSig);
  console.log("sig2 === errorSig:", sig2 === errorSig);
}

testSigningMethods().catch(console.error);

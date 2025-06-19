// Test script to reproduce frontend API calls
const fetch = require("node-fetch");

const API_BASE = "http://localhost:3000";

async function testElectionCalls() {
  try {
    console.log("1. Getting elections list...");
    const timestamp1 = Date.now();
    const electionsResp = await fetch(`${API_BASE}/elections?_t=${timestamp1}`);

    if (!electionsResp.ok) {
      throw new Error(`Elections list failed: ${electionsResp.status}`);
    }

    const elections = await electionsResp.json();
    console.log(
      `Found ${elections.length} elections:`,
      elections.map((e) => `${e.electionId}: ${e.name}`)
    );

    console.log("\n2. Testing individual election calls...");
    for (const election of elections) {
      try {
        const timestamp2 = Date.now();
        const detailResp = await fetch(
          `${API_BASE}/elections/${election.electionId}?_t=${timestamp2}`
        );
        if (detailResp.ok) {
          console.log(`✅ Election ${election.electionId}: OK`);
        } else {
          console.log(
            `❌ Election ${election.electionId}: ${detailResp.status} - ${detailResp.statusText}`
          );
        }
      } catch (error) {
        console.log(`❌ Election ${election.electionId}: ${error.message}`);
      }
    }

    console.log("\n3. Testing parallel calls (like frontend does)...");
    const detailsPromises = elections.map(async (election) => {
      try {
        const timestamp3 = Date.now();
        const resp = await fetch(
          `${API_BASE}/elections/${election.electionId}?_t=${timestamp3}`
        );
        if (resp.ok) {
          const data = await resp.json();
          return { id: election.electionId, success: true, data };
        } else {
          return {
            id: election.electionId,
            success: false,
            error: resp.statusText,
            status: resp.status,
          };
        }
      } catch (error) {
        return {
          id: election.electionId,
          success: false,
          error: error.message,
          status: "ERROR",
        };
      }
    });

    const results = await Promise.all(detailsPromises);
    results.forEach((result) => {
      if (result.success) {
        console.log(`✅ Parallel Election ${result.id}: OK`);
      } else {
        console.log(
          `❌ Parallel Election ${result.id}: ${result.status} - ${result.error}`
        );
      }
    });
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testElectionCalls();

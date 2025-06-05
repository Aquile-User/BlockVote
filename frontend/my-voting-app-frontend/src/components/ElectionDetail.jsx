// src/components/ElectionDetail.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { getElectionById, getResults, submitVote } from "../api";

export default function ElectionDetail() {
  const { id } = useParams();
  const electionId = Number(id);

  const [election, setElection] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [socialId, setSocialId] = useState("");
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState(null);

  useEffect(() => {
    async function fetchElection() {
      try {
        const data = await getElectionById(electionId);
        setElection(data);
      } catch (err) {
        console.error(err);
        setStatus(
          "Error loading election: " + err.response?.data?.error || err.message
        );
      }
    }
    fetchElection();
  }, [electionId]);

  useEffect(() => {
    async function fetchResults() {
      try {
        const data = await getResults(electionId);
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchResults();
  }, [electionId]);

  // 1) Connect MetaMask and get address
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      return signer;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // 2) Sign the vote off-chain with MetaMask - FINAL WORKING VERSION
  async function handleVote(e) {
    e.preventDefault();
    if (!socialId.trim()) {
      setStatus("Please enter your Social ID.");
      return;
    }
    if (!selectedCandidate) {
      setStatus("Please choose a candidate.");
      return;
    }
    setStatus("");
    // 1) Look up the stored privateKey (from users.json via your backend)
    //    You might have saved it in localStorage after /users/register, for example:
    const stored = JSON.parse(localStorage.getItem("user-" + socialId));
    if (!stored || !stored.privateKey) {
      setStatus("No private key found for this Social ID. Please re-register.");
      return;
    }
    const wallet = new ethers.Wallet(stored.address);
    const voterAddress = wallet.address;
    alert("Connected wallet: " + voterAddress);
    if (!voterAddress) {
      setStatus("Wallet address not found.");
      return;
    }

    console.log("=== VOTING DEBUG ===");
    console.log("Connected wallet:", voterAddress);
    console.log("selectedCandidate:", selectedCandidate);
    console.log("electionId:", electionId);
    console.log("socialId:", socialId.trim());

    // THIS MUST MATCH THE SMART CONTRACT EXACTLY:
    // keccak256(abi.encodePacked(electionId, candidate, voter))

    // The smart contract uses abi.encodePacked(uint256, string, address)
    // We need to replicate this exactly in JavaScript
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "string", "address"],
      [electionId, selectedCandidate, voterAddress]
    );

    console.log("Message hash:", messageHash);

    setStatus("Requesting signature…");
    let signature;
    try {
      // The smart contract applies prefixed() which adds the Ethereum message prefix
      // ethers.signMessage() automatically adds this prefix, so we sign the raw hash
      signature = await signer.signMessage(messageHash);
      alert("recoveredAddress.toLowerCase() +  + voterAddress.toLowerCase()");

      // Verify locally that our signature works
      const recoveredAddress = ethers.verifyMessage(messageHash, signature);
      console.log("Recovered address:", recoveredAddress);
      console.log(
        "Addresses match:",
        recoveredAddress.toLowerCase() === voterAddress.toLowerCase()
      );

      if (recoveredAddress.toLowerCase() !== voterAddress.toLowerCase()) {
        throw new Error("Local signature verification failed!");
      }
    } catch (err) {
      console.error("Signing error:", err);
      setStatus("Signature request denied or verification failed.");
      return;
    }

    setStatus("Submitting vote…");
    try {
      // Send to your backend API (which then calls the relayer)
      const resp = await submitVote({
        socialId: socialId.trim(),
        electionId: electionId,
        selectedCandidate: selectedCandidate,
        voter: voterAddress, // This should match what your relayer expects
        signature: signature,
      });

      if (resp.error) {
        setStatus("Vote failed: " + resp.error);
      } else {
        setStatus(`✅ Vote successful. TX: ${resp.txHash}`);
        // Refresh results
        const newResults = await getResults(electionId);
        setResults(newResults);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus(
        "Vote submission failed: " + (err.response?.data?.error || err.message)
      );
    }
  }

  if (!election) return <p>Loading election…</p>;

  return (
    <div>
      <h2>
        Election #{election.electionId}: {election.name}
      </h2>

      <h3>Candidates</h3>
      <ul>
        {election.candidates.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <h3>Cast Your Vote</h3>
      <form onSubmit={handleVote}>
        <div>
          <input
            type="text"
            placeholder="Your Social ID"
            value={socialId}
            onChange={(e) => setSocialId(e.target.value)}
          />
        </div>
        <div>
          <select
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
          >
            <option value="">-- Select a candidate --</option>
            {election.candidates.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Sign & Submit Vote</button>
      </form>

      {status && <p>{status}</p>}

      <h3>Current Results</h3>
      {results ? (
        <ul>
          {Object.entries(results).map(([name, count]) => (
            <li key={name}>
              {name}: {count}
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading results…</p>
      )}
    </div>
  );
}

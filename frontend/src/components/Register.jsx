import React, { useState } from "react";
import { ethers } from "ethers";
import { registerUser } from "../api";

export default function Register() {
  const [socialId, setSocialId] = useState("");
  const [status, setStatus] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);

  async function handleRegister(e) {
    e.preventDefault();
    if (!socialId.trim()) {
      setStatus("Please enter a valid Social ID.");
      return;
    }
    try {
      setStatus("Registering...");
      const data = await registerUser(socialId.trim());
      setWalletInfo(data);
      // Save address and privateKey in localStorage for later voting
      localStorage.setItem(
        `user-${data.socialId}`,
        JSON.stringify({ address: data.address, privateKey: data.privateKey })
      );
      setStatus("✅ Registered! Your wallet: " + data.address);
    } catch (err) {
      console.error(err);
      setStatus("❌ Registration failed: " + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div>
      <h2>1) Register (by Social ID)</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Your Social ID"
          value={socialId}
          onChange={(e) => setSocialId(e.target.value)}
        />
        <button type="submit">Register</button>
      </form>

      {status && <p>{status}</p>}

      {walletInfo && (
        <div>
          <h3>Saved Wallet Info:</h3>
          <p><strong>Social ID:</strong> {walletInfo.socialId}</p>
          <p><strong>Address:</strong> {walletInfo.address}</p>
          <p>
            <strong>Private Key:</strong>{" "}
            <code style={{ wordBreak: "break-all" }}>{walletInfo.privateKey}</code>
          </p>
          <p><strong>Fund TX:</strong> {walletInfo.fundTxHash}</p>
          <p>
            <em>
              Keep your private key safe! In production you wouldn’t expose it—
              we show it here only for testing.
            </em>
          </p>
        </div>
      )}
    </div>
  );
}

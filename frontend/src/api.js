// src/api.js

import axios from "axios";

const API_BASE = "http://localhost:3000";

export async function registerUser(socialId) {
  const resp = await axios.post(`${API_BASE}/users/register`, { socialId });
  return resp.data;
}

export async function getElections() {
  const resp = await axios.get(`${API_BASE}/elections`);
  return resp.data;
}

export async function getElectionById(id) {
  const resp = await axios.get(`${API_BASE}/elections/${id}`);
  return resp.data;
}

export async function getResults(id) {
  const resp = await axios.get(`${API_BASE}/elections/${id}/results`);
  return resp.data;
}

export async function submitVote(payload) {
  // payload = { socialId, electionId, selectedCandidate, signature }
  const resp = await axios.post(`${API_BASE}/vote`, payload);
  return resp.data;
}

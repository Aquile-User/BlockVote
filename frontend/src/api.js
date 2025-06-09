// src/api.js

import axios from "axios";

const API_BASE = "http://localhost:3000";

export async function registerUser(userData) {
  const resp = await axios.post(`${API_BASE}/users/register`, userData);
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

// Election Management API Functions
export async function createElection(electionData) {
  // electionData = { name, candidates, startTime, endTime }
  const resp = await axios.post(`${API_BASE}/elections/create`, electionData);
  return resp.data;
}

export async function disableElection(electionId) {
  const resp = await axios.put(`${API_BASE}/elections/${electionId}/disable`);
  return resp.data;
}

export async function enableElection(electionId) {
  const resp = await axios.put(`${API_BASE}/elections/${electionId}/enable`);
  return resp.data;
}

export async function updateElectionName(electionId, name) {
  const resp = await axios.put(`${API_BASE}/elections/${electionId}/edit-name`, { name });
  return resp.data;
}

export async function addCandidate(electionId, candidate) {
  const resp = await axios.put(`${API_BASE}/elections/${electionId}/add-candidate`, { candidate });
  return resp.data;
}

// Check if user has voted in an election
export async function hasVoted(electionId, socialId) {
  const resp = await axios.get(`${API_BASE}/elections/${electionId}/has-voted/${socialId}`);
  return resp.data;
}

// src/api.js

import axios from "axios";

const API_BASE = "http://localhost:3000";

export async function registerUser(userData) {
  const resp = await axios.post(`${API_BASE}/users/register`, userData);
  return resp.data;
}

export async function getElections() {
  try {
    const resp = await axios.get(`${API_BASE}/elections`);
    console.log("API getElections response:", resp.data);
    return resp.data;
  } catch (error) {
    console.error("Error en getElections:", error);
    throw error;
  }
}

export async function getElectionById(id) {
  try {
    const resp = await axios.get(`${API_BASE}/elections/${id}`);
    console.log(`API getElectionById(${id}) response:`, resp.data);
    return resp.data;
  } catch (error) {
    console.error(`Error en getElectionById(${id}):`, error);
    throw error;
  }
}

export async function getResults(id) {
  try {
    const resp = await axios.get(`${API_BASE}/elections/${id}/results`);
    console.log(`API getResults(${id}) response:`, resp.data);
    return resp.data;
  } catch (error) {
    console.error(`Error en getResults(${id}):`, error);
    // En caso de error, devolvemos un objeto vacío para evitar errores en el frontend
    return {};
  }
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
  const resp = await axios.put(
    `${API_BASE}/elections/${electionId}/edit-name`,
    { name }
  );
  return resp.data;
}

export async function addCandidate(electionId, candidate) {
  const resp = await axios.put(
    `${API_BASE}/elections/${electionId}/add-candidate`,
    { candidate }
  );
  return resp.data;
}

// Check if user has voted in an election
export async function hasVoted(electionId, socialId) {
  const resp = await axios.get(
    `${API_BASE}/elections/${electionId}/has-voted/${socialId}`
  );
  return resp.data;
}

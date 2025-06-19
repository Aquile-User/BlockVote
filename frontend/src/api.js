// src/api.js

import axios from "axios";

const API_BASE = "http://localhost:3000";

// Helper function to add delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Configure axios to handle rate limiting automatically
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Handle rate limiting (429) with automatic retry
    if (response?.status === 429 && !config._retryCount) {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < 3) {
        config._retryCount++;

        // Get retry delay from server or use default
        const retryAfter = response.headers["retry-after"] || 5;
        const waitTime = retryAfter * 1000 + Math.random() * 2000; // Add jitter

        console.warn(
          `Rate limit hit, retrying in ${waitTime}ms (attempt ${config._retryCount}/3)`
        );
        await delay(waitTime);

        return axios(config);
      }
    }

    // Handle circuit breaker errors (503 service unavailable)
    if (
      response?.status === 503 ||
      (error.message && error.message.includes("Circuit breaker is OPEN"))
    ) {
      console.warn("Service temporarily unavailable due to circuit breaker");
      throw new Error(
        "Service temporarily unavailable. Please try again in a few moments."
      );
    }

    return Promise.reject(error);
  }
);

// Caché para almacenar resultados de elecciones
const resultsCache = {
  data: {}, // Almacena los resultados por electionId
  timestamps: {}, // Almacena el timestamp de cuándo se obtuvo cada resultado
  CACHE_TTL: 30000, // Tiempo de vida del caché en ms (30 segundos)

  // Verifica si un resultado está en caché y es válido
  isValid: function (electionId) {
    if (!this.data[electionId] || !this.timestamps[electionId]) {
      return false;
    }

    const now = Date.now();
    const timestamp = this.timestamps[electionId];
    return now - timestamp < this.CACHE_TTL;
  },

  // Guarda un resultado en el caché
  set: function (electionId, data) {
    this.data[electionId] = data;
    this.timestamps[electionId] = Date.now();
  },

  // Obtiene un resultado del caché
  get: function (electionId) {
    return this.data[electionId];
  },

  // Invalida todo el caché o una entrada específica
  invalidate: function (electionId = null) {
    if (electionId === null) {
      this.data = {};
      this.timestamps = {};
    } else {
      delete this.data[electionId];
      delete this.timestamps[electionId];
    }
  },
};

export async function registerUser(userData) {
  const resp = await axios.post(`${API_BASE}/users/register`, userData);
  return resp.data;
}

export async function getElections() {
  try {
    const timestamp = Date.now();
    const resp = await axios.get(`${API_BASE}/elections?_t=${timestamp}`);
    // API getElections response processing
    return resp.data;
  } catch (error) {
    console.error("Error en getElections:", error);
    throw error;
  }
}

export async function getElectionById(id) {
  try {
    const timestamp = Date.now();
    const url = `${API_BASE}/elections/${id}?_t=${timestamp}`;
    console.log(`API: Requesting ${url}`);

    const resp = await axios.get(url);
    console.log(`API: Successfully loaded election ${id}`);

    // API getElectionById response processing
    return resp.data;
  } catch (error) {
    console.error(`Error en getElectionById(${id}):`, error);
    console.error(`  - Status: ${error.response?.status}`);
    console.error(`  - URL: ${error.config?.url}`);
    console.error(`  - Message: ${error.message}`);
    throw error;
  }
}

export async function getResults(id) {
  try {
    // Verificar si los resultados están en caché y son válidos
    if (resultsCache.isValid(id)) {
      return resultsCache.get(id);
    }

    // Si no están en caché o expiraron, hacer la petición con cache busting
    const timestamp = Date.now();
    const resp = await axios.get(
      `${API_BASE}/elections/${id}/results?_t=${timestamp}`
    );

    // Guardar los resultados en caché
    resultsCache.set(id, resp.data);

    return resp.data;
  } catch (error) {
    console.error(`Error en getResults(${id}):`, error);

    // Manejar específicamente errores de rate limiting
    if (error.response?.status === 429) {
      console.warn(
        `Rate limit exceeded for election ${id}. Results may be delayed.`
      );
    }

    // En caso de error, devolvemos un objeto vacío para evitar errores en el frontend
    return {};
  }
}

// Función para invalidar el caché manualmente si es necesario
export function invalidateResultsCache(electionId = null) {
  resultsCache.invalidate(electionId);
}

export async function submitVote(payload) {
  // payload = { socialId, electionId, selectedCandidate, signature }
  const resp = await axios.post(`${API_BASE}/vote`, payload);

  // Al enviar un voto, invalidamos el caché para esa elección
  invalidateResultsCache(payload.electionId);

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
  // Invalidar caché para esta elección al desactivarla
  invalidateResultsCache(electionId);
  return resp.data;
}

export async function enableElection(electionId) {
  const resp = await axios.put(`${API_BASE}/elections/${electionId}/enable`);
  // Invalidar caché para esta elección al activarla
  invalidateResultsCache(electionId);
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
  // Invalidar caché para esta elección al añadir un candidato
  invalidateResultsCache(electionId);
  return resp.data;
}

// Check if user has voted in an election
export async function hasVoted(electionId, socialId) {
  const resp = await axios.get(
    `${API_BASE}/elections/${electionId}/has-voted/${socialId}`
  );
  return resp.data;
}

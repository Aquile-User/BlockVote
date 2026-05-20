// Frontend config - contains contract address and other constants
export const CONFIG = {
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || "",
  API_BASE: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
};

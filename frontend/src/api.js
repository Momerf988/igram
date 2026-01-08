import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://igram-backend-22559.azurewebsites.net";

export const api = axios.create({
  baseURL: API_BASE,
});

// Export API_BASE for constructing image URLs
export const API_BASE_URL = API_BASE;

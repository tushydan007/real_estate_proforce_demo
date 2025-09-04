import axios from "axios";
import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// request interceptor to add auth
client.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    // using Bearer by default; change if your backend expects `Token`
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default client;

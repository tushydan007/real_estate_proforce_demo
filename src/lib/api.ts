// lib/api.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { Aoi } from "./types";





interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Define a proper interface for queued requests
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
// Queue of failed requests waiting for token refresh
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});


// AOI CRUD
export async function getAois(): Promise<Aoi[]> {
  const res = await api.get<Aoi[]>("/aois/");
  return res.data;
}

export async function createAoi(aoi: Aoi): Promise<Aoi> {
  const res = await api.post<Aoi>("/aois/", aoi);
  return res.data;
}

export async function updateAoi(id: number, aoi: Aoi): Promise<Aoi> {
  const res = await api.put<Aoi>(`/aois/${id}/`, aoi);
  return res.data;
}

export async function deleteAoi(id: number): Promise<void> {
  await api.delete(`/aois/${id}/`);
}

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const csrf = localStorage.getItem("csrf_token");
  if (csrf) {
    config.headers["X-CSRFToken"] = csrf;
  }
  return config;
});

// Response interceptor: refresh expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If Unauthorized (401) and not retrying already
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh already happening → queue requests
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"
          }/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccess = res.data.access;
        const newRefresh = res.data.refresh;

        localStorage.setItem("access_token", newAccess);
        if (newRefresh) {
          localStorage.setItem("refresh_token", newRefresh);
        }

        api.defaults.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // logout user if refresh fails
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login"; // force re-login
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ---------- AXIOS (JSON normal) ----------
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("viernes_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiRequest = async (method, url, payload = {}) => {
  try {
    const config = { method, url };

    if (method.toLowerCase() === "get") config.params = payload;
    else config.data = payload;

    const { data } = await apiClient(config);
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Error desconocido";

    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
};

// ---------- FETCH (RAW) para SSE/streaming ----------
export const apiRequestRaw = async (method, url, payload) => {
  const token = localStorage.getItem("viernes_token");

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "text/event-stream, application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });

  return res;
};

// ---------- AXIOS (DOCS / multipart) ----------
const docsClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

docsClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("viernes_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiRequestDocs = async (method, url, formData) => {
  try {
    const config = { method, url, data: formData };
    const { data } = await docsClient(config);
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Error desconocido";

    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
};

// ---------- DELETE (sin body, con token) ----------
export const apiRequestDelete = async (url) => {
  try {
    const { data } = await apiClient.delete(url);
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Error desconocido";

    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
};

export default apiClient;
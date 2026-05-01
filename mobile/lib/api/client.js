import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:8000';

export const TOKEN_KEY = 'viernes_token';

// Module-level token — set on login/restore, read synchronously by interceptors
let _token = null;

export function setToken(token) {
  _token = token;
}
export function getToken() {
  return _token;
}

export async function saveToken(token) {
  _token = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  _token = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function loadToken() {
  const t = await AsyncStorage.getItem(TOKEN_KEY);
  if (t) _token = t;
  return t;
}

// ── Axios client ─────────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
  },
});

apiClient.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

export const apiRequest = async (method, url, payload = {}) => {
  try {
    const config = { method, url };
    if (method.toLowerCase() === 'get') config.params = payload;
    else config.data = payload;
    const { data } = await apiClient(config);
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Error desconocido';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
};

// ── Multipart (docs/images) ───────────────────────────────────────────────────
const docsClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: { Accept: 'application/json' },
});
docsClient.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

export const apiRequestDocs = async (method, url, formData) => {
  try {
    const { data } = await docsClient({ method, url, data: formData });
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Error desconocido';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
};

export const apiRequestDelete = async (url) => {
  try {
    const { data } = await apiClient.delete(url);
    return data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Error desconocido';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
};

export default apiClient;

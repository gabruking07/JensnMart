/** Shared Axios API client; sets the backend base URL and attaches the current bearer token to requests. */

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Adds the current login token centrally so individual pages do not repeat auth headers.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

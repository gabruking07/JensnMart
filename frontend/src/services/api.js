import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://jensnmart-api.onrender.com/api"
      : "http://localhost:5000/api"),
});

/** Builds a URL for an image served by the backend's static uploads directory. */
export const getUploadUrl = (imagePath) => {
  if (!imagePath) return "";

  const image = String(imagePath).trim();
  if (/^(https?:|data:|blob:)/i.test(image)) return image;

  const backendBaseUrl = (api.defaults.baseURL || "/api").replace(/\/api\/?$/, "");
  const relativePath = image.replace(/^\/+/, "").replace(/^uploads\//i, "");
  const encodedPath = relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${backendBaseUrl}/uploads/${encodedPath}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

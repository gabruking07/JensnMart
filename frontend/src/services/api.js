<<<<<<< HEAD
/** Shared Axios API client; sets the backend base URL and attaches the current bearer token to requests. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

<<<<<<< HEAD
// Adds the current login token centrally so individual pages do not repeat auth headers.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

<<<<<<< HEAD
export default api;
=======
export default api;
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5

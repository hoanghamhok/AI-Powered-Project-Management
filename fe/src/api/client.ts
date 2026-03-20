  import axios from "axios";
  import { useAuth } from "../features/auth/hooks/useAuth";

  const API_BASE =
    import.meta.env.MODE === "development"
      ? "http://localhost:4000"
      : import.meta.env.VITE_API_URL;

  const api = axios.create({
      baseURL : API_BASE,
      headers:{
          'Content-Type':'application/json',
      }
  })

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        useAuth.getState().logout();
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  export default api;

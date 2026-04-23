import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";

const instance = axios.create({
  baseURL,
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const isPublicAuth =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/verify");
    if (status === 401 && !isPublicAuth) {
      localStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login")) {
         // Dispatch a custom event so AuthContext can react cleanly
        window.dispatchEvent(new CustomEvent("auth:logout"));
        // Use history API to avoid full page reload
        window.history.pushState({}, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }
    return Promise.reject(error);
  }
);

export default instance;

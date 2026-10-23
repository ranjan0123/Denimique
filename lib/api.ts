import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL, API_ORIGIN } from "./apiConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,


  timeout: 30_000,
});

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
});



api.interceptors.request.use(
  (config) => {

    

    const store = useAuthStore.getState();
    let token = store.token;

    

    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("accessToken");
    }
    
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);



let refreshInFlight: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = refreshApi
      .post("/auth/refresh")
      .then((res) => {
        const newToken = res.data?.accessToken as string | undefined;
        if (!newToken) return null;

        localStorage.setItem("accessToken", newToken);
        useAuthStore.setState({
          token: newToken,
          isAuthenticated: true,
        });
        return newToken;
      })
      .catch((refreshError) => {
        localStorage.removeItem("accessToken");
        useAuthStore.setState({
          token: null,
          user: null,
          isAuthenticated: false,
        });
        throw refreshError;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};



api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || "").includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return fallbackMessage;
};

const KNOWN_BACKEND_ASSET_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "api.suitablevastra.com",
  "suitablevastra-backend.onrender.com",
  "suitablevastra-2lp8.onrender.com",
]);

// The backend sends Cross-Origin-Resource-Policy: same-origin on every
// response (including its own /uploads static files), which makes browsers
// silently refuse to load those images from the frontend's origin — the
// <img> just errors out and the app's fallback swaps in the logo. That
// header is only fixable by redeploying the backend, so self-hosted backend
// images are routed through this app's own /api/image-proxy instead, which
// fetches them server-side (no browser CORP enforcement applies there) and
// re-serves them same-origin. Externally hosted images (Cloudinary, the
// dropship supplier's CDN, etc.) load fine as-is and are left untouched.
const viaImageProxy = (url: string): string =>
  `/api/image-proxy?src=${encodeURIComponent(url)}`;

export const resolveApiAssetUrl = (value?: string | null): string => {
  if (!value) return "";
  if (/^data:/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const assetUrl = new URL(value);
      if (
        KNOWN_BACKEND_ASSET_HOSTS.has(assetUrl.hostname) &&
        assetUrl.origin !== API_ORIGIN
      ) {
        const resolved = `${API_ORIGIN}${assetUrl.pathname}${assetUrl.search}${assetUrl.hash}`;
        return viaImageProxy(resolved);
      }
      if (assetUrl.origin === API_ORIGIN) {
        return viaImageProxy(value);
      }
    } catch {
      return value;
    }

    return value;
  }
  if (value.startsWith("/")) {
    return viaImageProxy(`${API_ORIGIN}${value}`);
  }
  return viaImageProxy(`${API_ORIGIN}/${value}`);
};

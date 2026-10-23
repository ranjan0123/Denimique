import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AxiosError } from "axios";
import api from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthError {
  message: string;
  code?: string;
}

interface ApiErrorResponse {
  message?: string;
}

// Builds a guaranteed-non-empty AuthError from whatever axios (or anything
// else) throws, so the UI/console never has to deal with a message-less
// error object.
const toAuthError = (error: unknown, fallbackMessage: string): AuthError => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  const statusCode = axiosError?.response?.status;
  const serverMessage = axiosError?.response?.data?.message;
  const rawMessage =
    typeof serverMessage === "string" && serverMessage.trim()
      ? serverMessage
      : error instanceof Error && error.message
        ? error.message
        : fallbackMessage;

  return {
    message: rawMessage,
    code: statusCode?.toString(),
  };
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  hasInitialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      hasInitialized: false,

      login: async (email: string, password: string) => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
          const normalizedEmail = email.trim().toLowerCase();
          const res = await api.post("/auth/login", {
            email: normalizedEmail,
            password,
          });

          const { user, accessToken } = res.data;

          // Store in both localStorage and Zustand store
          localStorage.setItem("accessToken", accessToken);

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            hasInitialized: true,
          });
        } catch (error: unknown) {
          const authError = toAuthError(error, "Login failed. Please try again.");
          const lowerMessage = authError.message.toLowerCase();

          // Provide more user-friendly messages for specific error codes
          if (
            authError.code === "429" ||
            lowerMessage.includes("too many attempts")
          ) {
            authError.message =
              "Too many attempts. Please wait a few minutes and try again.";
          } else if (
            authError.code === "403" &&
            lowerMessage.includes("verify your email")
          ) {
            authError.message =
              "Please verify your email address before signing in. Check your inbox for the verification link.";
          } else if (
            authError.code === "400" ||
            lowerMessage.includes("invalid credentials") ||
            lowerMessage.includes("invalid email or password") ||
            lowerMessage.includes("email or password") ||
            lowerMessage.includes("wrong password")
          ) {
            authError.message =
              "Invalid email or password. Please check your credentials and try again.";
          }

          set({ error: authError, isLoading: false });
          // Expected auth failures (wrong password, unverified email, etc.)
          // are already surfaced in the UI; console.error would trip the
          // Next.js dev overlay's issue counter for a non-bug state.
          console.warn("Login failed:", authError.message, error);
          throw authError;
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post("/auth/signup", {
            name,
            email,
            password,
          });

          // Backend now returns success message and doesn't auto-login
          // User needs to verify email before logging in
          set({ isLoading: false });

          // Return the response data for the component to handle
          return res.data;
        } catch (error: unknown) {
          const authError = toAuthError(error, "Signup failed. Please try again.");

          if (
            authError.code === "429" ||
            authError.message.toLowerCase().includes("too many attempts")
          ) {
            authError.message =
              "Too many attempts. Please wait a few minutes and try again.";
          }

          set({ error: authError, isLoading: false });
          console.error("Signup failed:", authError.message, error);
          throw authError;
        }
      },

      googleLogin: async (credential: string) => {
        set({ isLoading: true, error: null });
        try {
          // Send Google JWT token to backend for verification and user creation/login
          const res = await api.post("/auth/google", {
            token: credential,
          });

          const { user, accessToken } = res.data;

          localStorage.setItem("accessToken", accessToken);

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            hasInitialized: true,
          });
        } catch (error: unknown) {
          const authError = toAuthError(
            error,
            "Google login failed. Please try again.",
          );

          // Provide more user-friendly messages for specific error codes
          if (
            authError.code === "403" &&
            authError.message.includes("verify your email")
          ) {
            authError.message =
              "Please verify your email address before signing in. Check your inbox for the verification link.";
          }

          set({ error: authError, isLoading: false });
          console.error("Google login failed:", authError.message, error);
          throw authError;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await api.post("/auth/logout");

          localStorage.removeItem("accessToken");

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            hasInitialized: true,
          });
        } catch (error: unknown) {
          // Even if logout fails on server, clear local state
          localStorage.removeItem("accessToken");
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          console.error("Logout failed", error as AxiosError);
        }
      },

      init: async () => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          set({ token, isLoading: true });
          try {
            // Verify token with server
            const res = await api.get("/auth/me");
            set({
              user: res.data.user,
              isAuthenticated: true,
              isLoading: false,
              hasInitialized: true,
            });
          } catch {
            // Token invalid, clear it
            localStorage.removeItem("accessToken");
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              hasInitialized: true,
            });
          }
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            hasInitialized: true,
          });
        }
      },

      checkAuth: async () => {
        let { token } = get();

        if (!token && typeof window !== "undefined") {
          token = localStorage.getItem("accessToken");
          if (token) {
            set({ token });
          }
        }

        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            hasInitialized: true,
          });
          return false;
        }

        try {
          const res = await api.get("/auth/me");
          set({
            user: res.data.user,
            isAuthenticated: true,
            hasInitialized: true,
          });
          return true;
        } catch {
          // Token expired or invalid
          localStorage.removeItem("accessToken");
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            hasInitialized: true,
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        hasInitialized: state.hasInitialized,
      }),
    },
  ),
);

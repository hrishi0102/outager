import { create } from "zustand";
import apiClient from "@/lib/api";

const useAuthStore = create((set, get) => {
  return {
    // State
    user: null,
    token: null,
    organization: null,
    isLoading: false,
    error: null,

    // Actions
    setUser: (user) => {
      set({ user });
      if (typeof window !== "undefined") {
        if (user) {
          localStorage.setItem("auth_user", JSON.stringify(user));
        } else {
          localStorage.removeItem("auth_user");
        }
      }
    },

    setToken: (token) => {
      set({ token });
      apiClient.setToken(token);
      if (typeof window !== "undefined") {
        if (token) {
          localStorage.setItem("auth_token", token);
        } else {
          localStorage.removeItem("auth_token");
        }
      }
    },

    setOrganization: (organization) => {
      set({ organization });
      if (typeof window !== "undefined") {
        if (organization) {
          localStorage.setItem(
            "auth_organization",
            JSON.stringify(organization)
          );
        } else {
          localStorage.removeItem("auth_organization");
        }
      }
    },

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // Auth functions
    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.signin(email, password);
        get().setUser(response.user);
        get().setToken(response.session.access_token);
        set({ isLoading: false });
        return response;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },

    signup: async (email, password, fullName) => {
      set({ isLoading: true, error: null });
      try {
        // Clear any existing token before signup
        get().setToken(null);

        const response = await apiClient.signup(email, password, fullName);
        set({ isLoading: false });
        return response;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },

    logout: () => {
      get().setUser(null);
      get().setToken(null);
      get().setOrganization(null);
      apiClient.signout();
    },

    // Initialize auth from stored token
    initAuth: async () => {
      if (typeof window === "undefined") return;

      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");
      const storedOrg = localStorage.getItem("auth_organization");

      if (storedToken && storedUser) {
        try {
          // Set stored data first
          set({
            token: storedToken,
            user: JSON.parse(storedUser),
            organization: storedOrg ? JSON.parse(storedOrg) : null,
          });

          // Set token in API client
          apiClient.setToken(storedToken);

          // Verify token is still valid
          const response = await apiClient.getMe();
          get().setUser(response.user);
        } catch (error) {
          // Token is invalid, clear everything
          console.log("Token validation failed, clearing auth");
          get().logout();
        }
      }
    },
  };
});

export default useAuthStore;

import { defineStore } from "pinia";

interface AuthState {
  accessToken: string | null;
  tokenType: string;
  accessTokenExpiresAt: string | null;
  user: Record<string, any> | null;
  rememberMe: boolean;
}

interface SessionPayload {
  accessToken: string;
  tokenType?: string;
  expiresAt?: string | null;
  user?: Record<string, any> | null;
  rememberMe?: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    accessToken: null,
    tokenType: "Bearer",
    accessTokenExpiresAt: null,
    user: null,
    rememberMe: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
    authorizationHeader: (state) =>
      state.accessToken ? `${state.tokenType} ${state.accessToken}` : null,
    userRole: (state) => {
      const role =
        state.user?.role ?? state.user?.user_role ?? state.user?.type ?? null;
      return typeof role === "string" ? role : null;
    },
  },
  actions: {
    setSession(payload: SessionPayload) {
      this.accessToken = payload.accessToken;
      this.tokenType = payload.tokenType ?? "Bearer";
      this.accessTokenExpiresAt = payload.expiresAt ?? null;
      this.user = payload.user ?? null;
      if (typeof payload.rememberMe === "boolean") {
        this.rememberMe = payload.rememberMe;
      }
    },
    updateUser(user: Record<string, any> | null) {
      this.user = user;
    },
    clearSession() {
      this.accessToken = null;
      this.tokenType = "Bearer";
      this.accessTokenExpiresAt = null;
      this.user = null;
    },
  },
});

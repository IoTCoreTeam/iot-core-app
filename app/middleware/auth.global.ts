import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

const AUTH_API = apiConfig.auth;

async function attemptTokenRefresh(): Promise<boolean> {
  if (!import.meta.client) {
    return false;
  }

  const authStore = useAuthStore();

  try {
    const response = await fetch(`${AUTH_API}/refresh-token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => ({}));
    const payloadData = payload?.data ?? payload;
    const accessToken: string | undefined =
      payloadData?.access_token ??
      payloadData?.token ??
      payload?.access_token ??
      payload?.token;

    if (!accessToken) {
      return false;
    }

    authStore.setSession({
      accessToken,
      tokenType: payloadData?.token_type ?? payload?.token_type ?? "Bearer",
      expiresAt: payloadData?.expires_at ?? payload?.expires_at ?? "",
      user: payloadData?.user ?? payload?.user ?? null,
    });

    return true;
  } catch {
    return false;
  }
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();
  const publicPaths = new Set(["/login"]);
  const adminOnlyPaths = new Set([
    "/users-management",
    "/company-setup",
    "/system-logs",
  ]);

  let token = authStore.accessToken;

  if (!token && !publicPaths.has(to.path)) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      token = authStore.accessToken;
    }
  }

  if (!token && !publicPaths.has(to.path)) {
    const redirect =
      to.fullPath && to.fullPath !== "/" ? to.fullPath : undefined;

    return navigateTo({
      path: "/login",
      query: redirect ? { redirect } : undefined,
    });
  }

  if (token && publicPaths.has(to.path)) {
    let redirectTarget =
      (to.query.redirect as string | undefined) ?? "/";
    if (!redirectTarget || redirectTarget === "/login") {
      redirectTarget = "/";
    }
    return navigateTo(redirectTarget);
  }

  if (token && adminOnlyPaths.has(to.path)) {
    const role = authStore.userRole;
    if (!role || role.toLowerCase() !== "admin") {
      message.warning("You do not have permission to access this page.");
      return navigateTo("/");
    }
  }
});

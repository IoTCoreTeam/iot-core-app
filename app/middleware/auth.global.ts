import { message } from "ant-design-vue";

function getStoredUserRole(): string | null {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser);
    const roleValue = parsed?.role ?? parsed?.user_role ?? parsed?.type ?? null;
    return typeof roleValue === "string" ? roleValue : null;
  } catch {
    return null;
  }
}

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return;
  }

  const token = localStorage.getItem("access_token");
  const publicPaths = new Set(["/login"]);
  const adminOnlyPaths = new Set([
    "/users-management",
    "/company-setup",
    "/system-logs",
  ]);

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
    const role = getStoredUserRole();
    if (!role || role.toLowerCase() !== "admin") {
      message.warning("You do not have permission to access this page.");
      return navigateTo("/");
    }
  }
});

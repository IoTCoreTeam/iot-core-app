export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return;
  }

  const token = localStorage.getItem("access_token");
  const publicPaths = new Set(["/login"]);

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
});

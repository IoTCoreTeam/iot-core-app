<template>
  <div
    class="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center p-4 relative pt-20"
  >
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-sm blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-sm blur-3xl"></div>
    </div>

    <!-- Login container -->
    <div class="relative w-full max-w-md z-10">
      <!-- Logo section -->
      <div class="text-center mb-6">
        <div
          class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-sm mb-3 shadow-lg shadow-blue-500/20"
        >
          <svg
            class="w-7 h-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            ></path>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white mb-1 tracking-wide">
          IOT CORE SYSTEM
        </h1>
        <p class="text-xs text-slate-400">
          Smart Industrial Management Platform
        </p>
      </div>

      <!-- Card -->
      <div
        class="bg-slate-800/95 backdrop-blur-md rounded-sm shadow-xl p-6 border border-slate-700"
      >
        <h2 class="text-base font-bold text-white mb-5 uppercase tracking-wide">
          Sign In
        </h2>

        <!-- Error message -->
        <div
          v-if="error"
          class="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded-sm"
        >
          <p class="text-red-400 text-xs">{{ error }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email input -->
          <div>
            <label
              for="email"
              class="block text-xs font-medium text-slate-300 mb-1.5 uppercase"
              >Email</label
            >
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Email address"
              class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-sm text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              required
            />
            <p v-if="errors.email" class="text-red-400 text-xs mt-1">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password input -->
          <div>
            <label
              for="password"
              class="block text-xs font-medium text-slate-300 mb-1.5 uppercase"
              >Password</label
            >
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Enter your password"
              class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-sm text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              required
            />
            <p v-if="errors.password" class="text-red-400 text-xs mt-1">
              {{ errors.password }}
            </p>
          </div>

          <!-- actions row -->
          <div class="flex items-center justify-between text-xs text-slate-400">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="form.remember"
                type="checkbox"
                class="w-3 h-3 text-blue-500 border-slate-600 bg-slate-700 focus:ring-0 focus:ring-offset-0 rounded-sm"
              />
              Remember me
            </label>
            <a href="#" class="text-slate-300 hover:text-white transition">
              Forgot Password?
            </a>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-sm transition duration-200 flex items-center justify-center gap-2 mt-4   shadow-md shadow-blue-500/20"
          >
            <svg
              v-if="loading"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            <span class="text-sm">{{
              loading ? "Processing..." : "Sign In"
            }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { apiConfig } from "../../config/api"

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginFieldErrors {
  email: string;
  password: string;
}

const router = useRouter();
const route = useRoute();
const API_BASE = apiConfig.auth;

const form = ref<LoginForm>({
  email: "",
  password: "",
  remember: false,
});

const errors = ref<LoginFieldErrors>({
  email: "",
  password: "",
});

const loading = ref(false);
const error = ref("");

const handleLogin = async () => {
  errors.value = { email: "", password: "" };
  error.value = "";

  if (!form.value.email) {
    errors.value.email = "Email is required";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = "Invalid email format";
    return;
  }

  if (!form.value.password) {
    errors.value.password = "Password is required";
    return;
  }

  if (form.value.password.length < 6) {
    errors.value.password = "Password must be at least 6 characters long";
    return;
  }

  loading.value = true;

  try {
    const endpoint = `${API_BASE}/login`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: form.value.email,
        password: form.value.password,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const validationErrors = payload?.errors;
      if (validationErrors) {
        errors.value.email = validationErrors.email?.[0] ?? "";
        errors.value.password = validationErrors.password?.[0] ?? "";
        if (!errors.value.email && !errors.value.password) {
          error.value = payload?.message ?? "Invalid credentials.";
        }
        throw new Error("Validation error");
      }
      throw new Error(payload?.message ?? "Invalid credentials.");
    }

    const payloadData = payload?.data ?? payload;
    const accessToken: string | undefined =
      payloadData?.access_token ??
      payloadData?.token ??
      payload?.access_token ??
      payload?.token;

    if (!accessToken) {
      throw new Error("Access token missing from server response.");
    }

    if (import.meta.client) {
      localStorage.setItem("remember_me", form.value.remember ? "1" : "0");
      localStorage.setItem("access_token", accessToken);
      const tokenType = payloadData?.token_type ?? payload?.token_type ?? "Bearer";
      localStorage.setItem("token_type", tokenType);
      const user = payloadData?.user ?? payload?.user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    }

    const redirectTo = (route.query.redirect as string | undefined) ?? "/";

    form.value.password = "";

    await router.push(redirectTo);
  } catch (err: any) {
    if (err instanceof Error && err.message === "Validation error") {
      loading.value = false;
      return;
    }
    error.value =
      err?.message ?? "Unable to sign in. Please try again.";
  } finally {
    loading.value = false;
  }
};

definePageMeta({
  layout: false,
});
</script>

<style scoped>
input:focus {
  background-color: rgba(30, 41, 59, 0.85);
}
</style>

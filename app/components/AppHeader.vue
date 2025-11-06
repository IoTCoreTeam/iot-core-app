<template>
  <header class="w-full bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto flex items-center px-2 py-4">
      <!-- Left: App name -->
      <NuxtLink to="/">
        <h1 class="text-sm font-bold text-blue-800 tracking-tight">
          IOT CORE OPERATION
        </h1>
      </NuxtLink>

      <!-- Navigation -->
      <nav class="flex items-center space-x-10 ml-16">
        <NuxtLink
          to="/"
          class="text-gray-700 text-sm font-semibold hover:text-blue-700 cursor-pointer"
        >
          Dashboard
        </NuxtLink>

        <NuxtLink
          to="/devices-control"
          class="text-gray-700 text-sm font-semibold hover:text-blue-700 cursor-pointer"
        >
          Devices Control
        </NuxtLink>

        <NuxtLink
          to="/map-configuration"
          class="text-gray-700 text-sm font-semibold hover:text-blue-700 cursor-pointer"
        >
          Map Configuration
        </NuxtLink>

        <NuxtLink
          to="/scenarios"
          class="text-gray-700 text-sm font-semibold hover:text-blue-700 cursor-pointer"
        >
          Scenarios
        </NuxtLink>

        <NuxtLink
          to="/logs"
          class="text-gray-700 text-sm font-semibold hover:text-blue-700 cursor-pointer"
        >
          Logs
        </NuxtLink>

        <!-- Internal dropdown -->
        <div class="relative text-sm font-semibold cursor-pointer">
          <button
            @click="toggleDropdown('internal')"
            class="flex items-center text-gray-700 hover:text-blue-700 transition-colors"
          >
            Internal
            <svg
              class="w-2 h-2 ml-1 mt-1 transition-transform duration-200"
              :class="{ 'rotate-180': openDropdown === 'internal' }"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            v-if="openDropdown === 'internal'"
            @click.outside="closeDropdown"
            class="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          >
            <NuxtLink
              to="/company-setup"
              class="block px-4 py-2 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              Company Setup
            </NuxtLink>
            <NuxtLink
              to="/users-management"
              class="block px-4 py-1 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              Users Management
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- Right: Account dropdown -->
      <div class="relative ml-auto text-sm font-semibold cursor-pointer">
        <button
          @click="toggleDropdown('account')"
          class="flex items-center text-gray-700 hover:text-blue-700 transition-colors"
        >
          Account
          <svg
            class="w-2 h-2 ml-1 mt-1 transition-transform duration-200"
            :class="{ 'rotate-180': openDropdown === 'account' }"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div
          v-if="openDropdown === 'account'"
          @click.outside="closeDropdown"
          class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
        >
          <NuxtLink
            to="/user-account"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            @click="closeDropdown"
          >
            Management
          </NuxtLink>
          <button
            type="button"
            class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
            :disabled="isLoggingOut"
            @click="handleLogout"
          >
            {{ isLoggingOut ? "Logging out..." : "Logout" }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";

const openDropdown = ref<string | null>(null);
const isLoggingOut = ref(false);
const router = useRouter();
const runtimeConfig = useRuntimeConfig();

const apiBase =
  runtimeConfig.public?.apiBase ??
  (runtimeConfig as Record<string, any>)?.apiBase ??
  "http://127.0.0.1:8000/api";

// Toggle dropdown (both Account & Internal)
function toggleDropdown(name: "internal" | "account") {
  openDropdown.value = openDropdown.value === name ? null : name;
}

// Close dropdown on outside click
function closeDropdown() {
  openDropdown.value = null;
}

async function handleLogout() {
  if (!import.meta.client || isLoggingOut.value) return;
  isLoggingOut.value = true;

  const accessToken = localStorage.getItem("access_token");
  const tokenType = localStorage.getItem("token_type") ?? "Bearer";

  try {
    if (accessToken) {
      await fetch(`${apiBase}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType} ${accessToken}`,
        },
      });
    }
  } catch (error) {
    console.error("Failed to logout:", error);
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user");
    localStorage.removeItem("remember_me");
    isLoggingOut.value = false;
    openDropdown.value = null;
    await router.push("/login");
  }
}
</script>

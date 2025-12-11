<template>
  <header class="w-full bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-8xl mx-auto flex items-center py-3 px-5">
      <!-- Left: App name -->
      <NuxtLink to="/">
        <h1 class="text-sm font-bold text-blue-800 tracking-tight px-1">
          IOT CORE SYSTEM
        </h1>
      </NuxtLink>

      <!-- Navigation -->
      <nav class="flex items-center space-x-10 ml-16">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 text-gray-700 text-sm font-semibold hover:text-blue-700 transition-colors cursor-pointer border-b-2 border-transparent py-1 hover:border-blue-500"
        >
          <BootstrapIcon name="grid-1x2" class="w-3 h-3" />
          Dashboard
        </NuxtLink>
        <!-- Devices Management dropdown -->
        <div class="relative text-sm font-semibold cursor-pointer">
          <button
            @click="toggleDropdown('devices')"
            class="flex items-center gap-2 text-gray-700 hover:text-blue-700 transition-colors border-b-2 border-transparent py-1 hover:border-blue-500"
          >
            <BootstrapIcon name="hdd-network" class="w-3 h-3" />
            Devices Management
            <svg
              class="w-2 h-2 ml-1 mt-1 transition-transform duration-200"
              :class="{ 'rotate-180': openDropdown === 'devices' }"
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
            v-if="openDropdown === 'devices'"
            @click.outside="closeDropdown"
            class="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          >
            <NuxtLink
              to="/devices-control/control-dashboard"
              class="block px-4 py-2 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              Devices Control
            </NuxtLink>

            <NuxtLink
              to="/devices-control/map-configuration"
              class="block px-4 py-2 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              Map Configuration
            </NuxtLink>
          </div>
        </div>
        <div class="relative text-sm font-semibold cursor-pointer">
          <button
            @click="toggleDropdown('monitoring')"
            class="flex items-center gap-2 text-gray-700 hover:text-blue-700 transition-colors border-b-2 border-transparent py-1 hover:border-blue-500"
          >
            <BootstrapIcon name="clipboard-data" class="w-3 h-3" />
            System Monitoring
            <svg
              class="w-2 h-2 ml-1 mt-1 transition-transform duration-200"
              :class="{ 'rotate-180': openDropdown === 'monitoring' }"
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
            v-if="openDropdown === 'monitoring'"
            @click.outside="closeDropdown"
            class="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          >
            <NuxtLink
              to="/system-logs"
              class="block px-4 py-2 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              System Logs
            </NuxtLink>
            <NuxtLink
              to="/alerts"
              class="block px-4 py-2 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              Alerts
            </NuxtLink>
          </div>
        </div>
        <!-- Internal dropdown -->
        <div class="relative text-sm font-semibold cursor-pointer">
          <button
            @click="toggleDropdown('internal')"
            class="flex items-center gap-2 text-gray-700 hover:text-blue-700 transition-colors border-b-2 border-transparent py-1 hover:border-blue-500"
          >
            <BootstrapIcon name="building" class="w-3 h-3" />
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
              to="/users-management"
              class="block px-4 py-1 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              Users Management
            </NuxtLink>

            <NuxtLink
              to="/company-setup"
              class="block px-4 py-2 text-gray-700 text-sm hover:bg-blue-50 hover:text-blue-700"
              @click="closeDropdown"
            >
              Company Setup
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- Right: Account dropdown -->
      <div class="relative ml-auto text-sm font-semibold cursor-pointer">
        <button
          @click="toggleDropdown('account')"
          class="flex items-center gap-2 text-gray-700 hover:text-blue-700 transition-colors border-b-2 border-transparent py-1 hover:border-blue-500"
        >
          {{ userName }}
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
import { ref, computed } from "vue";
import { apiConfig } from "../../config/api"
import { useAuthStore } from "~~/stores/auth";

const openDropdown = ref<string | null>(null);
const isLoggingOut = ref(false);
const router = useRouter();
const AUTH_API = apiConfig.auth;
const authStore = useAuthStore();
const userName = computed(() => authStore.user?.name ?? "Account");

// Toggle dropdown (Devices, Internal, Account)
function toggleDropdown(name: "devices" | "monitoring" | "internal" | "account") {
  openDropdown.value = openDropdown.value === name ? null : name;
}

// Close dropdown on outside click
function closeDropdown() {
  openDropdown.value = null;
}

async function handleLogout() {
  if (!import.meta.client || isLoggingOut.value) return;
  isLoggingOut.value = true;

  const authorization = authStore.authorizationHeader;

  try {
    if (authorization) {
      await fetch(`${AUTH_API}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: authorization,
        },
        credentials: "include",
      });
    }
  } catch (error) {
    console.error("Failed to logout:", error);
  } finally {
    authStore.clearSession();
    localStorage.removeItem("remember_me");
    isLoggingOut.value = false;
    openDropdown.value = null;
    await router.push("/login");
  }
}
</script>

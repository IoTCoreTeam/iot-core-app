<template>
  <header class="w-full bg-white border-b border-gray-200 ">
    <div class="max-w-8xl mx-auto flex items-center py-3 px-5">
      <!-- Left: App name -->
      <NuxtLink to="/">
        <h1 class="text-sm font-bold text-blue-800 tracking-tight px-1">
          IOT CORE SYSTEM
        </h1>
      </NuxtLink>

      <!-- Navigation -->
      <nav class="hidden md:flex items-center space-x-10 ml-16">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 text-gray-700 text-sm font-semibold hover:text-blue-700 transition-colors cursor-pointer border-b-2 border-transparent py-1 hover:border-blue-500"
        >
          <BootstrapIcon name="grid-1x2" class="w-3 h-3" />
          Dashboard
        </NuxtLink>
        <NuxtLink
          to="/devices-control/devices-registration"
          class="flex items-center gap-2 text-gray-700 text-sm font-semibold hover:text-blue-700 transition-colors cursor-pointer border-b-2 border-transparent py-1 hover:border-blue-500"
        >
          <BootstrapIcon name="hdd-network" class="w-3 h-3" />
          Device Control Center
        </NuxtLink>
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
      <div class="relative ml-auto hidden text-sm font-semibold cursor-pointer md:block">
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

      <button
        type="button"
        class="ml-auto inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 md:hidden"
        @click="openMobileMenu"
        aria-label="Open navigation"
      >
        <BootstrapIcon name="list" class="h-4 w-4" />
      </button>
    </div>

    <transition name="fade">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-50 md:hidden">
        <div class="absolute inset-0 bg-black/40" @click="closeMobileMenu" />
        <div class="relative ml-auto flex h-full w-72 flex-col bg-white shadow-xl">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-semibold text-gray-800">Navigation</h2>
            <button
              type="button"
              class="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-50"
              @click="closeMobileMenu"
              aria-label="Close navigation"
            >
              <BootstrapIcon name="x" class="h-4 w-4" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-4 py-5 text-sm text-gray-700">
            <div>
              <p class="px-3 text-[11px] font-semibold uppercase text-gray-500">Overview</p>
              <NuxtLink
                to="/"
                class="mt-2 flex items-center gap-2 rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                @click="closeMobileMenu"
              >
                Dashboard
              </NuxtLink>
            </div>

            <div class="mt-4">
              <p class="px-3 text-[11px] font-semibold uppercase text-gray-500">Device Control Center</p>
              <div class="mt-2 flex flex-col">
                <NuxtLink
                  to="/devices-control/devices-registration"
                  class="rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                  @click="closeMobileMenu"
                >
                  Devices Registration
                </NuxtLink>
              </div>
            </div>

            <div class="mt-4">
              <p class="px-3 text-[11px] font-semibold uppercase text-gray-500">System Monitoring</p>
              <div class="mt-2 flex flex-col">
                <NuxtLink
                  to="/system-logs"
                  class="rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                  @click="closeMobileMenu"
                >
                  System Logs
                </NuxtLink>
                <NuxtLink
                  to="/alerts"
                  class="rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                  @click="closeMobileMenu"
                >
                  Alerts
                </NuxtLink>
              </div>
            </div>

            <div class="mt-4">
              <p class="px-3 text-[11px] font-semibold uppercase text-gray-500">Internal</p>
              <div class="mt-2 flex flex-col">
                <NuxtLink
                  to="/users-management"
                  class="rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                  @click="closeMobileMenu"
                >
                  Users Management
                </NuxtLink>
                <NuxtLink
                  to="/company-setup"
                  class="rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                  @click="closeMobileMenu"
                >
                  Company Setup
                </NuxtLink>
              </div>
            </div>
          </div>
          <div class="border-t border-gray-200 p-4 text-sm font-semibold text-gray-700">
            <p class="px-1 text-xs text-gray-500">Account</p>
            <NuxtLink
              to="/user-account"
              class="mt-2 block rounded-md px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
              @click="closeMobileMenu"
            >
              Management
            </NuxtLink>
            <button
              type="button"
              class="mt-2 w-full rounded-md border border-red-200 px-3 py-2 text-left text-red-600 hover:bg-red-50"
              :disabled="isLoggingOut"
              @click="handleLogout"
            >
              {{ isLoggingOut ? "Logging out..." : "Logout" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { apiConfig } from "../../config/api"
import { useAuthStore } from "~~/stores/auth";

const openDropdown = ref<string | null>(null);
const isLoggingOut = ref(false);
const isMobileMenuOpen = ref(false);
const router = useRouter();
const AUTH_API = apiConfig.auth;
const authStore = useAuthStore();
const userName = computed(() => authStore.user?.name ?? "Account");
const route = useRoute();

// Toggle dropdown (Monitoring, Internal, Account)
function toggleDropdown(name: "monitoring" | "internal" | "account") {
  openDropdown.value = openDropdown.value === name ? null : name;
}

// Close dropdown on outside click
function closeDropdown() {
  openDropdown.value = null;
}

function openMobileMenu() {
  isMobileMenuOpen.value = true;
  closeDropdown();
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

watch(
  () => route.fullPath,
  () => {
    closeDropdown();
    closeMobileMenu();
  }
);

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
    closeMobileMenu();
    await router.push("/login");
  }
}
</script>

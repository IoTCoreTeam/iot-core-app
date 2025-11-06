<template>
  <div class="min-h-[80vh] bg-gray-100 pt-5 pb-10">
    <div class="max-w-7xl mx-auto px-4">
      <div class="bg-white rounded-sm overflow-hidden">
        <div class="bg-white text-white px-6 py-4 pb-0 flex items-center">
          <div class="text-left">
            <p class="text-[10px] uppercase tracking-widest text-gray-600">
              Company
            </p>
            <p class="text-md font-medium text-gray-800">
              {{ companyName || "--" }}
            </p>
          </div>
        </div>

        <div class="px-6 py-6 space-y-6 text-sm">
          <div
            v-if="error"
            class="rounded border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-xs"
          >
            {{ error }}
          </div>

          <div
            v-if="loading"
            class="flex items-center justify-center text-xs text-gray-500 py-10"
          >
            <svg
              class="w-4 h-4 mr-2 animate-spin text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Loading account details...
          </div>

          <div v-else class="space-y-4 text-xs text-gray-600">
            <div>
              <p class="uppercase text-[10px] tracking-wide text-gray-400 mb-1">
                Full Name
              </p>
              <p class="px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                {{ accountForm.name || "--" }}
              </p>
            </div>
            <div>
              <p class="uppercase text-[10px] tracking-wide text-gray-400 mb-1">
                Email
              </p>
              <p class="px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                {{ accountForm.email || "--" }}
              </p>
            </div>

            <div>
              <p class="uppercase text-[10px] tracking-wide text-gray-400 mb-1">
                Role
              </p>
              <p class="px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                {{ accountForm.role || "--" }}
              </p>
            </div>
            <div>
              <p class="uppercase text-[10px] tracking-wide text-gray-400 mb-1">
                Description
              </p>
              <p
                class="px-3 py-2 bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap min-h-20vh"
              >
                {{ accountForm.description || "--" }}
              </p>
            </div>

            <div class="border-t border-gray-200 pt-4">
              <h3
                class="uppercase text-[10px] tracking-wide text-gray-400 mb-3"
              >
                Update Password
              </h3>
              <form class="grid gap-3 md:grid-cols-2">
                <div>
                  <label
                    class="block text-[11px] font-medium text-gray-500 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    autocomplete="current-password"
                    class="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label
                    class="block text-[11px] font-medium text-gray-500 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    v-model="passwordForm.newPassword"
                    type="password"
                    autocomplete="new-password"
                    class="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter new password"
                  />
                </div>
                <div class="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    @click="submitPassword"
                    :disabled="passwordLoading"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </div>

            <div
              class="flex justify-between items-center pt-4 border-t border-gray-200"
            >
              <button
                type="button"
                @click="refresh"
                class="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <p class="text-[11px] text-gray-400">
                The information is read-only for now. Contact administrator to
                update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";

interface AccountForm {
  name: string;
  email: string;
  role: string;
  description: string;
}

const accountForm = ref<AccountForm>({
  name: "",
  email: "",
  role: "",
  description: "",
});

const companyName = ref("");
const loading = ref(true);
const error = ref("");

const USER_URL = "http://127.0.0.1:8000/api/user";
const COMPANY_URL = "http://127.0.0.1:8000/api/company";
const CHANGE_PASSWORD_URL = "http://127.0.0.1:8000/api/change-password";

const buildAuthHeaders = (): Record<string, string> => {
  if (!import.meta.client) return {};

  const token = localStorage.getItem("access_token");
  const tokenType = localStorage.getItem("token_type") ?? "Bearer";

  if (!token) {
    throw new Error("Missing access token. Please sign in again.");
  }

  return {
    Authorization: `${tokenType} ${token}`,
  };
};

const hydrateFromCache = () => {
  if (!import.meta.client) return;
  const cachedUser = localStorage.getItem("user");
  if (!cachedUser) return;

  try {
    const parsed = JSON.parse(cachedUser);
    accountForm.value = {
      name: parsed?.name ?? "",
      email: parsed?.email ?? "",
      role: parsed?.role ?? "",
      description: parsed?.description ?? "",
    };
  } catch {
    // ignore invalid cache
  }
};

const fetchAccountData = async () => {
  loading.value = true;
  error.value = "";

  try {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...buildAuthHeaders(),
    };

    const [userRes, companyRes] = await Promise.all([
      fetch(USER_URL, { method: "GET", headers }),
      fetch(COMPANY_URL, { method: "GET", headers }),
    ]);

    if (!userRes.ok || !companyRes.ok) {
      const [userErr, companyErr] = await Promise.all([
        userRes.ok ? Promise.resolve({}) : userRes.json().catch(() => ({})),
        companyRes.ok
          ? Promise.resolve({})
          : companyRes.json().catch(() => ({})),
      ]);
      const messageText =
        (!userRes.ok && (userErr?.message || userErr?.error)) ||
        (!companyRes.ok && (companyErr?.message || companyErr?.error)) ||
        "Unable to load account information.";
      throw new Error(messageText);
    }

    const [userPayload, companyPayload] = await Promise.all([
      userRes.json().catch(() => ({})),
      companyRes.json().catch(() => ({})),
    ]);

    const userData = userPayload?.data ?? userPayload;
    const companyData = companyPayload?.data ?? companyPayload;

    accountForm.value = {
      name: userData?.name ?? "",
      email: userData?.email ?? "",
      role: userData?.role ?? "",
      description: userData?.description ?? "",
    };

    companyName.value = companyData?.name ?? "";

    if (import.meta.client) {
      localStorage.setItem("user", JSON.stringify(userData ?? {}));
    }
  } catch (err: any) {
    const isMissingToken =
      typeof err?.message === "string" &&
      err.message.includes("Missing access token");
    const messageText = isMissingToken
      ? "Missing access token. Please sign in again."
      : "Unable to load account information. Please try again later.";
    error.value = messageText;
    message.error(messageText);
  } finally {
    loading.value = false;
  }
};

const refresh = () => {
  fetchAccountData();
};

const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
});

const passwordLoading = ref(false);

const submitPassword = async () => {
  if (passwordLoading.value) return;

  const currentPassword = passwordForm.value.currentPassword.trim();
  const newPassword = passwordForm.value.newPassword.trim();

  if (!currentPassword) {
    message.warning("Please enter your current password.");
    return;
  }

  if (!newPassword) {
    message.warning("Please enter a new password.");
    return;
  }

  if (newPassword.length < 8) {
    message.warning("New password must be at least 8 characters.");
    return;
  }

  if (currentPassword === newPassword) {
    message.warning("New password must be different from the current password.");
    return;
  }

  passwordLoading.value = true;

  try {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...buildAuthHeaders(),
    };

    const response = await fetch(CHANGE_PASSWORD_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unable to update password. Please try again.";
      if (response.status === 401) {
        errorMessage = "Session expired. Please sign in again.";
      } else if (response.status === 422 || response.status === 400) {
        errorMessage =
          "Unable to update password. Please verify the information.";
      }
      throw new Error(errorMessage);
    }

    message.success("Password updated successfully.");
    passwordForm.value.currentPassword = "";
    passwordForm.value.newPassword = "";
  } catch (err: any) {
    const messageText =
      typeof err?.message === "string" && err.message.trim()
        ? err.message.trim()
        : "Unable to update password. Please try again.";
    message.error(messageText);
  } finally {
    passwordLoading.value = false;
  }
};

onMounted(() => {
  hydrateFromCache();
  fetchAccountData();
});
</script>

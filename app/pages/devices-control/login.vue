<template>
  <div
    class="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center p-4 relative pt-20"
  >
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-sm blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-sm blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-lg z-10">
      <div class="text-center mb-6">
        <div
          class="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-sm mb-3 shadow-lg shadow-emerald-400/30"
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
              d="M3 7h4l3 12 4-16 3 12h4"
            ></path>
          </svg>
        </div>
        <p class="text-xs uppercase tracking-[0.3em] text-emerald-300 mb-2">
          Restricted module
        </p>
        <h1 class="text-2xl font-bold text-white tracking-wide">
          Devices Control Access
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Use the dedicated control credentials to unlock device commands.
        </p>
      </div>

      <div
        class="bg-slate-800/95 backdrop-blur-md rounded-sm shadow-xl p-6 border border-slate-700"
      >
        <h2 class="text-base font-bold text-white mb-2 uppercase tracking-wide">
          Secondary authentication
        </h2>
        <p class="text-xs text-slate-400 mb-5">
          This step keeps the command layer isolated from the core login.
        </p>

        <div
          v-if="error"
          class="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded-sm"
        >
          <p class="text-red-400 text-xs">{{ error }}</p>
        </div>

        <form @submit.prevent="handleModuleLogin" class="space-y-4">
          <div>
            <label
              for="moduleId"
              class="block text-xs font-medium text-slate-300 mb-1.5 uppercase"
              >Module access ID</label
            >
            <input
              id="moduleId"
              v-model.trim="form.moduleId"
              type="text"
              maxlength="60"
              placeholder="e.g. Floor-2/Gateway-07"
              class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-sm text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              required
            />
            <p v-if="errors.moduleId" class="text-red-400 text-xs mt-1">
              {{ errors.moduleId }}
            </p>
          </div>

          <div>
            <label
              for="accessKey"
              class="block text-xs font-medium text-slate-300 mb-1.5 uppercase"
              >Control PIN / key</label
            >
            <input
              id="accessKey"
              v-model="form.accessKey"
              type="password"
              minlength="4"
              placeholder="Enter the control key"
              class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-sm text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition tracking-widest"
              required
            />
            <p v-if="errors.accessKey" class="text-red-400 text-xs mt-1">
              {{ errors.accessKey }}
            </p>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="form.remember"
                type="checkbox"
                class="w-3 h-3 text-emerald-500 border-slate-600 bg-slate-700 focus:ring-0 focus:ring-offset-0 rounded-sm"
              />
              Remember this console
            </label>
            <span class="text-slate-300">Need help? Contact ops</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-sm transition duration-200 flex items-center justify-center gap-2 mt-4 shadow-md shadow-emerald-500/20"
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
              loading ? "Authorizing..." : "Unlock Control Module"
            }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { apiConfig } from "../../../config/api";

interface ControlModuleForm {
  moduleId: string;
  accessKey: string;
  remember: boolean;
}

interface ControlModuleErrors {
  moduleId: string;
  accessKey: string;
}

const router = useRouter();
const route = useRoute();
const API_BASE = apiConfig.auth;

const form = ref<ControlModuleForm>({
  moduleId: "",
  accessKey: "",
  remember: true,
});

const errors = ref<ControlModuleErrors>({
  moduleId: "",
  accessKey: "",
});

const loading = ref(false);
const error = ref("");

const handleModuleLogin = async () => {
  errors.value = { moduleId: "", accessKey: "" };
  error.value = "";

  if (!form.value.moduleId.trim()) {
    errors.value.moduleId = "Module ID is required";
    return;
  }

  if (form.value.moduleId.trim().length < 3) {
    errors.value.moduleId = "Module ID must be at least 3 characters";
    return;
  }

  if (!form.value.accessKey.trim()) {
    errors.value.accessKey = "Control key is required";
    return;
  }

  if (form.value.accessKey.trim().length < 4) {
    errors.value.accessKey = "Control key must be at least 4 characters";
    return;
  }

  loading.value = true;

  try {
    const endpoint = `${API_BASE}/devices-control/login`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        module_id: form.value.moduleId.trim(),
        access_key: form.value.accessKey.trim(),
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const validationErrors = payload?.errors;
      if (validationErrors) {
        errors.value.moduleId = validationErrors.module_id?.[0] ?? "";
        errors.value.accessKey = validationErrors.access_key?.[0] ?? "";
        if (!errors.value.moduleId && !errors.value.accessKey) {
          error.value = payload?.message ?? "Unable to authorize module.";
        }
        throw new Error("Validation error");
      }
      throw new Error(payload?.message ?? "Unable to authorize module.");
    }

    const payloadData = payload?.data ?? payload;
    const controlToken: string | undefined =
      payloadData?.access_token ??
      payloadData?.token ??
      payload?.access_token ??
      payload?.token;

    if (!controlToken) {
      throw new Error("Control token missing from server response.");
    }

    if (import.meta.client) {
      localStorage.setItem(
        "control_module_remember",
        form.value.remember ? "1" : "0",
      );
      localStorage.setItem("control_module_token", controlToken);
      const tokenType =
        payloadData?.token_type ?? payload?.token_type ?? "Bearer";
      localStorage.setItem("control_module_token_type", tokenType);
      const moduleInfo = payloadData?.module ?? payload?.module;
      if (moduleInfo) {
        localStorage.setItem("control_module_info", JSON.stringify(moduleInfo));
        if (moduleInfo?.id) {
          localStorage.setItem("control_module_id", moduleInfo.id);
        }
      } else {
        localStorage.removeItem("control_module_info");
        localStorage.setItem("control_module_id", form.value.moduleId.trim());
      }
    }

    form.value.accessKey = "";
    const redirectTo =
      (route.query.redirect as string | undefined) ?? "/devices-control";
    await router.push(redirectTo);
  } catch (err: any) {
    if (err instanceof Error && err.message === "Validation error") {
      loading.value = false;
      return;
    }
    error.value =
      err?.message ?? "Unable to authorize module. Please try again.";
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

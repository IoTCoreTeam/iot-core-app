<template>
  <BaseModal
    :model-value="isOpen"
    title="User Details"
    max-width="max-w-2xl"
    panel-class="p-6 shadow-xl"
    :close-disabled="isBusy"
    @request-close="closeModal"
  >
    <div class="space-y-4 text-xs">
      <div
        v-if="loadError"
        class="border border-red-200 bg-red-50 text-red-600 px-3 py-2 rounded flex items-center justify-between gap-3"
      >
        <span>{{ loadError }}</span>
        <button
          type="button"
          class="text-[11px] font-medium underline"
          @click="fetchUserDetail"
        >
          Retry
        </button>
      </div>

      <div v-if="isLoading" class="py-8">
        <LoadingState message="Loading user details..." />
      </div>

      <form v-else class="space-y-4" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full py-2 px-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              v-model="form.email"
              type="email"
              class="w-full py-2 px-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              placeholder="Email address"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              v-model="form.role"
              class="w-full py-2 px-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"
              required
            >
              <option value="">Select role</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
              <option value="Guest">Guest</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              v-model="form.password"
              type="password"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              placeholder="Leave blank to keep the current password"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-medium text-gray-700 mb-1">
              Created At
            </label>
            <input
              :value="formattedCreatedAt"
              type="text"
              class="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded text-xs cursor-not-allowed"
              readonly
              disabled
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-700 mb-1">
              Updated At
            </label>
            <input
              :value="formattedUpdatedAt"
              type="text"
              class="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded text-xs cursor-not-allowed"
              readonly
              disabled
            />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            placeholder="Enter description"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isBusy"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isBusy"
          >
            {{ isSaving ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { message } from "ant-design-vue";
import BaseModal from "../BaseModal.vue";
import LoadingState from "@/components/common/LoadingState.vue";
import { apiConfig } from "~~/config/api";

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role?: string;
  description?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

const props = defineProps<{
  userId: number | null;
}>();

const emit = defineEmits(["close", "updated"]);

const API_URL =  apiConfig.auth + "/users";

const isOpen = ref(true);
const isLoading = ref(false);
const isSaving = ref(false);
const loadError = ref("");

const form = ref({
  name: "",
  email: "",
  role: "",
  description: "",
  createdAt: "",
  updatedAt: "",
  password: "",
});

const isBusy = computed(() => isLoading.value || isSaving.value);

const formatDate = (value?: string) => {
  if (!value) return "--";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const formattedCreatedAt = computed(() => formatDate(form.value.createdAt));
const formattedUpdatedAt = computed(() => formatDate(form.value.updatedAt));

const getAuthHeaders = (): Record<string, string> => {
  if (!import.meta.client) {
    throw new Error("Missing access token. Please sign in again.");
  }
  const token = localStorage.getItem("access_token");
  const tokenType = localStorage.getItem("token_type") ?? "Bearer";

  if (!token) {
    throw new Error("Missing access token. Please sign in again.");
  }

  return {
    Authorization: `${tokenType} ${token}`,
    Accept: "application/json",
  };
};

async function fetchUserDetail() {
  if (!props.userId) return;

  try {
    isLoading.value = true;
    loadError.value = "";

    const headers = getAuthHeaders();
    const url = new URL(API_URL);
    url.searchParams.set("id", String(props.userId));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success === false) {
      const errorMessage =
        payload?.message ?? `Unable to fetch user (${response.status}).`;
      throw new Error(errorMessage);
    }

    const rawData = payload?.data ?? payload;
    const userRecord: UserDetail | undefined = Array.isArray(rawData)
      ? rawData[0]
      : rawData;

    if (!userRecord) {
      throw new Error("Unable to locate the selected user.");
    }

    form.value = {
      name: userRecord.name ?? "",
      email: userRecord.email ?? "",
      role: userRecord.role ?? "",
      description: userRecord.description ?? "",
      createdAt: userRecord.created_at ?? userRecord.createdAt ?? "",
      updatedAt: userRecord.updated_at ?? userRecord.updatedAt ?? "",
      password: "",
    };
  } catch (error: any) {
    const messageText =
      typeof error?.message === "string" && error.message.trim().length > 0
        ? error.message.trim()
        : "Unable to load user details.";
    loadError.value = messageText;
    message.error(messageText);
  } finally {
    isLoading.value = false;
  }
}

async function submitForm() {
  if (!props.userId) return;

  if (!form.value.name.trim()) {
    message.warning("Name is required.");
    return;
  }

  if (!form.value.email.trim()) {
    message.warning("Email is required.");
    return;
  }

  if (!form.value.role.trim()) {
    message.warning("Role is required.");
    return;
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeaders(),
    };

    const payload: Record<string, any> = {
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      role: form.value.role.trim(),
      description: form.value.description.trim(),
    };

    if (form.value.password.trim()) {
      payload.password = form.value.password.trim();
      payload.password_confirmation = form.value.password.trim();
    }

    isSaving.value = true;
    const response = await fetch(`${API_URL}/${props.userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body?.success === false) {
      const validationErrors = body?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .find((msg) => typeof msg === "string" && msg.trim().length > 0);
        if (typeof firstError === "string") {
          throw new Error(firstError);
        }
      }

      throw new Error(
        body?.message ?? `Failed to update user (${response.status}).`
      );
    }

    const successMessage = body?.message ?? "User updated successfully.";
    message.success(successMessage);
    emit("updated", { id: props.userId, ...form.value });
    closeModal(true);
  } catch (error: any) {
    const messageText =
      typeof error?.message === "string" && error.message.trim().length > 0
        ? error.message.trim()
        : "Unable to update user.";
    message.error(messageText);
  } finally {
    isSaving.value = false;
  }
}

function closeModal(force = false) {
  if (!force && isBusy.value) return;
  isOpen.value = false;
  emit("close");
}

function handleCancel(event?: MouseEvent) {
  event?.preventDefault();
  closeModal();
}

onMounted(() => {
  fetchUserDetail();
});

watch(
  () => props.userId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchUserDetail();
    }
  }
);
</script>

<template>
  <BaseModal
    v-model="isOpen"
    title="Add New User"
    max-width="max-w-2xl"
    panel-class="p-6 shadow-xl"
    header-class="mb-4"
    :close-disabled="isSubmitting"
    @request-close="closeModal"
    @after-leave="handleAfterLeave"
  >
    <form
      @submit.prevent="submitForm"
      class="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
        <input
          v-model="user.name"
          type="text"
          class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter name"
          required
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
        <input
          v-model="user.email"
          type="email"
          class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter email"
          required
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Role</label>
        <select
          v-model="user.role"
          class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select role</option>
          <option
            v-for="role in roleOptions"
            :key="role.value"
            :value="role.value"
          >
            {{ role.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
        <input
          v-model="user.password"
          type="password"
          class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter password"
          required
        />
      </div>

      <div class="md:col-span-2">
        <label class="block text-xs font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          v-model="user.description"
          rows="5"
          class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter description"
        ></textarea>
      </div>
    </form>

    <template #footer>
      <div class="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          @click="closeModal"
          :disabled="isSubmitting"
          class="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="isSubmitting"
          class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          @click="submitForm"
        >
          {{ isSubmitting ? "Adding..." : "Add" }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import BaseModal from "../BaseModal.vue";

interface User {
  name: string;
  email: string;
  role: string;
  password?: string;
  description?: string;
}

const emit = defineEmits(["close", "save"]);

const isOpen = ref(true);
const isSubmitting = ref(false);
const API_URL = apiConfig.auth + "/register";
const authStore = useAuthStore();

const user = ref<User>({
  name: "",
  email: "",
  role: "",
  password: "",
  description: "",
});

const roleOptions = computed(() => [
  { label: "Admin", value: "admin" },
  { label: "Engineer", value: "engineer" },
  { label: "User", value: "user" },
]);

function closeModal() {
  if (isSubmitting.value) return;
  isOpen.value = false;
}

function handleAfterLeave() {
  emit("close");
}

function resetForm() {
  user.value = { name: "", email: "", role: "", password: "", description: "" };
}

async function submitForm() {
  if (!user.value.name || !user.value.email || !user.value.role) {
    message.warning("Please fill in all required fields.");
    return;
  }
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    message.error("Access token is required to register a user.");
    return;
  }
  isSubmitting.value = true;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        name: user.value.name,
        email: user.value.email,
        password: user.value.password,
        password_confirmation: user.value.password,
        role: user.value.role,
        description: user.value.description,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationErrors = payload?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .at(0) as string | undefined;
        throw new Error(firstError ?? "Validation error. Please check the form.");
      }
      throw new Error(
        payload?.message ?? `Failed to register user (${response.status})`
      );
    }

    const successMessage = "User registered successfully.";

    message.success(successMessage);
    emit("save", { ...user.value });
    resetForm();
    closeModal();
  } catch (error: any) {
    const errorMessage = error?.message ?? "Failed to register user.";
    message.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
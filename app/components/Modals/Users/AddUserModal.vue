<template>
  <transition name="modal-overlay" appear>
    <div
      v-if="isOpen"
      class="fixed inset-0 flex justify-center z-50 px-4 pt-12"
    >
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>

      <transition name="modal-slide" appear>
        <div
          class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 border border-gray-200 py-4 z-10 h-fit"
        >
          <!-- Header -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-semibold text-gray-800">Add New User</h3>
            <button
              @click="closeModal"
              :disabled="isSubmitting"
              class="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                class="w-5 h-5 cursor-pointer"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form
            @submit.prevent="submitForm"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Name</label
              >
              <input
                v-model="user.name"
                type="text"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter name"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Email</label
              >
              <input
                v-model="user.email"
                type="email"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Role</label
              >
              <select
                v-model="user.role"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select role</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
                <option value="Guest">Guest</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Password</label
              >
              <input
                v-model="user.password"
                type="password"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
                required
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Description</label
              >
              <textarea
                v-model="user.description"
                rows="5"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter description"
              ></textarea>
            </div>

            <!-- Buttons -->
            <div class="mt-4 flex justify-end space-x-3 md:col-span-2">
              <button
                type="button"
                @click="closeModal"
                :disabled="isSubmitting"
                class="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? "Adding..." : "Add" }}
              </button>
            </div>
          </form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";

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
const API_URL =  apiConfig.auth + "/register";

const user = ref<User>({
  name: "",
  email: "",
  role: "",
  password: "",
  description: "",
});

function closeModal(event: MouseEvent): void;
function closeModal(force: boolean): void;
function closeModal(arg?: MouseEvent | boolean) {
  const force = typeof arg === "boolean" ? arg : false;
  if (!force && isSubmitting.value) return;

  isOpen.value = false;
  setTimeout(() => emit("close"), 400);
}

function resetForm() {
  user.value = { name: "", email: "", role: "", password: "", description: "" };
}

async function submitForm() {
  if (!user.value.name || !user.value.email || !user.value.role) {
    message.warning("Please fill in all required fields.");
    return;
  }
  const token = import.meta.client
    ? localStorage.getItem("access_token")
    : null;
  const tokenType = import.meta.client
    ? localStorage.getItem("token_type") ?? "Bearer"
    : "Bearer";
  if (!token) {
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
        Authorization: `${tokenType} ${token}`,
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
    closeModal(true);
  } catch (error: any) {
    const errorMessage = error?.message ?? "Failed to register user.";
    message.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

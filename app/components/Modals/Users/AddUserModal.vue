<template>
  <!-- Transition bên ngoài: nền mờ -->
  <transition name="fade" appear>
    <div
      v-if="isOpen"
      class="fixed inset-0 flex justify-center z-50 px-4 pt-12"
    >
      <!-- Nền mờ -->
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>

      <!-- Transition bên trong: slide xuống -->
      <transition name="slide-down" appear>
        <div
          class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 border border-gray-200 py-4 z-10 h-fit"
        >
          <!-- Header -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-semibold text-gray-800">Add New User</h3>
            <button
              @click="closeModal"
              class="text-gray-500 hover:text-gray-700"
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
                class="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-white hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
              >
                Add
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

interface User {
  name: string;
  email: string;
  role: string;
  password?: string;
  description?: string;
}

const emit = defineEmits(["close", "save"]);

const isOpen = ref(true);

const user = ref<User>({
  name: "",
  email: "",
  role: "",
  password: "",
  description: "",
});

function closeModal() {
  isOpen.value = false;
  setTimeout(() => emit("close"), 400);
}

function submitForm() {
  if (!user.value.name || !user.value.email || !user.value.role) {
    message.warning("Please fill in all required fields.");
    return;
  }
  emit("save", { ...user.value });
  resetForm();
}

function resetForm() {
  user.value = { name: "", email: "", role: "", password: "", description: "" };
}
</script>

<style scoped>
/* ===== Fade nền ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* ===== Slide xuống mượt ===== */
.slide-down-enter-active {
  animation: slideDownIn 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-down-leave-active {
  animation: slideDownOut 0.45s cubic-bezier(0.55, 0, 0.55, 0.2) forwards;
}

@keyframes slideDownIn {
  0% {
    opacity: 0;
    transform: translateY(-80px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDownOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px);
  }
}
</style>

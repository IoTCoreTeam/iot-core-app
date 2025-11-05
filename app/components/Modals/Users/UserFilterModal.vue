<template>
  <transition name="fade-bg">
    <div
      v-if="isOpen"
      class="fixed inset-0 flex justify-center z-50 px-4 pt-12"
    >
      <!-- Nền mờ -->
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>

      <!-- Form thả nhẹ xuống -->
      <transition name="drop-soft" appear>
        <div
          class="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-gray-200 py-4 z-10 h-fit"
        >
          <!-- Header -->
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-semibold text-gray-800">Filter Users</h3>
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
          <form @submit.prevent="applyFilter" class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Keyword</label
              >
              <input
                v-model="filters.keyword"
                type="text"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search name, email, or role"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Role</label
              >
              <select
                v-model="filters.role"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
                <option value="Guest">Guest</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Status</label
              >
              <select
                v-model="filters.status"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <!-- Buttons -->
            <div class="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                @click="resetFilter"
                class="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-600 bg-white hover:bg-gray-100"
              >
                Reset
              </button>
              <button
                type="submit"
                class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
              >
                Apply
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

const emit = defineEmits(["close", "apply"]);
const isOpen = ref(true);

const filters = ref({
  keyword: "",
  role: "",
  status: "",
});

function closeModal() {
  isOpen.value = false;
  setTimeout(() => emit("close"), 400);
}

function resetFilter() {
  filters.value = { keyword: "", role: "", status: "" };
  emit("apply", { ...filters.value });
}

function applyFilter() {
  emit("apply", { ...filters.value });
}
</script>

<style scoped>
/* ===== Nền mờ fade nhẹ ===== */
.fade-bg-enter-active,
.fade-bg-leave-active {
  transition: opacity 0.45s ease;
}
.fade-bg-enter-from,
.fade-bg-leave-to {
  opacity: 0;
}
.fade-bg-enter-to,
.fade-bg-leave-from {
  opacity: 1;
}

/* ===== Hiệu ứng form rơi nhẹ ===== */
.drop-soft-enter-active {
  animation: softDropIn 0.75s cubic-bezier(0.25, 1, 0.5, 1);
}
.drop-soft-leave-active {
  animation: softDropOut 0.45s ease-in forwards;
}

/* Mở modal: thả nhẹ từ trên xuống — không nhún */
@keyframes softDropIn {
  0% {
    opacity: 0;
    transform: translateY(-100px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Đóng modal: bay nhẹ lên và mờ dần */
@keyframes softDropOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.97);
  }
}
</style>

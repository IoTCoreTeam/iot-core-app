<template>
  <div class="max-w-7xl mx-auto px-0 py-8 h-[90vh]">
    <div
      class="bg-white shadow-sm rounded border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-sm relative w-full text-xs"
    >
      <!-- Header Section -->
      <div class="bg-gray-50 px-2 py-1 border-b border-gray-200">
        <div class="flex justify-between items-center gap-3">
          <h3 class="font-medium text-gray-700">
            {{ title || "User Management" }}
          </h3>

          <!-- Search + Actions -->
          <div class="flex items-center gap-2">
            <!-- Search box -->
            <div class="relative">
              <input
                v-model="filterKeyword"
                type="text"
                placeholder="Search user..."
                class="pl-5 pr-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-52 text-xs cursor-text"
              />
              <svg
                class="absolute left-1 top-1.5 h-3 w-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7
                   7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <!-- Filter button -->
            <button
              @click="applyFilter"
              class="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs border border-gray-300"
            >
              <svg
                class="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v5.172a1 1 0 01-.553.894l-2.894 1.447A1 1 0 019 20v-6.172a1 1 0 00-.293-.707L2.293 6.707A1 1 0 012 6V4z"
                />
              </svg>
              Filter
            </button>

            <!-- Reset button -->
            <button
              @click="resetFilter"
              class="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs border border-gray-300"
            >
              <svg
                class="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582M20 20v-5h-.581M5.418 9A7.963 7.963 0 0112 4c2.21 0 4.21.896 5.582 2.418M18.582 15A7.963 7.963 0 0112 20a7.963 7.963 0 01-5.582-2.418"
                />
              </svg>
              Reset
            </button>

            <!-- Add new -->
            <button
              @click="emit('add-click')"
              class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
            >
              <svg
                class="w-3 h-3 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6
                   0H6"
                />
              </svg>
              New User
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="overflow-x-auto w-full">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                ID
              </th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Email
              </th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Name
              </th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Role
              </th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Status
              </th>
              <th class="px-2 py-2 text-center font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <div class="flex flex-col items-center">
                  <svg
                    class="animate-spin h-5 w-5 text-blue-500 mb-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0
                       0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>

            <!-- Data -->
            <tr
              v-else
              v-for="(user, idx) in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-2 py-1">{{ idx + 1 }}</td>
              <td class="px-2 py-1">{{ user.email }}</td>
              <td class="px-2 py-1">{{ user.fullName }}</td>
              <td class="px-2 py-1">{{ user.role }}</td>
              <td class="px-2 py-1">
                <span :class="user.active ? 'text-green-700' : 'text-gray-400'">
                  {{ user.active ? "Active" : "Inactive" }}
                </span>
              </td>
              <td class="px-2 py-1 text-right">
                <div class="inline-flex items-center gap-2">
                  <!-- Edit -->
                  <button
                    @click.stop="editUser(user)"
                    class="p-1 rounded hover:bg-gray-100"
                    title="Sửa"
                  >
                    <svg
                      class="w-4 h-4 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M11 5h6M7 11l10-10 4 4L11 15H7v-4z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M3 21v-4a2 2 0 012-2h4"
                      />
                    </svg>
                  </button>

                  <!-- Delete -->
                  <button
                    @click.stop="deleteUser(user)"
                    class="p-1 rounded hover:bg-gray-100"
                    title="Xóa"
                  >
                    <svg
                      class="w-4 h-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-if="!loading && filteredUsers.length === 0">
              <td colspan="6" class="py-6 text-center text-gray-400">
                No users found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
}

const props = defineProps({
  title: { type: String, default: "" },
  data: { type: Array as () => User[], default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["add-click", "edit", "delete", "filter"]);

const filterKeyword = ref("");
const appliedKeyword = ref("");

const filteredUsers = computed(() => {
  const q = appliedKeyword.value.toLowerCase().trim();
  if (!q) return props.data;
  return props.data.filter(
    (u) =>
      u.email.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
  );
});

function applyFilter() {
  appliedKeyword.value = filterKeyword.value;
  emit("filter", appliedKeyword.value);
}

function resetFilter() {
  filterKeyword.value = "";
  appliedKeyword.value = "";
  emit("filter", "");
}

function editUser(user: User) {
  emit("edit", user);
}

function deleteUser(user: User) {
  if (confirm(`Xóa người dùng ${user.fullName}?`)) {
    emit("delete", user);
  }
}
</script>

<style scoped>
button {
  cursor: pointer;
}
</style>

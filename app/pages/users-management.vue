<template>
  <div class="max-w-7xl mx-auto px-0 py-5 min-h-[80vh]">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <!-- Filter Button -->
            <button
              @click="openFilterModal"
              class="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs border border-gray-300"
            >
              Filter
            </button>

            <button
              @click="resetFilter"
              class="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs border border-gray-300"
            >
              Reset
            </button>

            <button
              @click="openAddModal"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
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
              <th class="px-2 py-2 text-left font-medium text-gray-600">#</th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Name
              </th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Email
              </th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Role
              </th>
              <th class="px-2 py-2 text-left font-medium text-gray-600">
                Created At
              </th>
              <th class="px-2 py-2 text-center font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="isAnimating">
              <td colspan="6" class="text-center py-12">
                <LoadingState message="Loading data..." />
              </td>
            </tr>

            <tr
              v-else
              v-for="(user, idx) in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-2 py-1">{{ idx + 1 }}</td>
              <td class="px-2 py-1">{{ user.name }}</td>
              <td class="px-2 py-1">{{ user.email }}</td>
              <td class="px-2 py-1">{{ user.role }}</td>
              <td class="px-2 py-1 text-gray-600">
                {{ formatCreatedAt(user.createdAt) }}
              </td>
              <td class="px-2 py-1 text-center align-middle">
                <div class="inline-flex items-center gap-2">
                  <button
                    @click="editUser(user)"
                    class="p-1 rounded hover:bg-gray-100 text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    @click="confirmDelete(user)"
                    class="p-1 rounded hover:bg-gray-100 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!isAnimating && filteredUsers.length === 0">
              <td colspan="6" class="py-6 text-center text-gray-400">
                No users found.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div
          v-if="pagination"
          class="px-2 py-1 border-t border-gray-200 bg-gray-50 flex items-center justify-between"
        >
          <div class="text-gray-500 text-xs">
            {{ pagination.page }}/{{ pagination.lastPage }} ·
            {{ pagination.total }} items
          </div>
          <div class="flex items-center gap-1">
            <select
              class="border border-gray-300 rounded py-0.5 px-0.5 bg-white text-xs"
              v-model="pagination.perPage"
              @change="changePerPage"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>

            <button
              class="px-1 py-0.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs"
              :disabled="pagination.page <= 1"
              @click="prevPage"
            >
              ←
            </button>

            <button
              class="px-1 py-0.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-xs"
              :disabled="pagination.page >= pagination.lastPage"
              @click="nextPage"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddUserModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @save="handleAddUser"
    />
    <UserFilterModal
      v-if="showFilterModal"
      @close="showFilterModal = false"
      @apply="handleApplyFilter"
    />
    <UserDetailModal
      v-if="showDetailModal && activeUserId"
      :user-id="activeUserId"
      @close="handleDetailClose"
      @updated="handleDetailUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { message, Modal } from "ant-design-vue";
import AddUserModal from "../components/Modals/Users/AddUserModal.vue";
import UserFilterModal from "../components/Modals/Users/UserFilterModal.vue";
import UserDetailModal from "../components/Modals/Users/UserDetailModal.vue";
import LoadingState from "@/components/common/LoadingState.vue";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string;
  description?: string;
  active: boolean;
  createdAt?: string;
}

const props = defineProps({
  title: { type: String, default: "" },
  data: { type: Array as () => User[], default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["add", "edit", "delete", "filter"]);

// --- State ---
const filterKeyword = ref("");
const appliedKeyword = ref("");
const users = ref<User[]>([]);
const isAnimating = ref(true);
const showAddModal = ref(false);
const showFilterModal = ref(false);
const showDetailModal = ref(false);
const activeUserId = ref<number | null>(null);

const pagination = ref({
  page: 1,
  perPage: 10,
  lastPage: 1,
  total: 0,
});

const mapUser = (user: any): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  password: user.password,
  description: user.description,
  active: Boolean(user.active),
  createdAt: user.created_at ?? user.createdAt ?? "",
});

// --- Computed ---
const filteredUsers = computed<User[]>(() => {
  const q = appliedKeyword.value.toLowerCase().trim();
  if (!q) return users.value;
  return users.value.filter(
    (u) =>
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
  );
});

// --- Methods ---
function resetFilter() {
  filterKeyword.value = "";
  appliedKeyword.value = "";
  emit("filter", "");
  message.info("Filters reset");
}

function formatCreatedAt(date?: string) {
  if (!date) return "--";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString();
}

function editUser(user: User) {
  activeUserId.value = user.id;
  showDetailModal.value = true;
}

function openAddModal() {
  showAddModal.value = true;
}

function openFilterModal() {
  showFilterModal.value = true;
}

function handleDetailClose() {
  showDetailModal.value = false;
  activeUserId.value = null;
}

function handleDetailUpdated() {
  fetchUserData();
}

function handleAddUser(user: User) {
  emit("add", {
    ...user,
    id: Date.now(),
    active: true,
    createdAt: new Date().toISOString(),
  });
}

function handleApplyFilter(filters: {
  keyword: string;
  role: string;
  status: string;
}) {
  emit("filter", filters);
  appliedKeyword.value = filters.keyword;
  message.info("Filter applied");
  showFilterModal.value = false;
}

// --- API ---
async function fetchUserData() {
  try {
    isAnimating.value = true;
    const token = localStorage.getItem("access_token");

    const queryParams = new URLSearchParams({
      page: String(pagination.value.page),
      per_page: String(pagination.value.perPage),
    });

    const keyword = filterKeyword.value.trim();
    if (keyword) {
      queryParams.append("search", keyword);
    }

    const res = await fetch(`http://127.0.0.1:8000/api/users?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      throw new Error(
        data?.message ?? `Unable to load users (${res.status}).`
      );
    }

    const userList = Array.isArray(data?.data) ? data.data : [];
    users.value = userList.map(mapUser);

    pagination.value.lastPage = data.last_page ?? pagination.value.lastPage;
    pagination.value.total = data.total ?? pagination.value.total;
    pagination.value.perPage = data.per_page ?? pagination.value.perPage;
    await nextTick();
  } catch (error) {
    const messageText = (error as Error)?.message ?? "Unable to load users.";
    message.error(messageText);
  } finally {
    isAnimating.value = false;
  }
}

// --- Pagination ---
function prevPage() {
  if (pagination.value.page > 1) {
    pagination.value.page--;
    fetchUserData();
  }
}

function nextPage() {
  if (pagination.value.page < pagination.value.lastPage) {
    pagination.value.page++;
    fetchUserData();
  }
}

function changePerPage() {
  pagination.value.page = 1;
  fetchUserData();
}

// --- Watch ---
let searchDebounce: ReturnType<typeof setTimeout> | null = null;
watch(filterKeyword, () => {
  if (searchDebounce) {
    clearTimeout(searchDebounce);
  }
  pagination.value.page = 1;
  searchDebounce = setTimeout(() => {
    fetchUserData();
  }, 400);
});

onMounted(() => {
  fetchUserData();
});

function confirmDelete(user: User) {
  Modal.confirm({
    title: "Delete User",
    content: `Are you sure you want to delete ${user.name}?`,
    okText: "Delete",
    okType: "danger",
    cancelText: "Cancel",
    centered: true,
    onOk: () => deleteUser(user.id),
  });
}

// --- Delete ---
async function deleteUser(id: number) {
  try {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      const errorMessage =
        data?.message ?? "Failed to delete user!";
      throw new Error(errorMessage);
    }

    message.success(data?.message ?? "User deleted successfully!");
    fetchUserData();
  } catch (error: any) {
    const messageText =
      typeof error?.message === "string" && error.message.trim().length > 0
        ? error.message.trim()
        : "An error occurred while deleting the user!";
    message.error(messageText);
  }
}
</script>

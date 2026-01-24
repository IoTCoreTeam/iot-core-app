<template>
  <div class="max-w-8xl mx-auto min-h-[80vh] p-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div
        :class="[
          'bg-white rounded border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-sm w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
          { hidden: !isFilterVisible },
        ]"
      >
        <div class="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
          <p class="text-xs text-gray-500">Refine the user results.</p>
        </div>
        <AdvancedFilterPanel
          :model-value="userFilterDraft"
          :fields="userFilterFields"
          :is-loading="isAnimating"
          apply-label="Apply"
          reset-label="Reset"
          @update:modelValue="handleUserFilterModelUpdate"
          @apply="handleApplyFilter"
          @reset="handleUserFilterReset"
        />
      </div>

      <DataBoxCard
        :class="[
          'relative w-full text-xs lg:self-start',
          isFilterVisible ? 'flex-1' : 'max-w-7xl w-full mx-auto',
        ]"
        :is-loading="isAnimating"
        :pagination="pagination"
        :has-data="filteredUsers.length > 0"
        :columns="6"
        @prev-page="prevPage"
        @next-page="nextPage"
        @change-per-page="changePerPage"
      >
        <template #header>
          <div
            class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between w-full"
          >
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-gray-700">
                {{ title || "User Management" }}
              </h3>
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-0.5"
                @click="toggleFilters"
              >
                {{ isFilterVisible ? "Hide Filters" : "Show Filters" }}
              </button>
            </div>

            <div class="flex items-center gap-2">
              <div class="relative">
                <input
                  v-model="filterKeyword"
                  type="text"
                  placeholder="Search user..."
                  class="pl-5 pr-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-52 text-xs cursor-text"
                />
                <BootstrapIcon
                  name="search"
                  class="absolute left-1 top-1.5 h-3 w-3 text-gray-400"
                />
              </div>

              <button
                @click="resetFilter"
                :disabled="isResetting"
                class="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs border border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <BootstrapIcon
                  name="arrow-clockwise"
                  class="w-3 h-3 mr-1"
                  :class="{ 'animate-spin': isResetting }"
                />
                {{ isResetting ? "Resetting..." : "Reset" }}
              </button>
              <button
                @click="exportToExcel"
                class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
              >
                <BootstrapIcon
                  name="file-earmark-arrow-down"
                  class="w-3 h-3 mr-1"
                />
                Export
              </button>

              <button
                @click="openAddModal"
                class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
              >
                <BootstrapIcon name="person-plus" class="w-3 h-3 mr-1" />
                New User
              </button>
            </div>
          </div>
        </template>

        <template #head>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="px-2 py-2 text-left font-medium text-gray-600">ID</th>
            <th class="px-2 py-2 text-left font-medium text-gray-600">Name</th>
            <th class="px-2 py-2 text-left font-medium text-gray-600">Email</th>
            <th class="px-2 py-2 text-left font-medium text-gray-600">Role</th>
            <th class="px-2 py-2 text-left font-medium text-gray-600">
              Created At
            </th>
            <th class="px-2 py-2 text-center font-medium text-gray-600">
              Actions
            </th>
          </tr>
        </template>

        <template #default>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-2 py-1">{{ user.id }}</td>
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
        </template>

        <template #empty> No users found. </template>
      </DataBoxCard>
    </div>

    <!-- Modals -->
    <AddUserModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @save="handleAddUser"
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
import UserDetailModal from "../components/Modals/Users/UserDetailModal.vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

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

interface UserFilters {
  keyword: string;
  role: string;
  start: string;
  end: string;
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
const isResetting = ref(false);
const showAddModal = ref(false);
const showDetailModal = ref(false);
const activeUserId = ref<number | null>(null);
const activeFilters = ref<UserFilters | null>(null);
const isFilterVisible = ref(true);

const pagination = ref({
  page: 1,
  perPage: 20,
  lastPage: 1,
  total: 0,
});
const authStore = useAuthStore();

const defaultFilters: UserFilters = {
  keyword: "",
  role: "",
  start: "",
  end: "",
};

const userFilterDraft = ref<UserFilters>({ ...defaultFilters });

const userFilterFields: FilterFieldRow[] = [
  [
    {
      key: "keyword",
      label: "Keyword",
      type: "text",
      placeholder: "Search name, email, or description",
    },
  ],
  [
    {
      key: "role",
      label: "Role",
      type: "select",
      options: [
        { label: "All", value: "" },
        { label: "Admin", value: "Admin" },
        { label: "User", value: "User" },
        { label: "Guest", value: "Guest" },
      ],
    },
  ],
  [
    { key: "start", label: "Start", type: "datetime-local" },
    { key: "end", label: "End", type: "datetime-local" },
  ],
];

const normalizeFilters = (payload: Partial<UserFilters> = {}): UserFilters => ({
  ...defaultFilters,
  ...payload,
});

const hasFilterValue = (
  payload: UserFilters | null,
): payload is UserFilters => {
  if (!payload) {
    return false;
  }

  return (
    payload.keyword.trim().length > 0 ||
    payload.role.trim().length > 0 ||
    payload.start.trim().length > 0 ||
    payload.end.trim().length > 0
  );
};

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
      u.role.toLowerCase().includes(q),
  );
});

// --- Methods ---
async function resetFilter() {
  if (isResetting.value) return;
  filterKeyword.value = "";
  appliedKeyword.value = "";
  activeFilters.value = null;
  pagination.value.page = 1;
  emit("filter", "");
  isResetting.value = true;
  try {
    await fetchUserData();
  } finally {
    isResetting.value = false;
  }
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

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
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

function handleApplyFilter(filters?: Record<string, string>) {
  const normalized = normalizeFilters(
    (filters as Partial<UserFilters> | undefined) ?? userFilterDraft.value,
  );
  const hasValues = hasFilterValue(normalized);

  userFilterDraft.value = { ...normalized };
  activeFilters.value = hasValues ? normalized : null;
  appliedKeyword.value = normalized.keyword;
  pagination.value.page = 1;

  emit("filter", normalized);
  fetchUserData();

  message.info(hasValues ? "Filter applied" : "Filters cleared");
}

function handleUserFilterModelUpdate(value: Record<string, string>) {
  userFilterDraft.value = {
    ...userFilterDraft.value,
    ...value,
  };
}

function handleUserFilterReset() {
  userFilterDraft.value = normalizeFilters();
  handleApplyFilter(userFilterDraft.value);
}

function exportToExcel() {
  if (!import.meta.client) return;

  const data = filteredUsers.value;
  if (!data.length) {
    message.warning("No users to export.");
    return;
  }

  const headers = ["ID", "Name", "Email", "Role", "Created At"];
  const escapeValue = (value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined) {
      return '""';
    }
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeValue).join(","),
    ...data.map((user) =>
      [
        user.id,
        user.name,
        user.email,
        user.role,
        formatCreatedAt(user.createdAt),
      ]
        .map(escapeValue)
        .join(","),
    ),
  ];

  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().split("T")[0];
  link.href = url;
  link.setAttribute("download", `users-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  message.success("Export completed.");
}

// --- API ---
const getAuthHeaders = () => {
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    throw new Error("Missing access token. Please sign in again.");
  }
  return {
    Authorization: authorization,
  };
};

async function fetchUserData(options: { showLoader?: boolean } = {}) {
  const { showLoader = true } = options;
  try {
    if (showLoader) {
      isAnimating.value = true;
    }
    const authHeaders = getAuthHeaders();

    const queryParams = new URLSearchParams({
      page: String(pagination.value.page),
      per_page: String(pagination.value.perPage),
    });

    const headers = {
      "Content-Type": "application/json",
      ...authHeaders,
    };

    const hasFilters = hasFilterValue(activeFilters.value);
    let res: Response;

    if (hasFilters) {
      const payload = normalizeFilters(activeFilters.value ?? {});
      const keywordOverride = filterKeyword.value.trim();
      if (keywordOverride) {
        payload.keyword = keywordOverride;
      }

      res = await fetch(`${apiConfig.auth}/users/filter?${queryParams}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ filters: payload }),
      });
    } else {
      const keyword = filterKeyword.value.trim();
      if (keyword) {
        queryParams.append("search", keyword);
      }

      res = await fetch(`${apiConfig.auth}/users?${queryParams}`, {
        method: "GET",
        headers,
      });
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      throw new Error(data?.message ?? `Unable to load users (${res.status}).`);
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
    if (showLoader) {
      isAnimating.value = false;
    }
  }
}

// --- Pagination ---
function prevPage() {
  if (pagination.value.page > 1) {
    pagination.value.page--;
    fetchUserData({ showLoader: false });
  }
}

function nextPage() {
  if (pagination.value.page < pagination.value.lastPage) {
    pagination.value.page++;
    fetchUserData({ showLoader: false });
  }
}

function changePerPage(value: number) {
  pagination.value.perPage = value;
  pagination.value.page = 1;
  fetchUserData({ showLoader: false });
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
    const authHeaders = getAuthHeaders();
    const res = await fetch(`${apiConfig.auth}/users/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      const errorMessage = data?.message ?? "Failed to delete user!";
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

<template>
  <div class="max-w-7xl mx-auto px-0 py-5 h-[90vh]">
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
                Status
              </th>
              <th class="px-2 py-2 text-center font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">Loading...</td>
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
              <td class="px-2 py-1">
                <span :class="user.active ? 'text-green-700' : 'text-gray-400'">
                  {{ user.active ? "Active" : "Inactive" }}
                </span>
              </td>
              <td class="px-2 py-1 text-right">
                <div class="inline-flex items-center gap-2">
                  <button
                    @click="editUser(user)"
                    class="p-1 rounded hover:bg-gray-100 text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteUser(user)"
                    class="p-1 rounded hover:bg-gray-100 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && filteredUsers.length === 0">
              <td colspan="6" class="py-6 text-center text-gray-400">
                No users found.
              </td>
            </tr>
          </tbody>
        </table>
        <!-- phan trang -->
        <div
          class="pagination w-full flex justify-center items-center gap-4 mt-6"
        >
          <button
            @click="prevPage"
            :disabled="page === 1"
            class="px-4 py-2 rounded-lg font-semibold text-white bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
          >
            ⬅ Trước
          </button>

          <span
            class="text-lg font-medium text-gray-700 transition-all duration-300"
            :class="{ 'scale-110 text-blue-600': isAnimating }"
          >
            Trang {{ page }} / {{ totalPages }}
          </span>

          <button
            @click="nextPage"
            :disabled="page === totalPages"
            class="px-4 py-2 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
          >
            Sau ➡
          </button>
        </div>
      </div>
    </div>

    <!-- AddUserModal -->
    <AddUserModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @save="handleAddUser"
    />

    <!-- UserFilterModal -->
    <UserFilterModal
      v-if="showFilterModal"
      @close="showFilterModal = false"
      @apply="handleApplyFilter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import AddUserModal from "../components/Modals/Users/AddUserModal.vue";
import UserFilterModal from "../components/Modals/Users/UserFilterModal.vue";

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
  password?: string;
  description?: string;
  active?: boolean;
}

const props = defineProps({
  title: { type: String, default: "" },
  data: { type: Array as () => User[], default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["add", "edit", "delete", "filter"]);
// hien thi du lieu
const filterKeyword = ref("");
const appliedKeyword = ref("");
const users = ref([]);
const filteredUsers = computed(() => {
  const q = appliedKeyword.value.toLowerCase().trim();
  if (!q) return users.value;
  return users.value.filter(
    (u) =>
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
  );
});
onMounted(async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/users");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    console.log("API trả về:", result);

    users.value = result.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    }));
  } catch (error) {
    console.error("Lỗi fetch user:", error);
  }
});

function resetFilter() {
  filterKeyword.value = "";
  appliedKeyword.value = "";
  emit("filter", "");
  message.info("Filters reset");
}

function deleteUser(user: User) {
  if (confirm(`Delete user ${user.name}?`)) {
    emit("delete", user);
    message.success("User deleted");
  }
}

function editUser(user: User) {
  message.info(`Edit user: ${user.name}`);
}

// --- Modal control ---
const showAddModal = ref(false);
const showFilterModal = ref(false);

function openAddModal() {
  showAddModal.value = true;
}

function openFilterModal() {
  showFilterModal.value = true;
}

// --- Handlers ---
function handleAddUser(user: User) {
  emit("add", { ...user, id: Date.now(), active: true });
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

// --phan trang--
import { ref, onMounted } from "vue";

const userData = ref([]);
const page = ref(1);
const totalPages = ref(1);
const isAnimating = ref(false);

async function fetchUserData() {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/users?page=${page.value}`
    );
    const data = await res.json();

    userData.value = data.data;
    totalPages.value = data.last_page;

    console.log(`Trang hiện tại: ${page.value}/${totalPages.value}`);
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchUserData();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchUserData();
  }
}

onMounted(() => {
  fetchUserData();
});
</script>

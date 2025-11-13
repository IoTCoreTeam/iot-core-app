<template>
  <div class="max-w-7xl mx-auto px-0 py-5 min-h-[90vh]">
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

          <tbody>
            <tr v-if="isAnimating">
              <td colspan="6" class="text-center py-12">
                <div
                  class="flex flex-col items-center justify-center space-y-2"
                >
                  <div
                    class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
                  ></div>
                  <span class="text-sm text-gray-500">Loading data...</span>
                </div>
              </td>
            </tr>
            <!--  -->
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
              <td class="px-2 py-1 text-center align-middle">
                <div class="inline-flex items-center gap-2">
                  <button
                    @click="editUser(user)"
                    class="p-1 rounded hover:bg-gray-100 text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteUser(user.id)"
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

function resetFilter() {
  filterKeyword.value = "";
  appliedKeyword.value = "";
  emit("filter", "");
  message.info("Filters reset");
}

// function deleteUser(user: User) {
//   if (confirm(`Delete user ${user.name}?`)) {
//     emit("delete", user);
//     message.success("User deleted");
//   }
// }

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
import { ref, watch, onMounted, nextTick } from "vue";

const userData = ref([]);
const users = ref([]);

const isAnimating = ref(true);
const pagination = ref({
  page: 1,
  perPage: 10,
  lastPage: 1,
  total: 0,
});

async function fetchUserData() {
  try {
    isAnimating.value = true; // bật loading
    const token = localStorage.getItem("access_token");

    const res = await fetch(
      `http://127.0.0.1:8000/api/users?page=${pagination.value.page}&per_page=${pagination.value.perPage}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    // Gán dữ liệu user
    userData.value = data.data;
    users.value = data.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    }));

    pagination.value.lastPage = data.last_page;
    pagination.value.total = data.total;
    pagination.value.perPage = data.per_page ?? 10; // fallback nếu API không trả về
    console.log(
      `Trang hiện tại: ${pagination.value.page}/${pagination.value.lastPage}`
    );
    await nextTick();
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
  } finally {
    isAnimating.value = false; // ✅ tắt spinner sau khi xong hoàn toàn
  }
}
// search
watch(filterKeyword, (newVal) => {
  if (!newVal) {
    users.value = userData.value;
    return;
  }

  users.value = userData.value.filter(
    (user) =>
      user.name.toLowerCase().includes(newVal.toLowerCase()) ||
      user.email.toLowerCase().includes(newVal.toLowerCase()) ||
      user.role.toLowerCase().includes(newVal.toLowerCase())
  );
});

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

onMounted(() => {
  fetchUserData();
});

function changePerPage() {
  pagination.value.page = 1;
  fetchUserData();
}
// ----------------------------delete--------------------------------------
async function deleteUser(id) {
  try {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      message.success("Xóa người dùng thành công!");
      fetchUserData(); // cập nhật lại danh sách
    } else {
      message.error(data.message || "Xóa thất bại!");
    }
  } catch (error) {
    console.error("Lỗi xóa người dùng:", error);
    message.error("Đã xảy ra lỗi khi xóa!");
  }
}
</script>

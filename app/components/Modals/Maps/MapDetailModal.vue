<template>
  <transition name="modal-overlay" appear>
    <div v-if="isOpen" class="fixed inset-0 flex justify-center z-50 px-4 pt-12">
      <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>

      <transition name="modal-slide" appear>
        <div
          class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 border border-gray-200 py-4 z-10 h-fit"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-sm font-semibold text-gray-800">Map Details</h3>
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

          <form
            @submit.prevent="submitForm"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Map Name</label
              >
              <input
                v-model="mapForm.name"
                type="text"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Main floor"
                required
                maxlength="100"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Area</label
              >
              <select
                v-model="mapForm.area_id"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
                :disabled="isLoadingAreas"
              >
                <option value="" disabled>
                  {{ isLoadingAreas ? "Loading areas..." : "Select an area" }}
                </option>
                <option
                  v-for="area in areas"
                  :key="area.id"
                  :value="String(area.id)"
                >
                  {{ area.name }}
                </option>
              </select>
              <p v-if="areaLoadError" class="text-[11px] text-rose-600 mt-1">
                {{ areaLoadError }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Scale (m per px)</label
              >
              <input
                v-model="mapForm.scale_m_per_px"
                type="number"
                step="0.0001"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 0.01"
                min="0"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Description</label
              >
              <textarea
                v-model="mapForm.description"
                rows="4"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Short description for this map"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Width (px)</label
              >
              <input
                v-model="mapForm.width_px"
                type="number"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 1200"
                min="0"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1"
                >Height (px)</label
              >
              <input
                v-model="mapForm.height_px"
                type="number"
                class="w-full px-2 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 800"
                min="0"
              />
            </div>

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
                {{ isSubmitting ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

type MapDetail = {
  id: number;
  name?: string | null;
  area_id?: number | null;
  description?: string | null;
  width_px?: number | null;
  height_px?: number | null;
  scale_m_per_px?: number | null;
  image_url?: string | null;
};

const props = defineProps<{
  map: MapDetail | null;
}>();

const emit = defineEmits(["close", "save"]);

const isOpen = ref(true);
const isSubmitting = ref(false);
const isLoadingAreas = ref(false);
const areaLoadError = ref("");
const areas = ref<Array<{ id: number; name: string }>>([]);

const authStore = useAuthStore();
const mapModuleBase = `${(apiConfig.controlModule || "").replace(/\/$/, "")}/map-module`;

const mapForm = ref({
  area_id: "",
  name: "",
  image_url: "",
  width_px: "",
  height_px: "",
  scale_m_per_px: "",
  description: "",
});

function normalizeDetailMap(input?: MapDetail | null) {
  return {
    area_id: input?.area_id ? String(input.area_id) : "",
    name: input?.name ?? "",
    image_url: input?.image_url ?? "",
    width_px: input?.width_px ? String(input.width_px) : "",
    height_px: input?.height_px ? String(input.height_px) : "",
    scale_m_per_px: input?.scale_m_per_px ? String(input.scale_m_per_px) : "",
    description: input?.description ?? "",
  };
}

function buildHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const authorization = authStore.authorizationHeader;
  if (authorization) {
    headers.Authorization = authorization;
  }
  return headers;
}

async function fetchAreas() {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    areaLoadError.value = "API base URL is not configured.";
    return;
  }
  isLoadingAreas.value = true;
  areaLoadError.value = "";
  try {
    const response = await fetch(`${mapModuleBase}/areas`, {
      headers: buildHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message ?? `Failed to load areas (${response.status}).`);
    }
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    areas.value = rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name ?? `Area ${row.id}`,
    }));
  } catch (error: any) {
    areaLoadError.value = error?.message ?? "Failed to load areas.";
  } finally {
    isLoadingAreas.value = false;
  }
}

function closeModal(event: MouseEvent): void;
function closeModal(force: boolean): void;
function closeModal(arg?: MouseEvent | boolean) {
  const force = typeof arg === "boolean" ? arg : false;
  if (!force && isSubmitting.value) return;

  isOpen.value = false;
  setTimeout(() => emit("close"), 400);
}

function submitForm() {
  if (!props.map?.id) {
    message.error("Map ID is missing.");
    return;
  }
  if (!mapForm.value.area_id || !mapForm.value.name) {
    message.warning("Please fill in the required fields.");
    return;
  }

  isSubmitting.value = true;
  emit("save", { ...mapForm.value, id: props.map.id });
  closeModal(true);
  isSubmitting.value = false;
}

onMounted(() => {
  fetchAreas();
  mapForm.value = normalizeDetailMap(props.map);
});

watch(
  () => props.map,
  (value) => {
    mapForm.value = normalizeDetailMap(value);
  },
  { deep: true }
);
</script>

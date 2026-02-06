<template>
  <section class="min-h-screen">
    <a-tabs
      v-model:activeKey="activeTab"
      class="px-4 custom-tabs text-xs"
    >
      <a-tab-pane key="map" tab="Map">
        <div v-if="activeTab === 'map'" class="pb-2">
          <Transition name="slide-left" mode="out-in">
            <MapConfig
              v-if="isMapConfigOpen"
              :map="selectedMap"
              @back="closeMapConfig"
            />
            <div v-else class="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div
                :class="[
                  'bg-white rounded border border-slate-200 overflow-hidden w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
                  { hidden: !isFilterVisible },
                ]"
              >
                <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
                    <p class="text-xs text-gray-500">
                      Refine the {{ activeTitle.toLowerCase() }} list.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="text-xs text-gray-500 hover:text-gray-700 lg:hidden"
                    @click="toggleFilters"
                  >
                    Close
                  </button>
                </div>
                <AdvancedFilterPanel
                  :fields="activeFilterFields"
                  :model-value="activeFilters"
                  :is-loading="isLoading"
                  apply-label="Apply"
                  reset-label="Reset"
                  @update:modelValue="handleFilterModelUpdate"
                  @apply="applyFilters"
                  @reset="resetFilters"
                />
              </div>

              <DataBoxCard
                :class="[
                  'lg:self-start',
                  isFilterVisible ? 'flex-1' : 'max-w-8xl w-full mx-auto',
                ]"
                :is-loading="isMapLoading"
                :columns="mapTableColumns.length"
                :has-data="displayedMapRows.length > 0"
                :pagination="mapPagination"
                :loading-text="activeLoadingText"
                @prev-page="prevMapPage"
                @next-page="nextMapPage"
                @change-per-page="changeMapPerPage"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <h3 class="text-gray-700 text-xs">
                      {{ activeTitle }}
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
                        v-model="searchKeyword"
                        type="text"
                        :placeholder="activeSearchPlaceholder"
                        class="pl-5 pr-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-52 text-xs cursor-text"
                      />
                      <BootstrapIcon
                        name="search"
                        class="absolute left-1 top-1.5 w-3 h-3 text-gray-400"
                      />
                    </div>
                    <button
                      @click="refreshRows"
                      class="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs border border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      :disabled="isMapLoading"
                    >
                      <BootstrapIcon
                        name="arrow-clockwise"
                        class="w-3 h-3 mr-1"
                        :class="{ 'animate-spin': isMapLoading }"
                      />
                      {{ isMapLoading ? "Refreshing..." : "Refresh" }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                      @click="openAddModal"
                    >
                      <BootstrapIcon name="plus-lg" class="w-3 h-3 mr-1" />
                      {{ activeAddLabel }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                      :disabled="isMapLoading"
                      @click="exportRows"
                    >
                      <BootstrapIcon name="file-earmark-arrow-down" class="w-3 h-3 mr-1" />
                      Export
                    </button>
                  </div>
                </template>

                <template #head>
                  <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600 text-center">
                    <th
                      v-for="column in mapTableColumns"
                      :key="column"
                      class="px-2 py-2 font-normal text-gray-600 text-center align-middle leading-4"
                    >
                      {{ column }}
                    </th>
                  </tr>
                </template>

                <template #default>
                  <tr
                    v-for="row in displayedMapRows"
                    :key="row.id"
                    class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100 py-1 text-center"
                  >
                    <td class="px-2 py-2 text-gray-800 text-center align-middle leading-4">
                      <div>{{ row.id }}</div>
                    </td>
                    <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                      <div>
                        {{ row.name || "-" }}
                      </div>
                    </td>
                    <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                      <div>
                        {{ row.area?.name || row.area_name || "Unknown" }}
                      </div>
                    </td>
                    <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                      {{ row.description || "-" }}
                    </td>
                    <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                      {{ row.width_px ?? "-" }}
                    </td>
                    <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                      {{ row.height_px ?? "-" }}
                    </td>
                    <td class="px-2 py-2 text-center align-middle">
                      <div class="inline-flex items-center justify-center gap-2">
                        <button
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                          @click="openEditMap(row)"
                          title="Edit"
                          aria-label="Edit map"
                        >
                          <BootstrapIcon name="pencil-square" class="w-3 h-3" />
                          <span class="sr-only">Edit</span>
                        </button>
                        <button
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                          @click="confirmDeleteMap(row)"
                          title="Delete"
                          aria-label="Delete map"
                        >
                          <BootstrapIcon name="trash" class="w-3 h-3" />
                          <span class="sr-only">Delete</span>
                        </button>
                      </div>
                    </td>
                    <td class="px-2 py-2 text-center align-middle">
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        @click="openMapConfig(row)"
                        aria-label="Open map config"
                      >
                        <BootstrapIcon name="info-circle" class="w-3 h-3" />
                        <span class="sr-only">Config</span>
                      </button>
                    </td>
                  </tr>
                </template>

                <template #empty> {{ activeEmptyText }} </template>

                <template #footer>
                  <span>Showing {{ displayedMapRows.length }} entries on this page.</span>
                  <span>
                    Total filtered:
                    <span class="text-gray-600 font-medium">{{ mapPagination.total }}</span>
                  </span>
                </template>
              </DataBoxCard>
            </div>
          </Transition>
        </div>
      </a-tab-pane>
      <a-tab-pane key="area" tab="Area">
        <div v-if="activeTab === 'area'" class="pb-2">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div
              :class="[
                'bg-white rounded border border-slate-200 overflow-hidden w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
                { hidden: !isFilterVisible },
              ]"
            >
              <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
                  <p class="text-xs text-gray-500">
                    Refine the {{ activeTitle.toLowerCase() }} list.
                  </p>
                </div>
                <button
                  type="button"
                  class="text-xs text-gray-500 hover:text-gray-700 lg:hidden"
                  @click="toggleFilters"
                >
                  Close
                </button>
              </div>
              <AdvancedFilterPanel
                :fields="activeFilterFields"
                :model-value="activeFilters"
                :is-loading="isLoading"
                apply-label="Apply"
                reset-label="Reset"
                @update:modelValue="handleFilterModelUpdate"
                @apply="applyFilters"
                @reset="resetFilters"
              />
            </div>

            <DataBoxCard
              :class="[
                'lg:self-start',
                isFilterVisible ? 'flex-1' : 'max-w-8xl w-full mx-auto',
              ]"
              :is-loading="isAreaLoading"
              :columns="areaTableColumns.length"
              :has-data="displayedAreaRows.length > 0"
              :pagination="areaPagination"
              :loading-text="activeLoadingText"
              @prev-page="prevAreaPage"
              @next-page="nextAreaPage"
              @change-per-page="changeAreaPerPage"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <h3 class="text-gray-700 text-xs">
                    {{ activeTitle }}
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
                      v-model="searchKeyword"
                      type="text"
                      :placeholder="activeSearchPlaceholder"
                      class="pl-5 pr-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-52 text-xs cursor-text"
                    />
                      <BootstrapIcon
                        name="search"
                        class="absolute left-1 top-1.5 w-3 h-3 text-gray-400"
                      />
                  </div>
                  <button
                    @click="refreshRows"
                    class="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs border border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="isAreaLoading"
                  >
                    <BootstrapIcon
                      name="arrow-clockwise"
                      class="w-3 h-3 mr-1"
                      :class="{ 'animate-spin': isAreaLoading }"
                    />
                    {{ isAreaLoading ? "Refreshing..." : "Refresh" }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                    @click="openAddModal"
                  >
                    <BootstrapIcon name="plus-lg" class="w-3 h-3 mr-1" />
                    {{ activeAddLabel }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                    :disabled="isAreaLoading"
                    @click="exportRows"
                  >
                    <BootstrapIcon name="file-earmark-arrow-down" class="w-3 h-3 mr-1" />
                    Export
                  </button>
                </div>
              </template>

              <template #head>
                <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600 text-center">
                  <th
                    v-for="column in areaTableColumns"
                    :key="column"
                    class="px-2 py-2 font-normal text-gray-600 text-center align-middle leading-4"
                  >
                    {{ column }}
                  </th>
                </tr>
              </template>

              <template #default>
                <tr
                  v-for="row in displayedAreaRows"
                  :key="row.id"
                  class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100 py-1 text-center"
                >
                  <td class="px-2 py-2 text-gray-800 text-center align-middle leading-4">
                    <div>{{ row.id }}</div>
                  </td>
                  <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                    <div>{{ row.name }}</div>
                  </td>
                  <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                    {{ row.description || "-" }}
                  </td>
                  <td class="px-2 py-2 text-gray-700 text-center align-middle leading-4">
                    {{ row.height_m ?? "-" }}
                  </td>
                  <td class="px-2 py-2 text-gray-600 text-center align-middle leading-4">
                    {{ formatDateTime(row.created_at) }}
                  </td>
                  <td class="px-2 py-2 text-gray-600 text-center align-middle leading-4">
                    {{ formatDateTime(row.updated_at) }}
                  </td>
                  <td class="px-2 py-2">
                    <div class="inline-flex items-center justify-center gap-2">
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
                        @click="openEditArea(row)"
                        title="Edit"
                        aria-label="Edit area"
                      >
                        <BootstrapIcon name="pencil-square" class="w-3 h-3" />
                        <span class="sr-only">Edit</span>
                      </button>
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50"
                        @click="confirmDeleteArea(row)"
                        title="Delete"
                        aria-label="Delete area"
                      >
                        <BootstrapIcon name="trash" class="w-3 h-3" />
                        <span class="sr-only">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>

              <template #empty> {{ activeEmptyText }} </template>

              <template #footer>
                <span>Showing {{ displayedAreaRows.length }} entries on this page.</span>
                <span>
                  Total filtered:
                  <span class="text-gray-600 font-medium">{{ areaPagination.total }}</span>
                </span>
              </template>
            </DataBoxCard>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <AddMapModal
      v-if="isAddMapOpen"
      @close="closeAddMapModal"
      @save="handleMapSaved"
    />
    <MapDetailModal
      v-if="isMapDetailOpen"
      :map="editingMap"
      @close="closeMapDetailModal"
      @save="handleMapUpdated"
    />
    <AddAreaModal
      v-if="isAddAreaOpen"
      @close="closeAddAreaModal"
      @save="handleAreaSaved"
    />
    <AreaDetailModal
      v-if="isAreaDetailOpen"
      :area="editingArea"
      @close="closeAreaDetailModal"
      @save="handleAreaUpdated"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from "vue";
import { message, Modal } from "ant-design-vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import AddMapModal from "@/components/Modals/Maps/AddMapModal.vue";
import AddAreaModal from "@/components/Modals/Maps/AddAreaModal.vue";
import MapDetailModal from "@/components/Modals/Maps/MapDetailModal.vue";
import AreaDetailModal from "@/components/Modals/Maps/AreaDetailModal.vue";
import MapConfig from "@/components/devices-control/sections/map-section/MapConfig.vue";
import type { Section } from "@/types/devices-control";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

defineProps<{ section: Section }>();

const activeTab = ref<"map" | "area">("map");
const mapTableColumns = [
  "ID",
  "Name",
  "Area",
  "Description",
  "Width (px)",
  "Height (px)",
  "Actions",
  "Config",
];
const areaTableColumns = [
  "ID",
  "Name",
  "Description",
  "Height (m)",
  "Created At",
  "Updated At",
  "Actions",
];
const isFilterVisible = ref(true);
const searchKeyword = ref("");
const isAddMapOpen = ref(false);
const isAddAreaOpen = ref(false);
const isMapDetailOpen = ref(false);
const isAreaDetailOpen = ref(false);
const isSavingMap = ref(false);
const isSavingArea = ref(false);
const isMapLoading = ref(false);
const isAreaLoading = ref(false);
const editingMap = ref<MapRow | null>(null);
const editingArea = ref<AreaRow | null>(null);
const isMapConfigOpen = ref(false);
const selectedMap = ref<MapRow | null>(null);

const mapModuleBase = `${(apiConfig.controlModule || "").replace(/\/$/, "")}/map-module`;
const authStore = useAuthStore();

type MapRow = {
  id: number;
  name?: string | null;
  area_id?: number | null;
  description?: string | null;
  width_px?: number | null;
  height_px?: number | null;
  scale_m_per_px?: number | null;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  area?: { id?: number | null; name?: string | null } | null;
  area_name?: string | null;
};

type AreaRow = {
  id: number;
  name: string;
  description?: string | null;
  height_m?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MapFormPayload = {
  area_id: string;
  name: string;
  image_url: string;
  width_px: string;
  height_px: string;
  scale_m_per_px: string;
  description: string;
};

type AreaFormPayload = {
  name: string;
  description: string;
  height_m: string;
};

type MapUpdatePayload = MapFormPayload & { id?: number | null };
type AreaUpdatePayload = AreaFormPayload & { id?: number | null };

const mapDefaultFilters = {
  id: "",
  name: "",
  area_id: "",
  description: "",
  width_px: "",
  height_px: "",
};

const areaDefaultFilters = {
  id: "",
  name: "",
  description: "",
  height_m: "",
};

const mapFilters = reactive({ ...mapDefaultFilters });
const areaFilters = reactive({ ...areaDefaultFilters });
const appliedMapFilters = ref({ ...mapDefaultFilters });
const appliedAreaFilters = ref({ ...areaDefaultFilters });

const mapRows = ref<MapRow[]>([]);
const areaRows = ref<AreaRow[]>([]);
const mapPagination = ref({ page: 1, perPage: 10, lastPage: 1, total: 0 });
const areaPagination = ref({ page: 1, perPage: 10, lastPage: 1, total: 0 });

const activeFilters = computed(() =>
  activeTab.value === "map" ? mapFilters : areaFilters
);

const mapFilterFields: FilterFieldRow[] = [
  [
    {
      key: "id",
      label: "ID",
      type: "text",
      placeholder: "e.g. 10",
    },
  ],
  [
    {
      key: "name",
      label: "Name",
      type: "text",
      placeholder: "e.g. Main floor",
    },
  ],
  [
    {
      key: "area_id",
      label: "Area ID",
      type: "text",
      placeholder: "e.g. 1",
    },
  ],
  [
    {
      key: "description",
      label: "Description",
      type: "text",
      placeholder: "e.g. Factory hall map",
    },
  ],
  [
    {
      key: "width_px",
      label: "Width (px)",
      type: "text",
      placeholder: "e.g. 1200",
    },
  ],
  [
    {
      key: "height_px",
      label: "Height (px)",
      type: "text",
      placeholder: "e.g. 800",
    },
  ],
];

const areaFilterFields: FilterFieldRow[] = [
  [
    {
      key: "id",
      label: "ID",
      type: "text",
      placeholder: "e.g. 1",
    },
  ],
  [
    {
      key: "name",
      label: "Name",
      type: "text",
      placeholder: "e.g. Production Zone",
    },
  ],
  [
    {
      key: "description",
      label: "Description",
      type: "text",
      placeholder: "e.g. Main assembly area",
    },
  ],
  [
    {
      key: "height_m",
      label: "Height (m)",
      type: "text",
      placeholder: "e.g. 3.5",
    },
  ],
  [
  ],
];

const activeFilterFields = computed(() =>
  activeTab.value === "map" ? mapFilterFields : areaFilterFields
);
const activeTitle = computed(() =>
  activeTab.value === "map" ? "Maps" : "Areas"
);
const activeSearchPlaceholder = computed(() =>
  activeTab.value === "map" ? "Search map..." : "Search area..."
);
const activeEmptyText = computed(() =>
  activeTab.value === "map"
    ? "No maps to display yet."
    : "No areas to display yet."
);
const activeLoadingText = computed(() =>
  activeTab.value === "map" ? "Loading maps..." : "Loading areas..."
);
const activeAddLabel = computed(() =>
  activeTab.value === "map" ? "New Map" : "New Area"
);
const isLoading = computed(() =>
  activeTab.value === "map" ? isMapLoading.value : isAreaLoading.value
);
const displayedMapRows = computed(() => mapRows.value);
const displayedAreaRows = computed(() => areaRows.value);

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
}

function handleFilterModelUpdate(value: Record<string, string>) {
  Object.assign(activeFilters.value, value);
}

function applyFilters(payload?: Record<string, string>) {
  if (payload) {
    Object.assign(activeFilters.value, payload);
  }
  if (activeTab.value === "map") {
    appliedMapFilters.value = { ...mapFilters };
    mapPagination.value.page = 1;
    fetchMaps();
    return;
  }
  appliedAreaFilters.value = { ...areaFilters };
  areaPagination.value.page = 1;
  fetchAreas();
}

function resetFilters() {
  if (activeTab.value === "map") {
    Object.assign(mapFilters, mapDefaultFilters);
    appliedMapFilters.value = { ...mapDefaultFilters };
    mapPagination.value.page = 1;
    fetchMaps();
  } else {
    Object.assign(areaFilters, areaDefaultFilters);
    appliedAreaFilters.value = { ...areaDefaultFilters };
    areaPagination.value.page = 1;
    fetchAreas();
  }
}

function refreshRows() {
  if (isLoading.value) return;
  if (activeTab.value === "map") {
    fetchMaps();
    return;
  }
  fetchAreas();
}

function exportRows() {
  if (!import.meta.client) return;
  if (activeTab.value === "map") {
    exportMaps();
    return;
  }
  exportAreas();
}

function openAddMapModal() {
  isAddMapOpen.value = true;
}

function closeAddMapModal() {
  isAddMapOpen.value = false;
}

function openEditMap(row: MapRow) {
  editingMap.value = { ...row };
  isMapDetailOpen.value = true;
}

function openMapConfig(row: MapRow) {
  selectedMap.value = { ...row };
  isMapConfigOpen.value = true;
}

function closeMapConfig() {
  isMapConfigOpen.value = false;
  selectedMap.value = null;
}


function closeMapDetailModal() {
  isMapDetailOpen.value = false;
  editingMap.value = null;
}

function normalizeOptionalNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOptionalInt(value: string) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
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

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toString().trim();
}

function mapQueryParams() {
  const params = new URLSearchParams();
  params.set("page", String(mapPagination.value.page));
  params.set("per_page", String(mapPagination.value.perPage));
  const filters = appliedMapFilters.value;
  if (filters.id) params.set("id", normalizeText(filters.id));
  if (filters.name) params.set("name", normalizeText(filters.name));
  if (filters.area_id) params.set("area_id", normalizeText(filters.area_id));
  if (filters.description) params.set("description", normalizeText(filters.description));
  if (filters.width_px) params.set("width_px", normalizeText(filters.width_px));
  if (filters.height_px) params.set("height_px", normalizeText(filters.height_px));
  const keyword = normalizeText(searchKeyword.value);
  if (keyword) params.set("keyword", keyword);
  return params;
}

function areaQueryParams() {
  const params = new URLSearchParams();
  params.set("page", String(areaPagination.value.page));
  params.set("per_page", String(areaPagination.value.perPage));
  const filters = appliedAreaFilters.value;
  if (filters.id) params.set("id", normalizeText(filters.id));
  if (filters.name) params.set("name", normalizeText(filters.name));
  if (filters.description) params.set("description", normalizeText(filters.description));
  if (filters.height_m) params.set("height_m", normalizeText(filters.height_m));
  const keyword = normalizeText(searchKeyword.value);
  if (keyword) params.set("keyword", keyword);
  return params;
}

function normalizeMapRow(raw: MapRow): MapRow {
  return {
    ...raw,
    area_id: raw.area_id ?? raw.area?.id ?? null,
    area_name: raw.area?.name ?? raw.area_name ?? null,
  };
}

function applyPaginationFromResponse(
  pagination: { page: number; perPage: number; lastPage: number; total: number },
  payload: any
) {
  if (!payload) {
    pagination.total = pagination.total || 0;
    pagination.lastPage = Math.max(1, Math.ceil(pagination.total / pagination.perPage));
    return;
  }
  if (Array.isArray(payload)) {
    pagination.total = payload.length;
    pagination.page = 1;
    pagination.lastPage = 1;
    pagination.perPage = payload.length || pagination.perPage;
    return;
  }
  if (typeof payload !== "object") {
    return;
  }
  const currentPage = Number(payload.current_page ?? payload.meta?.current_page);
  const lastPage = Number(payload.last_page ?? payload.meta?.last_page);
  const perPage = Number(payload.per_page ?? payload.meta?.per_page);
  const total = Number(payload.total ?? payload.meta?.total);
  if (Number.isFinite(currentPage) && currentPage > 0) {
    pagination.page = currentPage;
  }
  if (Number.isFinite(perPage) && perPage > 0) {
    pagination.perPage = perPage;
  }
  if (Number.isFinite(lastPage) && lastPage > 0) {
    pagination.lastPage = lastPage;
  }
  if (Number.isFinite(total) && total >= 0) {
    pagination.total = total;
  }
}

async function fetchMaps() {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    return;
  }
  isMapLoading.value = true;
  try {
    const params = mapQueryParams();
    const response = await fetch(`${mapModuleBase}/maps?${params.toString()}`, {
      headers: buildHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message ?? `Failed to load maps (${response.status}).`);
    }
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    mapRows.value = rows.map((row: MapRow) => normalizeMapRow(row));
    applyPaginationFromResponse(mapPagination.value, data);
  } catch (error: any) {
    message.error(error?.message ?? "Failed to load maps.");
  } finally {
    isMapLoading.value = false;
  }
}

async function fetchAreas() {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    return;
  }
  isAreaLoading.value = true;
  try {
    const params = areaQueryParams();
    const response = await fetch(`${mapModuleBase}/areas?${params.toString()}`, {
      headers: buildHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message ?? `Failed to load areas (${response.status}).`);
    }
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    areaRows.value = rows;
    applyPaginationFromResponse(areaPagination.value, data);
  } catch (error: any) {
    message.error(error?.message ?? "Failed to load areas.");
  } finally {
    isAreaLoading.value = false;
  }
}

async function handleMapSaved(payload: MapFormPayload) {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    message.error("API base URL is not configured.");
    return;
  }
  if (isSavingMap.value) return;

  const areaId = Number.parseInt(payload.area_id, 10);
  if (!Number.isFinite(areaId) || areaId <= 0) {
    message.error("Area ID must be a valid number.");
    return;
  }

  isSavingMap.value = true;
  try {
    const response = await fetch(`${mapModuleBase}/maps`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        area_id: areaId,
        name: payload.name,
        image_url: payload.image_url || null,
        width_px: normalizeOptionalInt(payload.width_px),
        height_px: normalizeOptionalInt(payload.height_px),
        scale_m_per_px: normalizeOptionalNumber(payload.scale_m_per_px),
        description: payload.description || null,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationErrors = data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .at(0) as string | undefined;
        throw new Error(firstError ?? "Validation error. Please check the form.");
      }
      throw new Error(data?.message ?? `Failed to create map (${response.status}).`);
    }

    message.success("Map created successfully.");
    fetchMaps();
  } catch (error: any) {
    const errorMessage = error?.message ?? "Failed to create map.";
    message.error(errorMessage);
  } finally {
    isSavingMap.value = false;
  }
}

function openAddAreaModal() {
  isAddAreaOpen.value = true;
}

function closeAddAreaModal() {
  isAddAreaOpen.value = false;
}

function openEditArea(row: AreaRow) {
  editingArea.value = { ...row };
  isAreaDetailOpen.value = true;
}

function closeAreaDetailModal() {
  isAreaDetailOpen.value = false;
  editingArea.value = null;
}

async function handleAreaSaved(payload: AreaFormPayload) {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    message.error("API base URL is not configured.");
    return;
  }
  if (isSavingArea.value) return;

  isSavingArea.value = true;
  try {
    const response = await fetch(`${mapModuleBase}/areas`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        name: payload.name,
        description: payload.description || null,
        height_m: normalizeOptionalNumber(payload.height_m),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationErrors = data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .at(0) as string | undefined;
        throw new Error(firstError ?? "Validation error. Please check the form.");
      }
      throw new Error(data?.message ?? `Failed to create area (${response.status}).`);
    }

    message.success("Area created successfully.");
    fetchAreas();
  } catch (error: any) {
    const errorMessage = error?.message ?? "Failed to create area.";
    message.error(errorMessage);
  } finally {
    isSavingArea.value = false;
  }
}

async function handleMapUpdated(payload: MapUpdatePayload) {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    message.error("API base URL is not configured.");
    return;
  }
  if (isSavingMap.value) return;

  const mapId = payload.id;
  if (!mapId) {
    message.error("Map ID is missing.");
    return;
  }

  const areaId = Number.parseInt(payload.area_id, 10);
  if (!Number.isFinite(areaId) || areaId <= 0) {
    message.error("Area ID must be a valid number.");
    return;
  }

  isSavingMap.value = true;
  try {
    const response = await fetch(`${mapModuleBase}/maps/${mapId}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({
        name: payload.name || null,
        area_id: areaId,
        image_url: payload.image_url || null,
        width_px: normalizeOptionalInt(payload.width_px),
        height_px: normalizeOptionalInt(payload.height_px),
        scale_m_per_px: normalizeOptionalNumber(payload.scale_m_per_px),
        description: payload.description || null,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationErrors = data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .at(0) as string | undefined;
        throw new Error(firstError ?? "Validation error. Please check the form.");
      }
      throw new Error(data?.message ?? `Failed to update map (${response.status}).`);
    }

    message.success("Map updated successfully.");
    fetchMaps();
  } catch (error: any) {
    const errorMessage = error?.message ?? "Failed to update map.";
    message.error(errorMessage);
  } finally {
    isSavingMap.value = false;
  }
}

async function handleAreaUpdated(payload: AreaUpdatePayload) {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    message.error("API base URL is not configured.");
    return;
  }
  if (isSavingArea.value) return;

  const areaId = payload.id;
  if (!areaId) {
    message.error("Area ID is missing.");
    return;
  }

  isSavingArea.value = true;
  try {
    const response = await fetch(`${mapModuleBase}/areas/${areaId}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({
        name: payload.name,
        description: payload.description || null,
        height_m: normalizeOptionalNumber(payload.height_m),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationErrors = data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)
          .flat()
          .at(0) as string | undefined;
        throw new Error(firstError ?? "Validation error. Please check the form.");
      }
      throw new Error(data?.message ?? `Failed to update area (${response.status}).`);
    }

    message.success("Area updated successfully.");
    fetchAreas();
  } catch (error: any) {
    const errorMessage = error?.message ?? "Failed to update area.";
    message.error(errorMessage);
  } finally {
    isSavingArea.value = false;
  }
}

function prevMapPage() {
  if (mapPagination.value.page > 1) {
    mapPagination.value.page -= 1;
    fetchMaps();
  }
}

function nextMapPage() {
  if (mapPagination.value.page < mapPagination.value.lastPage) {
    mapPagination.value.page += 1;
    fetchMaps();
  }
}

function changeMapPerPage(value: number) {
  if (value <= 0) return;
  mapPagination.value.perPage = value;
  mapPagination.value.page = 1;
  fetchMaps();
}

function prevAreaPage() {
  if (areaPagination.value.page > 1) {
    areaPagination.value.page -= 1;
    fetchAreas();
  }
}

function nextAreaPage() {
  if (areaPagination.value.page < areaPagination.value.lastPage) {
    areaPagination.value.page += 1;
    fetchAreas();
  }
}

function changeAreaPerPage(value: number) {
  if (value <= 0) return;
  areaPagination.value.perPage = value;
  areaPagination.value.page = 1;
  fetchAreas();
}

function exportMaps() {
  const rows = mapRows.value;
  if (!rows.length) {
    message.warning("No maps to export.");
    return;
  }
  const headers = mapTableColumns.filter(
    (column) => column !== "Actions" && column !== "Config",
  );
  const escapeValue = (value: string | number | null | undefined) => {
    const str = (value ?? "").toString().replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvRows = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.name,
        row.area?.name || row.area_name || row.area_id,
        row.description,
        row.width_px,
        row.height_px,
      ]
        .map(escapeValue)
        .join(","),
    ),
  ];
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "maps.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function exportAreas() {
  const rows = areaRows.value;
  if (!rows.length) {
    message.warning("No areas to export.");
    return;
  }
  const headers = areaTableColumns.filter((column) => column !== "Actions");
  const escapeValue = (value: string | number | null | undefined) => {
    const str = (value ?? "").toString().replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvRows = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.name,
        row.description,
        row.height_m,
        row.created_at,
        row.updated_at,
      ]
        .map(escapeValue)
        .join(","),
    ),
  ];
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "areas.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return dateTimeFormatter.format(new Date(timestamp));
}

function openAddModal() {
  if (activeTab.value === "map") {
    openAddMapModal();
    return;
  }
  openAddAreaModal();
}

function confirmDeleteMap(row: MapRow) {
  Modal.confirm({
    title: "Delete Map",
    content: `Are you sure you want to delete ${row.name ?? `map #${row.id}`}?`,
    okText: "Delete",
    okType: "danger",
    cancelText: "Cancel",
    centered: true,
    onOk: () => deleteMap(row.id),
  });
}

function confirmDeleteArea(row: AreaRow) {
  Modal.confirm({
    title: "Delete Area",
    content: `Are you sure you want to delete ${row.name ?? `area #${row.id}`}?`,
    okText: "Delete",
    okType: "danger",
    cancelText: "Cancel",
    centered: true,
    onOk: () => deleteArea(row.id),
  });
}

async function deleteMap(id: number) {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    message.error("API base URL is not configured.");
    return;
  }
  try {
    const response = await fetch(`${mapModuleBase}/maps/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message ?? `Failed to delete map (${response.status}).`);
    }
    message.success(data?.message ?? "Map deleted successfully.");
    fetchMaps();
  } catch (error: any) {
    message.error(error?.message ?? "Failed to delete map.");
  }
}

async function deleteArea(id: number) {
  if (!import.meta.client) return;
  if (!mapModuleBase || mapModuleBase.startsWith("/")) {
    message.error("API base URL is not configured.");
    return;
  }
  try {
    const response = await fetch(`${mapModuleBase}/areas/${id}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message ?? `Failed to delete area (${response.status}).`);
    }
    message.success(data?.message ?? "Area deleted successfully.");
    fetchAreas();
  } catch (error: any) {
    message.error(error?.message ?? "Failed to delete area.");
  }
}

onMounted(() => {
  fetchMaps();
  fetchAreas();
});

watch(searchKeyword, () => {
  if (activeTab.value === "map") {
    mapPagination.value.page = 1;
    fetchMaps();
  } else {
    areaPagination.value.page = 1;
    fetchAreas();
  }
});

watch(activeTab, () => {
  if (activeTab.value === "map") {
    fetchMaps();
  } else {
    fetchAreas();
  }
});
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.25s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>

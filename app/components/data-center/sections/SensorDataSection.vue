<template>
  <section class="w-full py-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div
        :class="[
          'bg-white rounded border border-slate-200 overflow-hidden w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
          { hidden: !isFilterVisible },
        ]"
      >
        <div class="bg-slate-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
            <p class="text-xs text-gray-500">Refine sensor readings.</p>
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
          :fields="sensorFilterFields"
          :model-value="sensorFilters"
          :is-loading="isLoading"
          apply-label="Apply"
          reset-label="Reset"
          @update:modelValue="handleFilterModelUpdate"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </div>

      <div
        :class="[
          'flex flex-col gap-4',
          isFilterVisible ? 'flex-1' : 'max-w-8xl w-full mx-auto',
        ]"
      >
        <DataBoxCard
          class="sensor-data-table-card"
          :is-loading="isLoading"
          :columns="tableColumns.length"
          :has-data="displayedRows.length > 0"
          :pagination="pagination"
          loading-text="Loading sensor readings..."
          @prev-page="prevPage"
          @next-page="nextPage"
          @change-per-page="changePerPage"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <h3 class="text-gray-700 text-xs">Sensor Data</h3>
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
                  placeholder="Search gateway/node/sensor..."
                  class="pl-5 pr-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-60 text-xs cursor-text"
                />
                <BootstrapIcon
                  name="search"
                  class="absolute left-1 top-1.5 w-3 h-3 text-gray-400"
                />
              </div>
              <button
                type="button"
                class="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs border border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isLoading"
                @click="refreshRows"
              >
                <BootstrapIcon
                  name="arrow-clockwise"
                  class="w-3 h-3 mr-1"
                  :class="{ 'animate-spin': isLoading }"
                />
                {{ isLoading ? "Refreshing..." : "Refresh" }}
              </button>
            </div>
          </template>

          <template #head>
            <tr class="bg-slate-50 border-b border-gray-200 text-xs text-gray-600 text-center">
              <th
                v-for="column in tableColumns"
                :key="column"
                :class="[
                  'w-[14.2857%] px-2 py-2 font-normal text-gray-600 text-center align-middle leading-4',
                  column === 'Gateway' ||
                  column === 'Node' ||
                  column === 'Sensor' ||
                  column === 'Metric' ||
                  column === 'Timestamp'
                    ? 'text-left'
                    : '',
                ]"
              >
                {{ column }}
              </th>
            </tr>
          </template>

          <template #default>
            <tr
              v-for="row in displayedRows"
              :key="rowKey(row)"
              class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100 py-1 text-center"
            >
              <td class="w-[14.2857%] px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.gateway_id || "-" }}</td>
              <td class="w-[14.2857%] px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.node_id || "-" }}</td>
              <td class="w-[14.2857%] px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.sensor_id || "-" }}</td>
              <td class="w-[14.2857%] px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.metric || "-" }}</td>
              <td class="w-[14.2857%] px-2 py-2 text-gray-700 align-middle leading-4">{{ formatValue(row.value) }}</td>
              <td class="w-[14.2857%] px-2 py-2 text-gray-700 align-middle leading-4">{{ row.unit || "-" }}</td>
              <td class="w-[14.2857%] px-2 py-2 text-gray-700 text-left align-middle leading-4">
                {{ formatDateTime(row.timestamp) }}
              </td>
            </tr>
          </template>

          <template #empty>No sensor readings found.</template>
          <template #footer>
            <span>Showing {{ displayedRows.length }} entries on this page.</span>
            <span>
              Total filtered:
              <span class="text-gray-600 font-medium">{{ pagination.total }}</span>
            </span>
          </template>
        </DataBoxCard>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { apiConfig } from "~~/config/api";
import { formatIotDateTime } from "~~/config/iot-time-format";
import { useMetrics } from "@/composables/useMetrics";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";

type SensorReadingRow = {
  _id?: { $oid?: string } | string | null;
  gateway_id?: string | null;
  node_id?: string | null;
  sensor_id?: string | null;
  metric?: string | null;
  value?: unknown;
  unit?: string | null;
  timestamp?: string | null;
  raw?: unknown;
};

type SensorFilterState = {
  gateway_id: string;
  node_id: string;
  sensor_id: string;
  metric: string;
  timestamp_from: string;
  timestamp_to: string;
};

const IOT_OFFSET_MS = 7 * 60 * 60 * 1000;
const BASE_URL = (apiConfig.server || "").replace(/\/$/, "");

const { metrics } = useMetrics();

const isLoading = ref(false);
const isFilterVisible = ref(true);
const searchKeyword = ref("");

const tableColumns = [
  "Gateway",
  "Node",
  "Sensor",
  "Metric",
  "Value",
  "Unit",
  "Timestamp",
];

const rows = ref<SensorReadingRow[]>([]);
const pagination = ref({ page: 1, perPage: 20, lastPage: 1, total: 0 });

const sensorFilters = reactive<SensorFilterState>({
  gateway_id: "",
  node_id: "",
  sensor_id: "",
  metric: "",
  timestamp_from: "",
  timestamp_to: "",
});

const appliedFilters = ref<SensorFilterState>({ ...sensorFilters });

const sensorFilterFields = computed<FilterFieldRow[]>(() => [
  [{ key: "gateway_id", label: "Gateway ID", type: "text", placeholder: "GW_001" }],
  [{ key: "node_id", label: "Node ID", type: "text", placeholder: "node-sensor-001" }],
  [{ key: "sensor_id", label: "Sensor ID", type: "text", placeholder: "sensor-env-01-temp" }],
  [
    {
      key: "metric",
      label: "Metric",
      type: "select",
      options: [
        { label: "All", value: "" },
        ...metrics.value.map((metric) => ({
          label: metric.title,
          value: metric.key,
        })),
      ],
    },
  ],
  [
    { key: "timestamp_from", label: "Timestamp from", type: "datetime-local" },
    { key: "timestamp_to", label: "Timestamp to", type: "datetime-local" },
  ],
]);

const filteredRows = computed(() => {
  const filters = appliedFilters.value;
  const keyword = normalizeText(searchKeyword.value);

  return rows.value.filter((row) => {
    if (filters.gateway_id && !normalizeText(row.gateway_id).includes(normalizeText(filters.gateway_id))) {
      return false;
    }
    if (filters.node_id && !normalizeText(row.node_id).includes(normalizeText(filters.node_id))) {
      return false;
    }
    if (filters.sensor_id && !normalizeText(row.sensor_id).includes(normalizeText(filters.sensor_id))) {
      return false;
    }
    if (filters.metric && normalizeText(row.metric) !== normalizeText(filters.metric)) {
      return false;
    }

    const rowTime = toIotComparable(row.timestamp);
    if (filters.timestamp_from) {
      const fromTime = toIotComparable(fromLocalInputToIso(filters.timestamp_from));
      if (rowTime === null || fromTime === null || rowTime < fromTime) return false;
    }
    if (filters.timestamp_to) {
      const toTime = toIotComparable(fromLocalInputToIso(filters.timestamp_to));
      if (rowTime === null || toTime === null || rowTime > toTime) return false;
    }

    if (keyword) {
      const haystack = [
        row.gateway_id,
        row.node_id,
        row.sensor_id,
        row.metric,
        formatValue(row.value),
        row.unit,
      ]
        .map((value) => normalizeText(value))
        .join(" ");

      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
});

const displayedRows = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.perPage;
  const end = start + pagination.value.perPage;
  return filteredRows.value.slice(start, end);
});

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function fromLocalInputToIso(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function toIotComparable(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime() - IOT_OFFSET_MS;
}

function handleFilterModelUpdate(value: Record<string, string>) {
  Object.assign(sensorFilters, value);
}

function applyFilters(payload?: Record<string, string>) {
  appliedFilters.value = {
    ...sensorFilters,
    ...(payload ?? {}),
  };
  pagination.value.page = 1;
  fetchRows();
}

function resetFilters() {
  sensorFilters.gateway_id = "";
  sensorFilters.node_id = "";
  sensorFilters.sensor_id = "";
  sensorFilters.metric = "";
  sensorFilters.timestamp_from = "";
  sensorFilters.timestamp_to = "";
  appliedFilters.value = { ...sensorFilters };
  pagination.value.page = 1;
  fetchRows();
}

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
}

function refreshRows() {
  if (isLoading.value) return;
  fetchRows();
}

function prevPage() {
  if (pagination.value.page > 1) {
    pagination.value.page -= 1;
  }
}

function nextPage() {
  if (pagination.value.page < pagination.value.lastPage) {
    pagination.value.page += 1;
  }
}

function changePerPage(value: number) {
  if (value <= 0) return;
  pagination.value.perPage = value;
}

function recalculatePagination() {
  const total = filteredRows.value.length;
  pagination.value.total = total;
  const lastPage = Math.max(1, Math.ceil(total / pagination.value.perPage));
  pagination.value.lastPage = lastPage;
  if (pagination.value.page > lastPage) {
    pagination.value.page = lastPage;
  }
}

function formatDateTime(value?: string | null) {
  return formatIotDateTime(value, { fallback: "-" });
}

function formatValue(value: unknown) {
  if (typeof value === "number") return Number(value.toFixed(3)).toString();
  if (value && typeof value === "object" && "$numberDecimal" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>).$numberDecimal ?? "-");
  }
  return String(value ?? "-");
}

function formatObjectId(value: SensorReadingRow["_id"]) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "$oid" in value) {
    return String(value.$oid ?? "-");
  }
  return String(value);
}

function rowKey(row: SensorReadingRow) {
  const objectId = formatObjectId(row._id);
  return `${objectId}-${row.sensor_id ?? ""}-${row.timestamp ?? ""}`;
}

async function fetchRows() {
  if (!import.meta.client || !BASE_URL) return;

  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set("limit", "500");
    params.set("page", "1");

    if (appliedFilters.value.metric) params.set("sensor_type", appliedFilters.value.metric);
    if (appliedFilters.value.gateway_id) params.set("gateway_id", appliedFilters.value.gateway_id);
    if (appliedFilters.value.node_id) params.set("node_id", appliedFilters.value.node_id);
    if (appliedFilters.value.sensor_id) params.set("sensor_id", appliedFilters.value.sensor_id);

    const fromIso = fromLocalInputToIso(appliedFilters.value.timestamp_from);
    const toIso = fromLocalInputToIso(appliedFilters.value.timestamp_to);
    if (fromIso) params.set("timestamp_from", fromIso);
    if (toIso) params.set("timestamp_to", toIso);

    const response = await fetch(`${BASE_URL}/v1/sensors/query?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const payload = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(`Failed to fetch sensor data (${response.status}).`);
    }

    rows.value = Array.isArray(payload) ? (payload as SensorReadingRow[]) : [];
    recalculatePagination();
  } catch (error) {
    console.error("Failed to fetch sensor readings:", error);
    rows.value = [];
    recalculatePagination();
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchRows();
});

watch(
  filteredRows,
  () => {
    recalculatePagination();
  },
  { immediate: true },
);

watch(
  () => pagination.value.perPage,
  () => {
    pagination.value.page = 1;
    recalculatePagination();
  },
);

watch(searchKeyword, () => {
  pagination.value.page = 1;
});

</script>

<style scoped>
.sensor-data-table-card :deep(table) {
  table-layout: fixed;
}
</style>

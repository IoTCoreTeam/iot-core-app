<template>
  <section class="w-full py-4">
    <div class="flex flex-col gap-4">
      <ControlAckChartsPanel
        :bucket="controlAckBucket"
        :buckets="controlAckBuckets"
        :totals="controlAckTotals"
      />

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
            <p class="text-xs text-gray-500">Refine control logs.</p>
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
          :fields="filterFields"
          :model-value="filters"
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
          class="control-log-table-card"
          :is-loading="isLoading"
          :columns="tableColumns.length"
          :has-data="displayedRows.length > 0"
          :pagination="pagination"
          loading-text="Loading control logs..."
          @prev-page="prevPage"
          @next-page="nextPage"
          @change-per-page="changePerPage"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <h3 class="text-gray-700 text-xs">Control Log</h3>
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
                  placeholder="Search gateway/node/device/topic..."
                  class="pl-5 pr-1 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-64 text-xs cursor-text"
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
                  'px-2 py-2 font-normal text-gray-600 text-center align-middle leading-4',
                  leftAlignedColumns.has(column) ? 'text-left' : '',
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
              <td class="px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.gateway_id || "-" }}</td>
              <td class="px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.node_id || "-" }}</td>
              <td class="px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.device || "-" }}</td>
              <td class="px-2 py-2 text-gray-700 align-middle leading-4">{{ row.state || "-" }}</td>
              <td class="px-2 py-2 text-gray-700 align-middle leading-4">{{ row.status || "-" }}</td>
              <td class="px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ row.topic || "-" }}</td>
              <td class="px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ formatDateTime(row.timestamp) }}</td>
              <td class="px-2 py-2 text-gray-700 text-left align-middle leading-4">{{ formatDateTime(row.received_at) }}</td>
            </tr>
          </template>

          <template #empty>No control logs found.</template>
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { apiConfig } from "~~/config/api";
import { formatIotDateTime } from "~~/config/iot-time-format";
import ControlAckChartsPanel from "@/components/data-center/sections/data-overview/ControlAckChartsPanel.vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";

type ControlLogRow = {
  _id?: { $oid?: string } | string | null;
  gateway_id?: string | null;
  node_id?: string | null;
  device?: string | null;
  state?: string | null;
  status?: string | null;
  topic?: string | null;
  timestamp?: string | null;
  received_at?: string | null;
};

type FilterState = {
  gateway_id: string;
  node_id: string;
  device: string;
  state: string;
  status: string;
  topic: string;
  timestamp_from: string;
  timestamp_to: string;
};

defineProps<{
  section?: { id: string; label: string };
}>();

const SERVER_BASE_URL = (apiConfig.server || "").replace(/\/$/, "");

const tableColumns = [
  "Gateway",
  "Node",
  "Device",
  "State",
  "Status",
  "Topic",
  "Timestamp",
  "Received At",
];
const leftAlignedColumns = new Set([
  "Gateway",
  "Node",
  "Device",
  "Topic",
  "Timestamp",
  "Received At",
]);

const rows = ref<ControlLogRow[]>([]);
const searchKeyword = ref("");
const isLoading = ref(false);
const isFilterVisible = ref(true);
const pagination = ref({ page: 1, perPage: 20, lastPage: 1, total: 0 });
const controlAckBucket = ref<"hour" | "minute">("hour");
const controlAckBuckets = ref<
  {
    bucket: string;
    on: number;
    off: number;
    success: number;
    failed: number;
    timeout: number;
    unknown: number;
    avg_latency_ms: number | null;
    p95_latency_ms: number | null;
  }[]
>([]);
const controlAckTotals = ref({
  success: 0,
  failed: 0,
  timeout: 0,
  total: 0,
});

const filters = reactive<FilterState>({
  gateway_id: "",
  node_id: "",
  device: "",
  state: "",
  status: "",
  topic: "",
  timestamp_from: "",
  timestamp_to: "",
});
const appliedFilters = ref<FilterState>({ ...filters });

const filterFields = computed<FilterFieldRow[]>(() => [
  [{ key: "gateway_id", label: "Gateway ID", type: "text", placeholder: "GW_001" }],
  [{ key: "node_id", label: "Node ID", type: "text", placeholder: "node-control-001" }],
  [{ key: "device", label: "Device", type: "text", placeholder: "pump" }],
  [{ key: "state", label: "State", type: "text", placeholder: "on/off" }],
  [{ key: "status", label: "Status", type: "text", placeholder: "dispatched" }],
  [{ key: "topic", label: "Topic", type: "text", placeholder: "esp32/control/ack" }],
  [
    { key: "timestamp_from", label: "Timestamp from", type: "datetime-local" },
    { key: "timestamp_to", label: "Timestamp to", type: "datetime-local" },
  ],
]);

const filteredRows = computed(() => {
  const active = appliedFilters.value;
  const keyword = normalizeText(searchKeyword.value);

  return rows.value.filter((row) => {
    if (active.gateway_id && !normalizeText(row.gateway_id).includes(normalizeText(active.gateway_id))) {
      return false;
    }
    if (active.node_id && !normalizeText(row.node_id).includes(normalizeText(active.node_id))) {
      return false;
    }
    if (active.device && !normalizeText(row.device).includes(normalizeText(active.device))) {
      return false;
    }
    if (active.state && normalizeText(row.state) !== normalizeText(active.state)) {
      return false;
    }
    if (active.status && !normalizeText(row.status).includes(normalizeText(active.status))) {
      return false;
    }
    if (active.topic && !normalizeText(row.topic).includes(normalizeText(active.topic))) {
      return false;
    }

    const rowTime = toComparable(row.timestamp);
    if (active.timestamp_from) {
      const fromTime = toComparable(fromLocalInputToIso(active.timestamp_from));
      if (rowTime === null || fromTime === null || rowTime < fromTime) return false;
    }
    if (active.timestamp_to) {
      const toTime = toComparable(fromLocalInputToIso(active.timestamp_to));
      if (rowTime === null || toTime === null || rowTime > toTime) return false;
    }

    if (keyword) {
      const haystack = [
        row.gateway_id,
        row.node_id,
        row.device,
        row.state,
        row.status,
        row.topic,
        row.timestamp,
        row.received_at,
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

function toComparable(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function formatDateTime(value?: string | null) {
  return formatIotDateTime(value, { fallback: "-" });
}

function rowKey(row: ControlLogRow) {
  const objectId =
    typeof row._id === "string"
      ? row._id
      : (row._id as { $oid?: string } | null)?.$oid ?? "";
  return `${objectId}-${row.timestamp ?? ""}-${row.received_at ?? ""}`;
}

function handleFilterModelUpdate(value: Record<string, string>) {
  Object.assign(filters, value);
}

function applyFilters(payload?: Record<string, string>) {
  appliedFilters.value = {
    ...filters,
    ...(payload ?? {}),
  };
  pagination.value.page = 1;
  fetchRows();
}

function resetFilters() {
  filters.gateway_id = "";
  filters.node_id = "";
  filters.device = "";
  filters.state = "";
  filters.status = "";
  filters.topic = "";
  filters.timestamp_from = "";
  filters.timestamp_to = "";
  appliedFilters.value = { ...filters };
  pagination.value.page = 1;
  fetchRows();
}

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
}

function refreshRows() {
  if (isLoading.value) return;
  Promise.all([fetchControlAckOverview(), fetchRows()]);
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

async function fetchRows() {
  if (!import.meta.client || !SERVER_BASE_URL) return;

  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.set("limit", "500");
    params.set("page", "1");

    if (appliedFilters.value.gateway_id) params.set("gateway_id", appliedFilters.value.gateway_id);
    if (appliedFilters.value.node_id) params.set("node_id", appliedFilters.value.node_id);
    if (appliedFilters.value.device) params.set("device", appliedFilters.value.device);
    if (appliedFilters.value.state) params.set("state", appliedFilters.value.state);
    if (appliedFilters.value.status) params.set("status", appliedFilters.value.status);
    if (appliedFilters.value.topic) params.set("topic", appliedFilters.value.topic);

    const fromIso = fromLocalInputToIso(appliedFilters.value.timestamp_from);
    const toIso = fromLocalInputToIso(appliedFilters.value.timestamp_to);
    if (fromIso) params.set("timestamp_from", fromIso);
    if (toIso) params.set("timestamp_to", toIso);

    const response = await fetch(`${SERVER_BASE_URL}/v1/control-acks/query?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const payload = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(`Failed to fetch control logs (${response.status}).`);
    }

    rows.value = Array.isArray(payload) ? (payload as ControlLogRow[]) : [];
    recalculatePagination();
  } catch (error) {
    console.error("Failed to fetch control logs:", error);
    rows.value = [];
    recalculatePagination();
  } finally {
    isLoading.value = false;
  }
}

async function fetchControlAckOverview() {
  if (!import.meta.client || !SERVER_BASE_URL) return;
  try {
    const response = await fetch(
      `${SERVER_BASE_URL}/v1/control-acks/overview?hours=24&bucket=hour`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        (payload as { message?: string; error?: string })?.message ??
          (payload as { message?: string; error?: string })?.error ??
          `Failed to fetch control ACK overview (${response.status}).`,
      );
    }

    const controlAckOverview = payload as {
      bucket?: string;
      buckets?: typeof controlAckBuckets.value;
      totals?: Partial<typeof controlAckTotals.value>;
    };

    controlAckBucket.value =
      controlAckOverview?.bucket === "minute" ? "minute" : "hour";

    controlAckBuckets.value = Array.isArray(controlAckOverview?.buckets)
      ? controlAckOverview.buckets
      : [];

    const totals = controlAckOverview?.totals ?? {};
    controlAckTotals.value = {
      success: Number(totals?.success ?? 0),
      failed: Number(totals?.failed ?? 0),
      timeout: Number(totals?.timeout ?? 0),
      total: Number(totals?.total ?? 0),
    };
  } catch (error) {
    console.error("Failed to fetch control ACK overview:", error);
    controlAckBucket.value = "hour";
    controlAckBuckets.value = [];
    controlAckTotals.value = {
      success: 0,
      failed: 0,
      timeout: 0,
      total: 0,
    };
  }
}

onMounted(() => {
  fetchControlAckOverview();
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
.control-log-table-card :deep(table) {
  table-layout: fixed;
}
</style>

<template>
  <section class="w-full pt-4">
    <article
      v-if="isUsageChartVisible"
      class="mb-4 overflow-hidden rounded border border-slate-200 bg-white px-3 py-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <h4 class="text-xs font-semibold text-gray-700">
          Usage Frequency (All Data): {{ selectedUsageChartControlUrlLabel }}
        </h4>
        <button
          type="button"
          class="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          title="Hide chart"
          @click="
            selectedUsageChartControlUrlId = null;
            selectedUsageChartControlUrlLabel = '';
            usageChartError = null;
            usageChartSeries = [];
          "
        >
          <BootstrapIcon name="x-lg" class="h-3 w-3" />
        </button>
      </div>

      <div v-if="isLoadingUsageChart" class="py-8 text-center text-xs text-gray-500">
        <div class="mx-auto grid max-w-4xl grid-cols-12 gap-2">
          <div
            v-for="bar in 24"
            :key="`usage-chart-skeleton-${bar}`"
            class="h-24 self-end rounded bg-slate-100 animate-pulse"
            :style="{ height: `${20 + (bar % 6) * 16}px` }"
          />
        </div>
      </div>
      <div v-else-if="usageChartError" class="py-3 text-xs text-red-600">
        {{ usageChartError }}
      </div>
      <div v-else-if="usageChartSeries.length === 0" class="py-3 text-xs text-gray-500">
        No usage data found.
      </div>
      <ApexChart
        v-else
        height="260"
        type="bar"
        :options="usageChartOptions"
        :series="usageChartApexSeries"
      />
    </article>

    <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div
        :class="[
          'bg-white rounded border border-slate-200 overflow-hidden transition-all duration-200 w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
          { hidden: !isFilterVisible },
        ]"
      >
        <div class="bg-slate-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
            <p class="text-xs text-gray-500">Refine control data list.</p>
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
          :fields="deviceFilterFields"
          :model-value="deviceFilters"
          :is-loading="isLoading"
          apply-label="Apply"
          reset-label="Reset"
          @update:modelValue="handleDeviceFilterModelUpdate"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </div>

      <div :class="['flex flex-col gap-4', isFilterVisible ? 'flex-1' : 'max-w-8xl w-full mx-auto']">
        <DataBoxCard
          class="control-data-table-card"
          :is-loading="isLoading"
          :columns="tableColumns.length"
          :has-data="displayedRows.length > 0"
          :pagination="pagination"
          loading-text="Loading control data..."
          @prev-page="prevPage"
          @next-page="nextPage"
          @change-per-page="changePerPage"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-700 text-xs">Control URL</h3>
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-0.5"
                @click="toggleFilters"
              >
                {{ isFilterVisible ? "Hide Filters" : "Show Filters" }}
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative">
                <input
                  v-model="deviceSearchKeyword"
                  type="text"
                  placeholder="Search..."
                  class="pl-5 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-60 text-xs cursor-text"
                />
                <BootstrapIcon name="search" class="absolute left-1 top-1.5 w-3 h-3 text-gray-400" />
              </div>
              <button
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
            <tr class="bg-slate-50 border-b border-gray-200 text-xs text-gray-600 text-left">
              <th
                v-for="column in tableColumns"
                :key="column.key"
                class="px-2 py-2 font-normal text-gray-600 text-xs tracking-wide"
                :class="column.key === 'actions' || column.key === 'commands' ? 'text-center' : 'text-left'"
                :style="getColumnStyle(column.key)"
              >
                {{ column.label }}
              </th>
            </tr>
          </template>

          <template #default>
            <template v-for="row in displayedRows" :key="row.id">
              <tr
                :class="[
                  'transition-colors text-xs align-top border-b border-gray-100',
                  isSoftDeleted(row) ? 'bg-red-200 hover:bg-red-300' : 'hover:bg-gray-50',
                ]"
              >
                <td
                  v-for="column in tableColumns"
                  :key="column.key"
                  class="px-2 py-2 align-middle"
                  :class="column.key === 'actions' || column.key === 'commands' ? 'text-center' : ''"
                  :style="getColumnStyle(column.key)"
                >
                  <template v-if="column.key === 'commands'">
                    <div class="flex items-center justify-center">
                      <button
                        v-if="isJsonCommandControlUrl(row)"
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="isLoading"
                        title="Toggle command list"
                        @click="toggleInlineCommands(row)"
                      >
                        <BootstrapIcon
                          name="list-ul"
                          class="w-3 h-3"
                          :class="{ 'animate-spin': isLoadingCommandListByControlUrl[row.id] }"
                        />
                        <span class="sr-only">Toggle command list</span>
                      </button>
                    </div>
                  </template>
                  <template v-if="column.key === 'actions'">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="isLoading || isLoadingUsageChart"
                        @click="openUsageChart(row)"
                      >
                        <BootstrapIcon
                          name="bar-chart-line"
                          class="w-3 h-3"
                          :class="{ 'animate-spin': isLoadingUsageChart && selectedUsageChartControlUrlId === row.id }"
                        />
                        <span class="sr-only">Usage chart</span>
                      </button>
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="isLoading"
                        @click="openRegisteredControlUrlEdit(row)"
                      >
                        <BootstrapIcon name="pencil-square" class="w-3 h-3" />
                        <span class="sr-only">Edit Control URL</span>
                      </button>
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        :disabled="isLoading || isDeletingRegisteredControlUrl(row)"
                        :aria-busy="isDeletingRegisteredControlUrl(row)"
                        @click="handleDeleteRegisteredControlUrl(row)"
                      >
                        <BootstrapIcon name="trash" class="w-3 h-3" />
                        <span class="sr-only">Delete Control URL</span>
                      </button>
                    </div>
                  </template>
                  <template v-else-if="column.key !== 'commands'">
                    <span
                      class="block"
                      :class="getColumnValueClass(column.key)"
                      :title="String(displayCellValue(column.key, resolveCellValue(row, column.key)))"
                    >
                      {{ displayCellValue(column.key, resolveCellValue(row, column.key)) }}
                    </span>
                  </template>
                </td>
              </tr>

              <tr
                v-if="
                  isJsonCommandControlUrl(row) &&
                  expandedCommandControlUrlIds[row.id]
                "
                class="border-b border-blue-100 bg-slate-50"
              >
                <td :colspan="tableColumns.length" class="px-3 py-2">
                  <div
                    v-if="isLoadingCommandListByControlUrl[row.id]"
                    class="py-2 text-xs text-gray-500"
                  >
                    Loading json commands...
                  </div>
                  <div
                    v-else-if="!inlineCommandRows(row.id).length"
                    class="py-2 text-xs text-gray-500"
                  >
                    No json command found for this control url.
                  </div>

                  <div class="overflow-x-auto rounded border border-slate-200 bg-white text-xs">
                    <div
                      class="min-w-140 grid grid-cols-[minmax(0,1.6fr)_120px_180px_80px] gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-gray-600"
                    >
                      <span>Name</span>
                      <span>Mode</span>
                      <span>Updated</span>
                      <span class="text-center">Actions</span>
                    </div>

                    <div
                      v-for="command in inlineCommandRows(row.id)"
                      :key="command.id"
                      class="min-w-140 grid grid-cols-[minmax(0,1.6fr)_120px_180px_80px] items-center gap-2 border-b border-slate-100 px-2 py-1.5 last:border-b-0"
                    >
                      <span class="truncate text-gray-700" :title="command.name || 'N/A'">
                        {{ command.name || "N/A" }}
                      </span>
                      <span>
                        <span class="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                          {{ resolveCommandMode(command) }}
                        </span>
                      </span>
                      <span class="truncate text-gray-500" :title="displayCellValue('updatedAt', command.updatedAt)">
                        {{ displayCellValue("updatedAt", command.updatedAt) }}
                      </span>
                      <span class="flex items-center justify-center gap-1">
                        <button
                          v-if="canEditCommandSetup(command)"
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                          :disabled="isLoading"
                          title="Edit command"
                          @click="openEditRow(command)"
                        >
                          <BootstrapIcon name="pencil-square" class="w-3 h-3" />
                          <span class="sr-only">Edit Command</span>
                        </button>
                        <button
                          v-if="canDeleteCommandSetup(command)"
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                          :disabled="isLoading || isDeletingCommandSetup(command)"
                          :aria-busy="isDeletingCommandSetup(command)"
                          title="Delete command"
                          @click="deleteRow(command)"
                        >
                          <BootstrapIcon name="trash" class="w-3 h-3" />
                          <span class="sr-only">Delete Command</span>
                        </button>
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </template>

          <template #empty>
            No control URL found.
          </template>
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

    <EditRegisteredControlUrlModal
      :model-value="isRegisteredControlUrlEditOpen"
      title="Edit Control URL"
      :form="registeredControlUrlEditForm"
      :is-saving="isSavingRegisteredControlUrlEdit"
      @close="closeRegisteredControlUrlEdit"
      @save="saveRegisteredControlUrlEdit"
    />

    <AddCommandSetupModal
      :model-value="isCommandSetupModalOpen"
      :is-editing="isEditingCommandSetup"
      :is-saving="isSavingCommandSetup"
      :control-url-options="controlUrlOptions"
      :form="commandSetupForm"
      @request-close="closeCommandSetupModal"
      @after-leave="resetCommandSetupForm"
      @save="handleCreateCommandSetup"
      @draft-changed="handleGeneratedDraftChanged"
      @add-generated-field-input="addGeneratedFieldInput"
      @remove-generated-field-input="removeGeneratedFieldInput"
      @mode-changed="handleGeneratedModeChanged"
      @input-type-changed="handleCommandInputTypeChanged"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
import type { ApexOptions } from "apexcharts";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import AdvancedFilterPanel from "@/components/common/AdvancedFilterPanel.vue";
import AddCommandSetupModal from "@/components/Modals/Devices/AddCommandSetupModal.vue";
import EditRegisteredControlUrlModal from "@/components/Modals/Devices/EditRegisteredControlUrlModal.vue";
import type { DeviceRow } from "@/types/devices-control";
import type { ControlLogRow } from "@/types/control-ack";
import { useDeviceFilter } from "@/composables/DeviceRegistration/DeviceFilter";
import { useControlDataTabs } from "@/composables/DeviceRegistration/useControlDataTabs";
import { useAuthStore } from "~~/stores/auth";
import { apiConfig } from "~~/config/api";

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));
const isLoading = ref(false);
const isRegisteredControlUrlEditOpen = ref(false);
const isSavingRegisteredControlUrlEdit = ref(false);
const registeredControlUrlEditForm = ref({
  id: "",
  node_id: "",
  node_external_id: "",
  controller_id: "",
  name: "",
  url: "",
  input_type: "",
});
const pagination = ref({ page: 1, perPage: 10, lastPage: 1, total: 0 });
const authStore = useAuthStore();
const expandedCommandControlUrlIds = ref<Record<string, boolean>>({});
const isLoadingCommandListByControlUrl = ref<Record<string, boolean>>({});
const selectedUsageChartControlUrlId = ref<string | null>(null);
const selectedUsageChartControlUrlLabel = ref<string>("");
const isLoadingUsageChart = ref(false);
const usageChartError = ref<string | null>(null);
const usageChartSeries = ref<Array<{ x: string; y: number }>>([]);

const {
  deviceSearchKeyword,
  isDeviceFilterVisible: isFilterVisible,
  deviceFilters,
  deviceFilterFields,
  filterDeviceRows,
  handleDeviceFilterModelUpdate,
  applyDeviceFilters: applyFiltersBase,
  resetDeviceFilters: resetFiltersBase,
  toggleDeviceFilters: toggleFilters,
} = useDeviceFilter();

const {
  registeredControlUrlRows,
  loadRegisteredControlUrls,
  isDeletingRegisteredControlUrl,
  handleDeleteRegisteredControlUrl,
  commandSetupRows,
  isCommandSetupModalOpen,
  isSavingCommandSetup,
  isEditingCommandSetup,
  controlUrlOptions,
  commandSetupForm,
  loadCommandSetups,
  openEditCommandSetupModal,
  closeCommandSetupModal,
  resetCommandSetupForm,
  handleCreateCommandSetup,
  handleGeneratedModeChanged,
  handleGeneratedDraftChanged,
  addGeneratedFieldInput,
  removeGeneratedFieldInput,
  handleCommandInputTypeChanged,
  isDeletingCommandSetup,
  canEditCommandSetup,
  canDeleteCommandSetup,
  handleDeleteCommandSetup,
  isSoftDeleted,
} = useControlDataTabs({
  loadingRef: isLoading,
  includeSoftDeleted: true,
});

const tableColumns = [
  { key: "nodeId", label: "Node External ID", width: "14%" },
  { key: "controllerId", label: "Controller ID", width: "18%" },
  { key: "nodeType", label: "Node Type", width: "10%" },
  { key: "name", label: "Control URL Name", width: "13%" },
  { key: "url", label: "URL", width: "13%" },
  { key: "inputType", label: "Input Type", width: "10%" },
  { key: "actions", label: "Actions", width: "14%" },
  { key: "commands", label: "Commands", width: "8%" },
];

const truncateValueColumns = new Set(["nodeId", "controllerId", "name", "url"]);

const filteredRows = computed<DeviceRow[]>(() =>
  filterDeviceRows(registeredControlUrlRows.value)
    .slice()
    .sort((a, b) => {
      const aDeleted = isSoftDeleted(a);
      const bDeleted = isSoftDeleted(b);
      if (aDeleted !== bDeleted) {
        return aDeleted ? 1 : -1;
      }
      return a.id.localeCompare(b.id, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }),
);

const displayedRows = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.perPage;
  const end = start + pagination.value.perPage;
  return filteredRows.value.slice(start, end);
});

const isUsageChartVisible = computed(() => Boolean(selectedUsageChartControlUrlId.value));
const usageChartApexSeries = computed(() => [
  {
    name: "Executions",
    data: usageChartSeries.value,
  },
]);
const usageChartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: "bar",
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true },
  },
  colors: ["#2563eb"],
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: "45%",
    },
  },
  dataLabels: { enabled: false },
  stroke: {
    show: true,
    width: 1,
    colors: ["#1d4ed8"],
  },
  xaxis: {
    type: "datetime",
    labels: {
      datetimeUTC: false,
      style: { fontSize: "10px", colors: "#64748b" },
    },
  },
  yaxis: {
    min: 0,
    labels: {
      style: { fontSize: "10px", colors: "#64748b" },
      formatter: (value) => `${Math.round(value)}`,
    },
  },
  grid: {
    borderColor: "#e2e8f0",
    strokeDashArray: 3,
  },
  tooltip: {
    x: { format: "dd MMM yyyy" },
    y: {
      formatter: (value: number) => `${Math.round(value)} executions`,
    },
  },
}));

const commandRowsByControlUrl = computed<Record<string, DeviceRow[]>>(() => {
  const grouped: Record<string, DeviceRow[]> = {};
  for (const row of commandSetupRows.value) {
    const controlUrlId = row.controlUrlId ?? row.controlUrlMeta?.id ?? "";
    if (!controlUrlId) continue;
    if (!grouped[controlUrlId]) {
      grouped[controlUrlId] = [];
    }
    grouped[controlUrlId].push(row);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = grouped[key].slice().sort((a, b) => {
      const left = Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0;
      const right = Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0;
      return right - left;
    });
  }

  return grouped;
});

function inlineCommandRows(controlUrlId: string) {
  return commandRowsByControlUrl.value[controlUrlId] ?? [];
}

function isJsonCommandControlUrl(row: DeviceRow) {
  return String(row.inputType ?? "").trim().toLowerCase() === "json_command";
}

function normalizeDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseRowTime(row: ControlLogRow) {
  const primary = row.timestamp ? new Date(row.timestamp) : null;
  if (primary && !Number.isNaN(primary.getTime())) return primary;
  const fallback = row.received_at ? new Date(row.received_at) : null;
  if (fallback && !Number.isNaN(fallback.getTime())) return fallback;
  return null;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter((value) => value.length > 0),
    ),
  );
}

function buildDeviceCandidates(row: DeviceRow) {
  const fromUrl = String(row.url ?? "")
    .trim()
    .replace(/^\//, "");
  const controllerId = String(row.controllerId ?? "").trim();
  const tailByDash = controllerId.split("-").pop() ?? "";
  return uniqueStrings([
    row.controllerId,
    row.name,
    fromUrl || null,
    tailByDash || null,
    tailByDash.replaceAll("_", "-") || null,
  ]);
}

function buildNodeCandidates(row: DeviceRow) {
  const base = uniqueStrings([row.nodeId]);
  return uniqueStrings([...base, ...base.map((value) => value.replace(/^test-/i, ""))]);
}

function rowIdentity(row: ControlLogRow) {
  const raw = row._id;
  if (!raw) return `${row.timestamp ?? ""}-${row.received_at ?? ""}-${row.device ?? ""}`;
  if (typeof raw === "string") return raw;
  return String(raw.$oid ?? `${row.timestamp ?? ""}-${row.received_at ?? ""}-${row.device ?? ""}`);
}

async function fetchControlAckRowsPage(
  authorization: string,
  options: { page: number; limit: number; nodeId?: string; device?: string },
) {
  const serverBase = (apiConfig.server || "").replace(/\/$/, "");
  const params = new URLSearchParams();
  params.set("limit", String(options.limit));
  params.set("page", String(options.page));
  if (options.nodeId) params.set("node_id", options.nodeId);
  if (options.device) params.set("device", options.device);

  const response = await fetch(`${serverBase}/v1/control-acks/query?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: authorization,
      Accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Failed to load usage data.");
  }
  return Array.isArray(payload) ? (payload as ControlLogRow[]) : [];
}

async function fetchAllControlAckRowsForControlUrl(authorization: string, row: DeviceRow) {
  const limit = 500;
  const maxPagesPerQuery = 20;
  const deviceCandidates = buildDeviceCandidates(row);
  const nodeCandidates = buildNodeCandidates(row);
  const plans: Array<{ nodeId?: string; device: string }> = [];

  deviceCandidates.forEach((device) => {
    nodeCandidates.forEach((nodeId) => {
      plans.push({ nodeId, device });
    });
    plans.push({ device });
  });

  const merged = new Map<string, ControlLogRow>();
  for (const plan of plans) {
    for (let page = 1; page <= maxPagesPerQuery; page += 1) {
      const rows = await fetchControlAckRowsPage(authorization, {
        page,
        limit,
        nodeId: plan.nodeId,
        device: plan.device,
      });
      rows.forEach((entry) => {
        merged.set(rowIdentity(entry), entry);
      });
      if (rows.length < limit) break;
    }
  }

  return Array.from(merged.values());
}

async function openUsageChart(row: DeviceRow) {
  if (!row.id) {
    return;
  }
  if (!row.controllerId && !row.name) {
    return;
  }

  const isSame = selectedUsageChartControlUrlId.value === row.id;
  if (isSame) {
    selectedUsageChartControlUrlId.value = null;
    selectedUsageChartControlUrlLabel.value = "";
    usageChartSeries.value = [];
    usageChartError.value = null;
    return;
  }

  selectedUsageChartControlUrlId.value = row.id;
  selectedUsageChartControlUrlLabel.value = row.name || row.controllerId || row.id;
  isLoadingUsageChart.value = true;
  usageChartError.value = null;
  usageChartSeries.value = [];

  try {
    const serverBase = (apiConfig.server || "").replace(/\/$/, "");
    const authorization = authStore.authorizationHeader;
    if (!serverBase) {
      throw new Error("Server endpoint is not configured.");
    }
    if (!authorization) {
      throw new Error("Missing authorization. Please sign in again.");
    }

    const rows = await fetchAllControlAckRowsForControlUrl(authorization, row);
    const bucketMap = new Map<string, number>();
    rows.forEach((entry) => {
      const eventTime = parseRowTime(entry);
      if (!eventTime) return;
      const key = normalizeDateKey(eventTime.toISOString());
      if (!key) return;
      bucketMap.set(key, (bucketMap.get(key) ?? 0) + 1);
    });

    usageChartSeries.value = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({
        x: new Date(`${key}T00:00:00.000Z`).toISOString(),
        y: count,
      }));
  } catch (error: any) {
    usageChartError.value = error?.message ?? "Failed to load usage chart.";
  } finally {
    isLoadingUsageChart.value = false;
  }
}

function applyFilters(payload?: Record<string, string>) {
  applyFiltersBase(payload);
  pagination.value.page = 1;
}

function resetFilters() {
  resetFiltersBase();
  pagination.value.page = 1;
}

function prevPage() {
  if (pagination.value.page > 1) pagination.value.page -= 1;
}

function nextPage() {
  if (pagination.value.page < pagination.value.lastPage) pagination.value.page += 1;
}

function changePerPage(value: number) {
  if (value > 0) pagination.value.perPage = value;
}

function recalculatePagination() {
  const total = filteredRows.value.length;
  pagination.value.total = total;
  pagination.value.lastPage = Math.max(1, Math.ceil(total / pagination.value.perPage));
  if (pagination.value.page > pagination.value.lastPage) {
    pagination.value.page = pagination.value.lastPage;
  }
}

function isUuidValue(value: unknown) {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function isIdColumn(key: string) {
  return key === "id" || key.endsWith("Id") || key.endsWith("ID");
}

function displayCellValue(columnKey: string, value: unknown) {
  if (!value) return "N/A";
  if (columnKey === "command") {
    const content = String(value);
    return content.length > 20 ? `${content.slice(0, 20)}...` : content;
  }
  if (columnKey === "updatedAt") {
    const parsed = Date.parse(String(value));
    if (!Number.isFinite(parsed)) return "N/A";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(parsed));
  }
  if (isIdColumn(columnKey) && isUuidValue(value)) return "N/A";
  return String(value);
}

function resolveCellValue(row: DeviceRow, columnKey: string) {
  const dataMap: Record<string, unknown> = {
    name: row.name,
    nodeId: row.nodeId,
    nodeType: row.nodeType,
    controllerId: row.controllerId,
    url: row.url,
    inputType: row.inputType,
    commandCount: row.commandCount,
    command: row.command,
    updatedAt: row.updatedAt,
  };

  return dataMap[columnKey] ?? null;
}

function getColumnStyle(columnKey: string) {
  const column = tableColumns.find((item) => item.key === columnKey);
  return {
    width: column?.width ?? "auto",
  };
}

function getColumnValueClass(columnKey: string) {
  if (truncateValueColumns.has(columnKey)) {
    return "truncate";
  }
  return "whitespace-nowrap";
}

function openEditRow(row: DeviceRow) {
  openEditCommandSetupModal(row);
}

function deleteRow(row: DeviceRow) {
  handleDeleteCommandSetup(row);
}

function openRegisteredControlUrlEdit(row: DeviceRow) {
  registeredControlUrlEditForm.value = {
    id: row.id ?? "",
    node_id: row.nodeInternalId ?? "",
    node_external_id: row.nodeId ?? "",
    controller_id: row.controllerId ?? "",
    name: row.name ?? "",
    url: row.url ?? "",
    input_type: row.inputType ?? "",
  };
  isRegisteredControlUrlEditOpen.value = true;
}

function closeRegisteredControlUrlEdit() {
  isRegisteredControlUrlEditOpen.value = false;
}

async function saveRegisteredControlUrlEdit() {
  if (!registeredControlUrlEditForm.value.id || !registeredControlUrlEditForm.value.node_id) {
    return;
  }
  const authorization = authStore.authorizationHeader;
  if (!authorization) return;
  const base = (apiConfig.controlModule || "").replace(/\/$/, "");
  if (!base) return;

  isSavingRegisteredControlUrlEdit.value = true;
  try {
    const response = await fetch(
      `${base}/control-urls/${encodeURIComponent(registeredControlUrlEditForm.value.id)}`,
      {
        method: "PUT",
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          controller_id: registeredControlUrlEditForm.value.controller_id.trim(),
          node_id: registeredControlUrlEditForm.value.node_id,
          name: registeredControlUrlEditForm.value.name.trim(),
          url: registeredControlUrlEditForm.value.url.trim(),
          input_type: registeredControlUrlEditForm.value.input_type.trim(),
        }),
      },
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to update control url.");
    }
    closeRegisteredControlUrlEdit();
    await loadRegisteredControlUrls();
  } finally {
    isSavingRegisteredControlUrlEdit.value = false;
  }
}

function resolveCommandMode(row: DeviceRow) {
  const command = row.commandDetail?.command;
  if (!command || typeof command !== "object" || Array.isArray(command)) {
    return "N/A";
  }
  const mode = String((command as Record<string, unknown>).mode ?? "").trim();
  return mode ? mode.toUpperCase() : "N/A";
}

async function toggleInlineCommands(row: DeviceRow) {
  const controlUrlId = row.id;
  if (!controlUrlId) return;

  const isExpanded = Boolean(expandedCommandControlUrlIds.value[controlUrlId]);
  expandedCommandControlUrlIds.value = {
    ...expandedCommandControlUrlIds.value,
    [controlUrlId]: !isExpanded,
  };

  if (isExpanded || inlineCommandRows(controlUrlId).length > 0) {
    return;
  }

  isLoadingCommandListByControlUrl.value = {
    ...isLoadingCommandListByControlUrl.value,
    [controlUrlId]: true,
  };

  try {
    await loadCommandSetups();
  } finally {
    isLoadingCommandListByControlUrl.value = {
      ...isLoadingCommandListByControlUrl.value,
      [controlUrlId]: false,
    };
  }
}

async function refreshRows() {
  await Promise.all([loadCommandSetups(), loadRegisteredControlUrls()]);
}

watch(filteredRows, recalculatePagination, { immediate: true });
watch(deviceSearchKeyword, () => {
  pagination.value.page = 1;
});

onMounted(async () => {
  await Promise.all([loadCommandSetups(), loadRegisteredControlUrls()]);
});
</script>

<style scoped>
.control-data-table-card :deep(table) {
  table-layout: fixed;
}
</style>

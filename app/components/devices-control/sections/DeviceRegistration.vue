<template>
  <section class="min-h-screen">
    <a-tabs v-model:activeKey="activeDeviceTab" class="px-4 custom-tabs text-xs">
      <a-tab-pane v-for="tab in deviceTabs" :key="tab.key" :tab="tab.label">
        <div v-if="tab.key === activeDeviceTab" class="pb-2">
          <div v-if="tab.key === 'sensor'">
            <div class="mb-4">
              <SingleMetricChart
                class="rounded-lg border border-gray-200 bg-white"
                :metrics="availableMetrics"
                :selected-metric-key="selectedMetricKey"
                :selected-timeframe="selectedTimeframe"
                :sensor-ids="selectedSensorId ? [selectedSensorId] : []"
                @update:selected-metric-key="handleMetricChange"
                @update:selected-timeframe="handleTimeframeChange"
              />
            </div>
          </div>

          <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div
              :class="[
                'bg-white rounded border border-slate-200 overflow-hidden transition-all duration-200 w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
                { hidden: !isDeviceFilterVisible },
              ]"
            >
              <div
                class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between"
              >
                <div>
                  <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
                  <p class="text-xs text-gray-500">Refine the devices list.</p>
                </div>
                <button
                  type="button"
                  class="text-xs text-gray-500 hover:text-gray-700 lg:hidden"
                  @click="toggleDeviceFilters"
                >
                  Close
                </button>
              </div>
              <AdvancedFilterPanel
                :fields="deviceFilterFields"
                :model-value="deviceFilters"
                :is-loading="isDeviceLoading"
                apply-label="Apply"
                reset-label="Reset"
                @update:modelValue="handleDeviceFilterModelUpdate"
                @apply="applyDeviceFilters"
                @reset="resetDeviceFilters"
              />
            </div>

            <DataBoxCard
              :class="[
                'lg:self-start device-table',
                isDeviceFilterVisible ? 'flex-1' : 'max-w-8xl w-full mx-auto',
              ]"
              :key="deviceTableKey"
              :is-loading="isDeviceLoading"
              :columns="8"
              :has-data="displayedDeviceRows.length > 0"
              :pagination="devicePagination"
              :loading-text="deviceLoadingText"
              @prev-page="prevDevicePage"
              @next-page="nextDevicePage"
              @change-per-page="changeDevicePerPage"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-700 text-xs">
                    {{ currentDeviceTab.label }}
                  </h3>
                  <button
                    type="button"
                    class="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-0.5"
                    @click="toggleDeviceFilters"
                  >
                    {{
                      isDeviceFilterVisible ? "Hide Filters" : "Show Filters"
                    }}
                  </button>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <div class="relative">
                    <input
                      v-model="deviceSearchKeyword"
                      type="text"
                      placeholder="Search device, batch, note..."
                      class="pl-5 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-60 text-xs cursor-text"
                    />
                    <BootstrapIcon
                      name="search"
                      class="absolute left-1 top-1.5 h-3 w-3 text-gray-400"
                    />
                  </div>

                  <button
                    @click="refreshDevices"
                    class="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs border border-gray-300"
                    :disabled="isDeviceLoading"
                  >
                    <BootstrapIcon
                      name="arrow-clockwise"
                      class="w-3 h-3 mr-1"
                      :class="{ 'animate-spin': isDeviceLoading }"
                    />
                    {{ isDeviceLoading ? "Refreshing..." : "Refresh" }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                    :disabled="isDeviceLoading || !filteredDeviceRows.length"
                    @click="exportDevices"
                  >
                    <BootstrapIcon
                      name="file-earmark-arrow-down"
                      class="w-3 h-3 mr-1"
                    />
                    Export
                  </button>
                </div>
              </template>

              <template #head>
                <tr
                  class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600"
                >
                  <th
                    v-for="column in deviceTableColumnDefinitions"
                    :key="column.label"
                    class="px-2 py-2 font-normal text-gray-600 text-xs tracking-wide text-left"
                    :style="{ width: column.width }"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </template>
              <template #default>
                <tr
                  v-for="row in displayedDeviceRows"
                  :key="row.id"
                  :class="[
                    'transition-colors text-xs align-middle border-b border-gray-100 h-12',
                    activeDeviceTab === 'sensor'
                      ? 'hover:bg-blue-50 cursor-pointer'
                      : 'hover:bg-gray-50',
                    activeDeviceTab === 'sensor' && row.id === selectedSensorId
                      ? 'bg-blue-50'
                      : '',
                  ]"
                  @click="
                    activeDeviceTab === 'sensor' && handleSensorRowClick(row.id)
                  "
                >
                  <td
                    class="px-2 py-2 whitespace-nowrap align-middle"
                    :style="{ width: getColumnWidth(0) }"
                  >
                    <div class="text-xs">{{ row.id }}</div>
                  </td>
                  <td
                    class="px-2 py-2 text-gray-700 align-middle"
                    :style="{ width: getColumnWidth(1) }"
                  >
                    <p class="text-xs">{{ row.name }}</p>
                  </td>
                  <td
                    class="px-2 py-2 align-middle"
                    :style="{ width: getColumnWidth(2) }"
                  >
                    <p class="text-xs">
                      {{ row.ip || "N/A" }}
                    </p>
                  </td>
                  <td
                    class="px-2 py-2 align-middle"
                    :style="{ width: getColumnWidth(3) }"
                  >
                    <p class="text-xs">
                      {{ row.mac || "N/A" }}
                    </p>
                  </td>
                  <td
                    class="px-2 py-2 align-middle"
                    :style="{ width: getColumnWidth(4) }"
                  >
                    <div
                      class="text-xs font-semibold uppercase"
                      :class="statusTextColorClass(row.status)"
                    >
                      {{ formatDeviceStatus(row.status) }}
                    </div>
                  </td>
                  <td
                    class="px-2 py-2 align-middle"
                    :style="{ width: getColumnWidth(5) }"
                  >
                    <div
                      class="text-xs font-semibold uppercase"
                      :class="registrationTextColorClass(row.registered)"
                    >
                      {{ formatRegistrationStatus(row.registered) }}
                    </div>
                  </td>
                  <td
                    class="px-2 py-2 align-middle"
                    :style="{ width: getColumnWidth(6) }"
                  >
                    <div class="text-xs">
                      {{ formatLastSeen(row.lastSeen) }}
                    </div>
                  </td>
                  <td
                    class="px-2 py-2 align-middle"
                    :style="{ width: getColumnWidth(7) }"
                  >
                    <div class="inline-flex items-center gap-1">
                      <button
                        v-if="!isUnactiveStatus(row.status)"
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        title="View details"
                      >
                        <BootstrapIcon name="info-circle" class="w-3.5 h-3.5" />
                        <span class="sr-only">Details</span>
                      </button>
                      <template v-if="row.registered === false">
                        <button
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Register Device"
                          @click.stop="handleEnroll(row)"
                        >
                          <BootstrapIcon name="plus-lg" class="w-3.5 h-3.5" />
                          <span class="sr-only">Register</span>
                        </button>
                      </template>
                      <template v-else>
                        <button
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                          :class="{
                            'opacity-50 cursor-not-allowed':
                              isDeactivatingDevice(row.id),
                          }"
                          :disabled="isDeactivatingDevice(row.id)"
                          :aria-busy="isDeactivatingDevice(row.id)"
                          title="Deactivate Device"
                          @click.stop="handleDeactivateSensor(row)"
                        >
                          <BootstrapIcon
                            name="slash-circle"
                            class="w-3.5 h-3.5"
                          />
                          <span class="sr-only">Deactivate</span>
                        </button>
                      </template>
                    </div>
                  </td>
                </tr>
              </template>
              <template #empty> No devices to display yet. </template>

              <template #footer>
                <span
                  >Showing {{ displayedDeviceRows.length }} entries on this
                  page.</span
                >
                <span
                  >Total filtered:
                  <span class="text-gray-600 font-medium">{{
                    filteredDeviceRows.length
                  }}</span></span
                >
              </template>
            </DataBoxCard>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { message } from "ant-design-vue";
import AdvancedFilterPanel from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import type {
  DeviceRow,
  DeviceTab,
  DeviceTabKey,
  Section,
} from "@/types/devices-control";
import type { DashboardMetric, TimeframeKey } from "@/types/dashboard";
import { apiConfig } from "~~/config/api";
import { useRegisterDevice } from "@/composables/DeviceRegistration/RegisterDevice";
import { useDeviceDeactivation } from "@/composables/DeviceRegistration/DeactiveDevice";
import {
  defaultDeviceFilters,
  type GatewayFilterState,
  useDeviceFilter,
} from "@/composables/DeviceRegistration/DeviceFilter";

defineProps<{
  section: Section;
}>();

type GatewayEventPayload = {
  id: string;
  name?: string | null;
  ip?: string | null;
  mac?: string | null;
  status?: string | null;
  registered?: boolean | null;
  lastSeen?: string | null;
};

type DeviceCacheSnapshot = {
  version: number;
  savedAt: string;
  activeTab: DeviceTabKey;
  searchKeyword: string;
  filters: GatewayFilterState;
  selectedSensorId: DeviceRow["id"] | null;
  gateways: DeviceRow[];
  nodes: DeviceRow[];
  controllers: DeviceRow[];
  sensors: DeviceRow[];
};

const KNOWN_DEVICE_STATUSES = new Set<DeviceRow["status"]>([
  "online",
  "offline",
]);

const DEVICE_CACHE_KEY = "device-control-center-cache-v1";

const gatewayRows = ref<DeviceRow[]>([]);
const nodeRows = ref<DeviceRow[]>([]);
const controllerRows = ref<DeviceRow[]>([]);
const sensorRows = ref<DeviceRow[]>([]);
const selectedSensorId = ref<DeviceRow["id"] | null>(null);
const deviceTableKey = ref(0);

const { isDeactivatingDevice, deactivateDevice } = useDeviceDeactivation();
const { registerDevice } = useRegisterDevice();

function triggerDeviceTableReload(reason: "activate" | "deactivate") {
  if (isDeviceLoading.value) return;
  isDeviceLoading.value = true;
  deviceLoadingText.value =
    reason === "activate"
      ? "Activating device... This may take up to 5 seconds."
      : "Deactivating device... This may take up to 5 seconds.";
  deviceTableKey.value += 1;
  if (deviceRefreshTimeout) {
    clearTimeout(deviceRefreshTimeout);
  }
  deviceRefreshTimeout = setTimeout(() => {
    isDeviceLoading.value = false;
    deviceLoadingText.value = "Loading devices...";
  }, 5000);
}

async function handleDeactivateSensor(row: DeviceRow) {
  if (isDeactivatingDevice(row.id)) {
    return;
  }

  const success = await deactivateDevice(row, activeDeviceTab.value);
  if (success) {
    row.status = "offline";
    triggerDeviceTableReload("deactivate");
  }
}

async function handleEnroll(row: DeviceRow) {
  const success = await registerDevice(row);
  if (success) {
    triggerDeviceTableReload("activate");
  }
}

function handleReapprove(row: DeviceRow) {
  message.info("Reapproval logic will be added later.");
}

// Map để track active devices - KEY LÀ external_id hoặc ID

const gatewayCache = new Map<string, DeviceRow>();
let gatewayEventSource: EventSource | null = null;
let deviceStatusPoller: ReturnType<typeof setInterval> | null = null;

const ONLINE_DEVICE_STATUSES = new Set<DeviceRow["status"]>(["online"]);

const availableMetrics: DashboardMetric[] = [
  {
    key: "temperature",
    title: "Temperature",
    subtitle: "Ambient",
    value: 0,
    unit: "°C",
    icon: "thermometer",
    status: "good",
    min: 0,
    max: 100,
    change: 0,
    statusText: "Normal",
    description: "Temperature sensor",
    trend: [],
  },
  {
    key: "humidity",
    title: "Humidity",
    subtitle: "Relative",
    value: 0,
    unit: "%",
    icon: "droplet",
    status: "good",
    min: 0,
    max: 100,
    change: 0,
    statusText: "Normal",
    description: "Humidity sensor",
    trend: [],
  },
  {
    key: "light",
    title: "Light Level",
    subtitle: "Ambient",
    value: 0,
    unit: "%",
    icon: "brightness-high",
    status: "good",
    min: 0,
    max: 100,
    change: 0,
    statusText: "Normal",
    description: "Light sensor",
    trend: [],
  },
  {
    key: "soil_moisture",
    title: "Soil Moisture",
    subtitle: "Content",
    value: 0,
    unit: "%",
    icon: "moisture",
    status: "good",
    min: 0,
    max: 100,
    change: 0,
    statusText: "Normal",
    description: "Soil moisture sensor",
    trend: [],
  },
  {
    key: "rain",
    title: "Rain Sensor",
    subtitle: "Status",
    value: 0,
    unit: "%",
    icon: "cloud-rain",
    status: "good",
    min: 0,
    max: 100,
    change: 0,
    statusText: "Normal",
    description: "Rain sensor status",
    trend: [],
  },
];

let deviceRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

const deviceTabs = computed<DeviceTab[]>(() => [
  { key: "gateways", label: "Gateways", rows: gatewayRows.value },
  { key: "nodes", label: "Nodes", rows: nodeRows.value },
  { key: "controller", label: "Controller", rows: controllerRows.value },
  { key: "sensor", label: "Sensor", rows: sensorRows.value },
]);

const defaultDeviceTab = computed(() => deviceTabs.value[0]!);
const activeDeviceTab = ref<DeviceTabKey>("gateways");
const isDeviceLoading = ref(false);
const selectedMetricKey = ref<string>("");
const selectedTimeframe = ref<TimeframeKey>("hour");
const devicePagination = ref({ page: 1, perPage: 5, lastPage: 1, total: 0 });
const deviceLoadingText = ref("Loading devices...");
const deviceTableColumnDefinitions: Array<{ label: string; width: string }> = [
  { label: "ID", width: "10%" },
  { label: "Name", width: "18%" },
  { label: "IP", width: "12%" },
  { label: "MAC", width: "16%" },
  { label: "Status", width: "10%" },
  { label: "Registered", width: "10%" },
  { label: "Last Seen", width: "16%" },
  { label: "Actions", width: "8%" },
];
const deviceTableColumns = deviceTableColumnDefinitions.map(
  (column) => column.label,
);
const {
  deviceSearchKeyword,
  isDeviceFilterVisible,
  deviceFilters,
  appliedDeviceFilters,
  deviceFilterFields,
  filterDeviceRows,
  handleDeviceFilterModelUpdate,
  applyDeviceFilters: applyDeviceFiltersBase,
  resetDeviceFilters: resetDeviceFiltersBase,
  toggleDeviceFilters,
} = useDeviceFilter();

const currentDeviceTab = computed(
  () =>
    deviceTabs.value.find((tab) => tab.key === activeDeviceTab.value) ??
    defaultDeviceTab.value,
);
const currentDeviceRows = computed<DeviceRow[]>(
  () => currentDeviceTab.value.rows,
);
const filteredDeviceRows = computed<DeviceRow[]>(() =>
  filterDeviceRows(currentDeviceRows.value)
    .slice()
    .sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" }),
    ),
);
const displayedDeviceRows = computed<DeviceRow[]>(() => {
  const start =
    (devicePagination.value.page - 1) * devicePagination.value.perPage;
  const end = start + devicePagination.value.perPage;
  return filteredDeviceRows.value.slice(start, end);
});

// Watchers
watch(
  () => availableMetrics,
  (metrics) => {
    if (metrics.length > 0 && !selectedMetricKey.value) {
      selectedMetricKey.value = metrics[0]!.key;
    }
  },
  { immediate: true },
);

function applyDeviceFilters(payload?: Record<string, string>) {
  applyDeviceFiltersBase(payload);
  devicePagination.value.page = 1;
}

function resetDeviceFilters() {
  resetDeviceFiltersBase();
  devicePagination.value.page = 1;
}

function handleSensorRowClick(rowId: DeviceRow["id"]) {
  if (activeDeviceTab.value !== "sensor") return;
  selectedSensorId.value = rowId;
}

function refreshDevices() {
  if (isDeviceLoading.value) return;
  isDeviceLoading.value = true;

  if (deviceRefreshTimeout) {
    clearTimeout(deviceRefreshTimeout);
  }
  deviceRefreshTimeout = setTimeout(() => {
    isDeviceLoading.value = false;
  }, 800);
}

function handleMetricChange(key: string) {
  selectedMetricKey.value = key;
}

function handleTimeframeChange(timeframe: TimeframeKey) {
  selectedTimeframe.value = timeframe;
}

function exportDevices() {
  if (!import.meta.client) return;
  const rows = filteredDeviceRows.value;
  if (!rows.length) {
    message.warning("No devices to export.");
    return;
  }

  const headers = deviceTableColumns;
  const escapeValue = (value: string | number | null | undefined) => {
    const str = (value ?? "").toString().replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      [row.id, row.name, row.ip, row.mac, row.status, row.lastSeen]
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
  link.setAttribute(
    "download",
    `devices-${currentDeviceTab.value.label}-${timestamp}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  message.success("Devices exported.");
}

const lastSeenFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
});

function formatLastSeen(value?: string | null) {
  if (!value) return "N/A";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return lastSeenFormatter.format(timestamp);
}

function formatDeviceStatus(status: DeviceRow["status"]) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split(/[_-]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatRegistrationStatus(registered?: boolean) {
  return registered ? "true" : "false";
}

function registrationTextColorClass(registered?: boolean) {
  return registered ? "text-blue-600" : "text-red-500";
}

function statusTextColorClass(status?: DeviceRow["status"]) {
  const normalizedStatus = (status ?? "").toLowerCase() as DeviceRow["status"];
  return ONLINE_DEVICE_STATUSES.has(normalizedStatus)
    ? "text-blue-600"
    : "text-red-500";
}

function isOnlineExactStatus(status?: DeviceRow["status"]) {
  return (status ?? "").toLowerCase() === "online";
}

function isUnactiveStatus(status?: DeviceRow["status"]) {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "offline";
}

function getColumnWidth(index: number) {
  return deviceTableColumnDefinitions[index]?.width ?? "auto";
}

function prevDevicePage() {
  if (devicePagination.value.page > 1) {
    devicePagination.value.page -= 1;
  }
}

function nextDevicePage() {
  if (devicePagination.value.page < devicePagination.value.lastPage) {
    devicePagination.value.page += 1;
  }
}

function changeDevicePerPage(value: number) {
  if (value <= 0) return;
  devicePagination.value.perPage = value;
}

function recalculateDevicePagination() {
  const total = filteredDeviceRows.value.length;
  devicePagination.value.total = total;
  const lastPage = Math.max(
    1,
    Math.ceil(total / devicePagination.value.perPage),
  );
  devicePagination.value.lastPage = lastPage;
  if (devicePagination.value.page > lastPage) {
    devicePagination.value.page = lastPage;
  }
}

function parseTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeStatus(value?: string | null): DeviceRow["status"] {
  if (!value) {
    return "offline";
  }

  const normalized = value.toLowerCase();
  if (KNOWN_DEVICE_STATUSES.has(normalized as DeviceRow["status"])) {
    return normalized as DeviceRow["status"];
  }
  return "offline";
}

function updateGatewayFromPayload(payload: GatewayEventPayload) {
  if (!payload?.id) {
    return;
  }

  const existing = gatewayCache.get(payload.id);
  const row: DeviceRow = {
    id: payload.id,
    name: payload.name ?? existing?.name ?? `Gateway ${payload.id}`,
    ip: payload.ip ?? existing?.ip ?? null,
    mac: payload.mac ?? existing?.mac ?? null,
    status: normalizeStatus(payload.status),
    registered: payload.registered ?? false,
    lastSeen: payload.lastSeen ?? null,
  };

  gatewayCache.set(row.id, row);
  syncGatewayRows();
}

function syncGatewayRows() {
  gatewayRows.value = Array.from(gatewayCache.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

function markRowsOfflineByLastSeen(rows: DeviceRow[]) {
  const now = Date.now();
  const thresholdMs = 30_000;

  rows.forEach((row) => {
    const lastSeenTimestamp = parseTimestamp(row.lastSeen);
    if (!lastSeenTimestamp || now - lastSeenTimestamp > thresholdMs) {
      row.status = "offline";
    }
  });
}

function pollDeviceStatuses() {
  markRowsOfflineByLastSeen(gatewayRows.value);
  markRowsOfflineByLastSeen(nodeRows.value);
  markRowsOfflineByLastSeen(controllerRows.value);
  markRowsOfflineByLastSeen(sensorRows.value);
}

function startDeviceStatusPolling() {
  if (!import.meta.client || deviceStatusPoller) return;
  deviceStatusPoller = setInterval(pollDeviceStatuses, 30_000);
  pollDeviceStatuses();
}

function stopDeviceStatusPolling() {
  if (!deviceStatusPoller) return;
  clearInterval(deviceStatusPoller);
  deviceStatusPoller = null;
}

function handleGatewayUpdate(event: MessageEvent) {
  if (!event.data) {
    return;
  }

  try {
    const payload = JSON.parse(event.data);
    updateGatewayFromPayload(payload);
  } catch (error) {
    console.error("Failed to parse gateway SSE payload:", error);
  }
}

function handleGatewayError(event: Event) {
  console.error("Gateway SSE error:", event);
}

function connectGatewaySse() {
  if (!import.meta.client || !apiConfig.server) {
    return;
  }

  disconnectGatewaySse();

  try {
    const endpoint = `${apiConfig.server.replace(/\/$/, "")}/events/gateways`;
    const source = new EventSource(endpoint);
    source.addEventListener("gateway-update", handleGatewayUpdate);
    source.addEventListener("error", handleGatewayError);
    gatewayEventSource = source;
  } catch (error) {
    console.error("Failed to connect to gateway SSE:", error);
  }
}

function disconnectGatewaySse() {
  if (gatewayEventSource) {
    gatewayEventSource.close();
    gatewayEventSource = null;
  }
}

function loadDeviceCache() {
  if (!import.meta.client) return;
  try {
    const raw = sessionStorage.getItem(DEVICE_CACHE_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw) as DeviceCacheSnapshot;
    if (!payload || payload.version !== 1) return;

    activeDeviceTab.value = payload.activeTab ?? activeDeviceTab.value;
    deviceSearchKeyword.value = payload.searchKeyword ?? "";
    Object.assign(deviceFilters, payload.filters ?? {});
    appliedDeviceFilters.value = payload.filters ?? { ...defaultDeviceFilters };
    selectedSensorId.value = payload.selectedSensorId ?? null;

    gatewayCache.clear();
    (payload.gateways ?? []).forEach((row) => gatewayCache.set(row.id, row));
    syncGatewayRows();
    nodeRows.value = payload.nodes ?? [];
    controllerRows.value = payload.controllers ?? [];
    sensorRows.value = payload.sensors ?? [];
  } catch (error) {
    console.error("Failed to load device cache:", error);
  }
}

function saveDeviceCache() {
  if (!import.meta.client) return;
  try {
    const snapshot: DeviceCacheSnapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      activeTab: activeDeviceTab.value,
      searchKeyword: deviceSearchKeyword.value,
      filters: { ...appliedDeviceFilters.value },
      selectedSensorId: selectedSensorId.value,
      gateways: gatewayRows.value,
      nodes: nodeRows.value,
      controllers: controllerRows.value,
      sensors: sensorRows.value,
    };
    sessionStorage.setItem(DEVICE_CACHE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error("Failed to save device cache:", error);
  }
}

onMounted(() => {
  if (!import.meta.client) return;
  loadDeviceCache();
  connectGatewaySse();
  startDeviceStatusPolling();
});

onBeforeUnmount(() => {
  disconnectGatewaySse();
  stopDeviceStatusPolling();
});

watch(
  filteredDeviceRows,
  () => {
    recalculateDevicePagination();
  },
  { immediate: true },
);

watch(
  () => devicePagination.value.perPage,
  () => {
    devicePagination.value.page = 1;
    recalculateDevicePagination();
  },
);

watch(deviceSearchKeyword, () => {
  devicePagination.value.page = 1;
});

watch(
  [
    gatewayRows,
    nodeRows,
    controllerRows,
    sensorRows,
    activeDeviceTab,
    deviceSearchKeyword,
    () => appliedDeviceFilters.value,
    selectedSensorId,
  ],
  () => {
    saveDeviceCache();
  },
  { deep: true },
);
</script>

<style scoped>
.wrap-break-words {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

:deep(.device-table table) {
  table-layout: fixed;
}
</style>

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
                class="bg-slate-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between"
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
              :columns="deviceTableColumnDefinitions.length"
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
                      class="absolute left-1 top-1.5 w-3 h-3 text-gray-400"
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
                  class="bg-slate-50 border-b border-gray-200 text-xs text-gray-600"
                >
                  <th
                    v-for="column in deviceTableColumnDefinitions"
                    :key="column.key"
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
                    'hover:bg-slate-50',
                  ]"
                >
                  <td
                    v-for="(column, columnIndex) in deviceTableColumnDefinitions"
                    :key="column.key"
                    class="px-2 py-2 align-middle"
                    :style="{ width: getColumnWidth(columnIndex) }"
                  >
                    <template v-if="column.key === 'id'">
                      <div class="text-xs whitespace-nowrap">{{ row.id }}</div>
                    </template>
                    <template v-else-if="column.key === 'name'">
                      <p class="text-xs text-gray-700 truncate">{{ row.name }}</p>
                    </template>
                    <template v-else-if="column.key === 'gatewayId'">
                      <p class="text-xs truncate">{{ row.gatewayId || "N/A" }}</p>
                    </template>
                    <template v-else-if="column.key === 'ip'">
                      <p class="text-xs">{{ row.ip || "N/A" }}</p>
                    </template>
                    <template v-else-if="column.key === 'mac'">
                      <p class="text-xs truncate">{{ row.mac || "N/A" }}</p>
                    </template>
                    <template v-else-if="column.key === 'status'">
                      <div
                        class="text-xs font-semibold uppercase"
                        :class="statusTextColorClass(row.status)"
                      >
                        {{ formatDeviceStatus(row.status) }}
                      </div>
                    </template>
                    <template v-else-if="column.key === 'registered'">
                      <div
                        class="text-xs font-semibold uppercase"
                        :class="registrationTextColorClass(row.registered)"
                      >
                        {{ formatRegistrationStatus(row.registered) }}
                      </div>
                    </template>
                    <template v-else-if="column.key === 'lastSeen'">
                      <div class="text-xs">{{ formatLastSeen(row.lastSeen) }}</div>
                    </template>
                    <template v-else-if="column.key === 'actions'">
                      <div class="inline-flex items-center gap-1">
                        <button
                          v-if="!isUnactiveStatus(row.status)"
                          type="button"
                          class="w-8 h-8 inline-flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                          title="View details"
                        >
                          <BootstrapIcon name="info-circle" class="w-3 h-3" />
                          <span class="sr-only">Details</span>
                        </button>
                        <template v-if="row.registered === false">
                          <button
                            type="button"
                            class="w-8 h-8 inline-flex items-center justify-center rounded border cursor-pointer"
                            :class="[
                              activeDeviceTab === 'gateways'
                                ? 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                : isGatewayRegisteredForRow(row)
                                  ? 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                  : 'border-gray-200 text-gray-400 bg-gray-50',
                            ]"
                            title="Register Device"
                            @click.stop="handleNodeEnrollClick(row)"
                          >
                            <BootstrapIcon name="plus-lg" class="w-3 h-3" />
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
                            <BootstrapIcon name="slash-circle" class="w-3 h-3" />
                            <span class="sr-only">Deactivate</span>
                          </button>
                        </template>
                      </div>
                    </template>
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
import { useAuthStore } from "~~/stores/auth";
import {
  createNodeCollectionsStore,
  type GatewayEventPayload,
} from "@/composables/DeviceRegistration/SSEHandle";
import {
  defaultDeviceFilters,
  type GatewayFilterState,
  useDeviceFilter,
} from "@/composables/DeviceRegistration/DeviceFilter";

defineProps<{
  section: Section;
}>();

const KNOWN_DEVICE_STATUSES = new Set<DeviceRow["status"]>([
  "online",
  "offline",
]);

const gatewayRows = ref<DeviceRow[]>([]);
const nodeRows = ref<DeviceRow[]>([]);
const controllerRows = ref<DeviceRow[]>([]);
const sensorRows = ref<DeviceRow[]>([]);
const selectedSensorId = ref<DeviceRow["id"] | null>(null);
const deviceTableKey = ref(0);

const { isDeactivatingDevice, deactivateDevice } = useDeviceDeactivation();
const { registerDevice } = useRegisterDevice();
const authStore = useAuthStore();
const gatewayIdMap = ref<Record<string, string>>({});
const isGatewayIdMapLoading = ref(false);

async function loadGatewayIdMap() {
  if (!import.meta.client) return;
  if (isGatewayIdMapLoading.value) return;
  if (!apiConfig.controlModule) return;

  const authorization = authStore.authorizationHeader;
  if (!authorization) return;

  isGatewayIdMapLoading.value = true;
  try {
    const endpoint = `${apiConfig.controlModule.replace(/\/$/, "")}/gateways`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to load gateways.");
    }

    const rows = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    const map: Record<string, string> = {};
    rows.forEach((row: any) => {
      if (row?.external_id && row?.id) {
        map[row.external_id] = row.id;
      }
    });
    gatewayIdMap.value = map;
  } catch (error) {
    console.error("Failed to load gateway IDs", error);
  } finally {
    isGatewayIdMapLoading.value = false;
  }
}

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
    row.registered = false;
    triggerDeviceTableReload("deactivate");
  }
}

async function handleEnroll(row: DeviceRow) {
  if (activeDeviceTab.value !== "gateways" && !row.gatewayId) {
    message.warning("Gateway ID is missing for this node.");
    return;
  }

  const gatewayIp =
    activeDeviceTab.value === "gateways" ? null : getGatewayIpForRow(row);
  if (activeDeviceTab.value !== "gateways" && !gatewayIp) {
    message.warning("Gateway IP is missing for this node.");
    return;
  }

  let gatewayUuid: string | null = null;
  if (activeDeviceTab.value !== "gateways") {
    const gatewayExternalId = row.gatewayId ?? null;
    if (!gatewayExternalId) {
      message.warning("Gateway ID is missing for this node.");
      return;
    }

    if (!gatewayIdMap.value[gatewayExternalId]) {
      await loadGatewayIdMap();
    }
    gatewayUuid = gatewayIdMap.value[gatewayExternalId] ?? null;
    if (!gatewayUuid) {
      message.warning(
        `Gateway ${gatewayExternalId} not found in Control Module.`,
      );
      return;
    }
  }

  const success = await registerDevice(row, {
    tab: activeDeviceTab.value,
    gatewayIp,
    gatewayId: gatewayUuid,
  });
  if (success) {
    triggerDeviceTableReload("activate");
  }
}

function getGatewayIdFromRow(row: DeviceRow) {
  return row.gatewayId ?? null;
}

function getGatewayIpForRow(row: DeviceRow) {
  const gatewayId = getGatewayIdFromRow(row);
  if (!gatewayId) return null;
  const gateway = gatewayRows.value.find((item) => item.id === gatewayId);
  return gateway?.ip ?? null;
}

function isGatewayRegisteredForRow(row: DeviceRow) {
  const gatewayId = getGatewayIdFromRow(row);
  if (!gatewayId) return false;
  const gateway = gatewayRows.value.find((item) => item.id === gatewayId);
  return gateway?.registered === true;
}

function handleNodeEnrollClick(row: DeviceRow) {
  if (activeDeviceTab.value === "gateways") {
    return handleEnroll(row);
  }
  if (!isGatewayRegisteredForRow(row)) {
    const gatewayId = getGatewayIdFromRow(row);
    message.info(
      gatewayId
        ? `Please register gateway ${gatewayId} first.`
        : "Please register the node's gateway first.",
    );
    return;
  }
  return handleEnroll(row);
}

function handleReapprove(row: DeviceRow) {
  message.info("Reapproval logic will be added later.");
}

// Map để track active devices - KEY LÀ external_id hoặc ID

const gatewayCache = new Map<string, DeviceRow>();
const nodeCollectionsStore = createNodeCollectionsStore();
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
const gatewayTableColumns: Array<{ key: string; label: string; width: string }> = [
  { key: "id", label: "ID", width: "10%" },
  { key: "name", label: "Name", width: "18%" },
  { key: "ip", label: "IP", width: "12%" },
  { key: "mac", label: "MAC", width: "16%" },
  { key: "status", label: "Status", width: "10%" },
  { key: "registered", label: "Registered", width: "10%" },
  { key: "lastSeen", label: "Last Seen", width: "16%" },
  { key: "actions", label: "Actions", width: "8%" },
];
const nodeTableColumns: Array<{ key: string; label: string; width: string }> = [
  { key: "id", label: "ID", width: "auto" },
  { key: "name", label: "Name", width: "auto" },
  { key: "gatewayId", label: "Gateway ID", width: "auto" },
  { key: "mac", label: "MAC", width: "auto" },
  { key: "status", label: "Status", width: "auto" },
  { key: "registered", label: "Registered", width: "auto" },
  { key: "lastSeen", label: "Last Seen", width: "auto" },
  { key: "actions", label: "Actions", width: "auto" },
];
const deviceTableColumnDefinitions = computed(() =>
  activeDeviceTab.value === "gateways" ? gatewayTableColumns : nodeTableColumns,
);
const deviceTableColumns = computed(() =>
  deviceTableColumnDefinitions.value.map((column) => column.label),
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

  const headers = deviceTableColumns.value;
  const escapeValue = (value: string | number | boolean | null | undefined) => {
    const str = (value ?? "").toString().replace(/"/g, '""');
    return `"${str}"`;
  };

  const columnKeys = deviceTableColumnDefinitions.value.map(
    (column) => column.key,
  );

  const resolveCell = (row: DeviceRow, key: string) => {
    switch (key) {
      case "id":
        return row.id;
      case "name":
        return row.name;
      case "gatewayId":
        return row.gatewayId ?? "";
      case "ip":
        return row.ip ?? "";
      case "mac":
        return row.mac ?? "";
      case "status":
        return row.status ?? "";
      case "registered":
        return row.registered ?? "";
      case "lastSeen":
        return row.lastSeen ?? "";
      default:
        return "";
    }
  };

  const csvRows = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      columnKeys
        .filter((key) => key !== "actions")
        .map((key) => resolveCell(row, key))
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
  return deviceTableColumnDefinitions.value[index]?.width ?? "auto";
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
    const payload = JSON.parse(event.data) as GatewayEventPayload;
    updateGatewayFromPayload(payload);
    nodeCollectionsStore.updateFromGatewayPayload(payload, {
      nodeRows,
      controllerRows,
      sensorRows,
    });
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

onMounted(() => {
  if (!import.meta.client) return;
  loadGatewayIdMap();
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

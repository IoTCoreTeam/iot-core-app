<template>
  <section class="min-h-screen">
    <a-tabs v-model:activeKey="activeDeviceTab" class="px-6 pt-4 custom-tabs">
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
                'lg:self-start',
                isDeviceFilterVisible ? 'flex-1' : 'max-w-8xl w-full mx-auto',
              ]"
              :is-loading="isDeviceLoading"
              :columns="8"
              :has-data="displayedDeviceRows.length > 0"
              :pagination="devicePagination"
              loading-text="Loading devices..."
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
                    v-for="column in deviceTableColumns"
                    :key="column"
                    class="px-2 py-2 text-left font-medium text-gray-600"
                  >
                    {{ column }}
                  </th>
                </tr>
              </template>
              <template #default>
                <tr
                  v-for="row in displayedDeviceRows"
                  :key="row.id"
                  :class="[
                    'transition-colors text-xs align-top border-b border-gray-100 py-1',
                    activeDeviceTab === 'sensor'
                      ? 'hover:bg-blue-50 cursor-pointer'
                      : 'hover:bg-gray-50',
                    activeDeviceTab === 'sensor' && row.id === selectedSensorId
                      ? 'bg-blue-50'
                      : '',
                    getRowBackgroundClass(row),
                  ]"
                  @click="
                    activeDeviceTab === 'sensor' && handleSensorRowClick(row.id)
                  "
                >
                  <td
                    class="px-2 py-1 whitespace-nowrap text-gray-800 align-top"
                  >
                    <div class="font-semibold text-xs">{{ row.name }}</div>
                    <div class="text-[11px] text-gray-500 mt-2">
                      ID: {{ row.id }}
                    </div>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <p class="text-xs font-medium">{{ row.serialNumber }}</p>
                  </td>
                  <td
                    class="px-2 py-1 text-gray-700 leading-5 wrap-break-words align-top"
                  >
                    <p class="text-xs font-semibold text-gray-800">
                      {{ row.connectionKey }}
                    </p>
                    <p
                      v-if="row.connectionHint"
                      class="text-[11px] text-gray-500 mt-2"
                    >
                      {{ row.connectionHint }}
                    </p>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <span
                      class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
                      :class="statusBadgeClass(row.status)"
                    >
                      {{ formatDeviceStatus(row.status) }}
                    </span>
                  </td>
                  <td
                    class="px-2 py-1 text-gray-700 leading-5 wrap-break-words align-top"
                  >
                    <p class="text-xs text-gray-800">
                      {{ row.location || "N/A" }}
                    </p>
                    <p v-if="row.note" class="text-[11px] text-gray-500 mt-2">
                      {{ row.note }}
                    </p>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <div class="text-xs font-medium">
                      {{ row.ipAddress || "N/A" }}
                    </div>
                    <div
                      v-if="row.lastHeartbeat"
                      class="text-[11px] text-gray-500 mt-2"
                    >
                      Last ping: {{ row.lastHeartbeat }}
                    </div>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <div>{{ row.updatedAt }}</div>
                    <div
                      v-if="row.updatedBy"
                      class="text-[11px] text-gray-500 mt-2"
                    >
                      By {{ row.updatedBy }}
                    </div>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        title="View details"
                      >
                        <BootstrapIcon name="info-circle" class="w-3.5 h-3.5" />
                        <span class="sr-only">Details</span>
                      </button>
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        title="Approve Device"
                      >
                        <BootstrapIcon
                          name="check-circle"
                          class="w-3.5 h-3.5"
                        />
                        <span class="sr-only">Approve</span>
                      </button>
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
import { computed, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import type {
  DeviceFilterState,
  DeviceRow,
  DeviceTab,
  DeviceTabKey,
  Section,
} from "@/types/devices-control";
import type {
  DashboardMetric,
  SeriesPoint,
  TimeframeKey,
} from "@/types/dashboard";

defineProps<{
  section: Section;
}>();

const gatewayRows = ref<DeviceRow[]>([]);
const nodeRows = ref<DeviceRow[]>([]);
const controllerRows = ref<DeviceRow[]>([]);
const sensorRows = ref<DeviceRow[]>([]);
const activeDevicesMap = ref<Map<string, any>>(new Map());
const selectedSensorId = ref<DeviceRow["id"] | null>(null);

// Map để track active devices - KEY LÀ external_id hoặc ID

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
const isDeviceFilterVisible = ref(true);
const deviceSearchKeyword = ref("");
const isDeviceLoading = ref(false);
const selectedMetricKey = ref<string>("");
const selectedTimeframe = ref<TimeframeKey>("hour");
const devicePagination = ref({ page: 1, perPage: 5, lastPage: 1, total: 0 });
const deviceTableColumns = [
  "Name",
  "Serial Number",
  "Connection Key",
  "Status",
  "Location",
  "IP Address",
  "Last Update",
  "Action",
];

const defaultDeviceFilters: DeviceFilterState = {
  name: "",
  serialNumber: "",
  connectionKey: "",
  location: "",
  ipAddress: "",
  status: "",
};
const deviceFilters = reactive<DeviceFilterState>({ ...defaultDeviceFilters });
const appliedDeviceFilters = ref({ ...defaultDeviceFilters });

const currentDeviceTab = computed(
  () =>
    deviceTabs.value.find((tab) => tab.key === activeDeviceTab.value) ??
    defaultDeviceTab.value
);
const currentDeviceRows = computed<DeviceRow[]>(
  () => currentDeviceTab.value.rows
);
const filteredDeviceRows = computed<DeviceRow[]>(() =>
  filterDeviceRows(currentDeviceRows.value)
);
const displayedDeviceRows = computed<DeviceRow[]>(() => {
  const start =
    (devicePagination.value.page - 1) * devicePagination.value.perPage;
  const end = start + devicePagination.value.perPage;
  return filteredDeviceRows.value.slice(start, end);
});

const deviceFilterFields: FilterFieldRow[] = [
  [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All", value: "" },
        { label: "Registered", value: "registered" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
      ],
    },
  ],
  [
    {
      key: "name",
      label: "Name",
      type: "text",
      placeholder: "Enviro Sensor Pro",
    },
  ],
  [
    {
      key: "serialNumber",
      label: "Serial Number",
      type: "text",
      placeholder: "ESP-4421",
    },
  ],
  [
    {
      key: "connectionKey",
      label: "Connection Key",
      type: "text",
      placeholder: "esp-4421-0a8d",
    },
  ],
  [
    {
      key: "location",
      label: "Location",
      type: "text",
      placeholder: "North Site",
    },
  ],
  [
    {
      key: "ipAddress",
      label: "IP Address",
      type: "text",
      placeholder: "10.21.4.12",
    },
  ],
];

// DeviceRegistration.vue

function getRowBackgroundClass(row: DeviceRow): string {
  // Nếu thiết bị có status là 'active' hoặc nằm trong Map thì để nền trắng, ngược lại hơi đỏ (cảnh báo)
  const isOnline = row.status === 'active' || activeDevicesMap.value.has(row.id);
  
  if (activeDeviceTab.value === 'gateways' || activeDeviceTab.value === 'sensor') {
    return isOnline ? 'bg-white' : 'bg-red-50';
  }
  return '';
}

// Watchers
watch(
  () => availableMetrics,
  (metrics) => {
    if (metrics.length > 0 && !selectedMetricKey.value) {
      selectedMetricKey.value = metrics[0]!.key;
    }
  },
  { immediate: true }
);

function filterDeviceRows(rows: DeviceRow[]) {
  const keyword = deviceSearchKeyword.value.trim().toLowerCase();
  const filters = appliedDeviceFilters.value;

  return rows.filter((row) => {
    if (keyword) {
      const haystack = [
        row.name,
        row.serialNumber,
        row.connectionKey,
        row.location,
        row.ipAddress,
        row.note,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }

    if (
      filters.name &&
      !row.name.toLowerCase().includes(filters.name.toLowerCase())
    )
      return false;
    if (
      filters.serialNumber &&
      !(row.serialNumber || "")
        .toLowerCase()
        .includes(filters.serialNumber.toLowerCase())
    )
      return false;
    if (
      filters.connectionKey &&
      !(row.connectionKey || "")
        .toLowerCase()
        .includes(filters.connectionKey.toLowerCase())
    )
      return false;
    if (
      filters.location &&
      !(row.location || "")
        .toLowerCase()
        .includes(filters.location.toLowerCase())
    )
      return false;
    if (
      filters.ipAddress &&
      !(row.ipAddress || "")
        .toLowerCase()
        .includes(filters.ipAddress.toLowerCase())
    )
      return false;
    if (filters.status && row.status !== filters.status) return false;

    return true;
  });
}

function snapshotDeviceFilters() {
  return { ...deviceFilters };
}

function handleDeviceFilterModelUpdate(value: Record<string, string>) {
  Object.assign(deviceFilters, value);
}

function applyDeviceFilters(payload?: Record<string, string>) {
  if (payload) Object.assign(deviceFilters, payload);
  appliedDeviceFilters.value = snapshotDeviceFilters();
  devicePagination.value.page = 1;
}

function resetDeviceFilters() {
  Object.assign(deviceFilters, defaultDeviceFilters);
  applyDeviceFilters();
}

function toggleDeviceFilters() {
  isDeviceFilterVisible.value = !isDeviceFilterVisible.value;
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

  const headers = [
    "Name",
    "Serial Number",
    "Connection Key",
    "Status",
    "Location",
    "IP Address",
    "Last Update",
    "Updated By",
    "Note",
    "Last Heartbeat",
  ];
  const escapeValue = (value: string | number | null | undefined) => {
    const str = (value ?? "").toString().replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeValue).join(","),
    ...rows.map((row) =>
      [
        row.name,
        row.serialNumber,
        row.connectionKey,
        row.status,
        row.location,
        row.ipAddress,
        row.updatedAt,
        row.updatedBy,
        row.note,
        row.lastHeartbeat,
      ]
        .map(escapeValue)
        .join(",")
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
    `devices-${currentDeviceTab.value.label}-${timestamp}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  message.success("Devices exported.");
}

function formatDeviceStatus(status: DeviceRow["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadgeClass(status: DeviceRow["status"]) {
  const classes: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-amber-50 text-amber-700 border-amber-200",
    registered: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return classes[status] || "bg-gray-50 text-gray-700 border-gray-200";
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
    Math.ceil(total / devicePagination.value.perPage)
  );
  devicePagination.value.lastPage = lastPage;
  if (devicePagination.value.page > lastPage) {
    devicePagination.value.page = lastPage;
  }
}

watch(
  filteredDeviceRows,
  () => {
    recalculateDevicePagination();
  },
  { immediate: true }
);

watch(
  () => devicePagination.value.perPage,
  () => {
    devicePagination.value.page = 1;
    recalculateDevicePagination();
  }
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
</style>

<template>
  <section class="min-h-[100vh]">
    <a-tabs
      v-model:activeKey="activeMapTab"
      class="px-6 pt-4 custom-tabs"
    >
      <a-tab-pane
        v-for="tab in mapTabs"
        :key="tab.key"
        :tab="tab.label"
      >
        <div v-if="tab.key === activeMapTab" class="pb-2">
          <div class="bg-white rounded border border-slate-200 p-4 map-display">
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  {{ currentMapTab.label }} Overview
                </p>
                <p class="text-sm text-slate-600">
                  {{ mapSummary.total }} devices mapped across {{ currentMapTab.label.toLowerCase() }}.
                </p>
              </div>
              <div class="flex gap-3 text-xs">
                <div class="flex items-center gap-1 text-emerald-600">
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Healthy {{ mapSummary.online }}
                </div>
                <div class="flex items-center gap-1 text-amber-600">
                  <span class="h-2 w-2 rounded-full bg-amber-400"></span>
                  Attention {{ mapSummary.warning }}
                </div>
                <div class="flex items-center gap-1 text-rose-600">
                  <span class="h-2 w-2 rounded-full bg-rose-500"></span>
                  Offline {{ mapSummary.offline }}
                </div>
              </div>
            </div>
            <div class="mt-4 h-64 rounded-xl border border-slate-100 relative overflow-hidden">
              <div class="absolute inset-0 map-grid"></div>
              <div class="absolute inset-0 p-4 flex flex-wrap gap-3">
                <div
                  v-for="marker in highlightedRows"
                  :key="marker.id"
                  class="bg-white/80 backdrop-blur rounded-lg border border-slate-200 px-3 py-2 text-xs shadow-sm max-w-[180px]"
                >
                  <p class="font-semibold text-slate-700">
                    {{ marker.name }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {{ marker.location || "Unknown site" }}
                  </p>
                  <p class="text-[11px] text-slate-400 mt-1">
                    {{ marker.latitude || "Lat" }} / {{ marker.longitude || "Lon" }}
                  </p>
                  <p class="mt-1">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-semibold"
                      :class="statusChipClass(marker.status)"
                    >
                      {{ statusLabel(marker.status) }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
            <div
              :class="[
                'bg-white rounded border border-slate-200 overflow-hidden transition-all duration-200 w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
                { hidden: !isFilterVisible },
              ]"
            >
              <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
                  <p class="text-xs text-gray-500">Narrow the deployment list.</p>
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
                :fields="mapFilterFields"
                :model-value="filters"
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
                isFilterVisible ? 'flex-1' : 'max-w-7xl w-full mx-auto',
              ]"
              :is-loading="isLoading"
              :columns="mapTableColumns.length"
              :has-data="displayedRows.length > 0"
              :pagination="pagination"
              loading-text="Loading map devices..."
              @prev-page="prevPage"
              @next-page="nextPage"
              @change-per-page="changePerPage"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-700 text-xs">
                    {{ currentMapTab.label }}
                  </h3>
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
                      v-model="searchKeyword"
                      type="text"
                      placeholder="Search site, rack, note..."
                      class="pl-5 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-60 text-xs cursor-text"
                    />
                    <BootstrapIcon
                      name="search"
                      class="absolute left-1 top-1.5 h-3 w-3 text-gray-400"
                    />
                  </div>

                  <button
                    @click="refreshRows"
                    class="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs border border-gray-300"
                    :disabled="isLoading"
                  >
                    <BootstrapIcon
                      name="arrow-clockwise"
                      class="w-3 h-3 mr-1"
                      :class="{ 'animate-spin': isLoading }"
                    />
                    {{ isLoading ? "Refreshing..." : "Refresh" }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
                    :disabled="isLoading || !filteredRows.length"
                    @click="exportRows"
                  >
                    <BootstrapIcon name="file-earmark-arrow-down" class="w-3 h-3 mr-1" />
                    Export
                  </button>
                </div>
              </template>

              <template #head>
                <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
                  <th
                    v-for="column in mapTableColumns"
                    :key="column"
                    class="px-2 py-2 text-left font-medium text-gray-600"
                  >
                    {{ column }}
                  </th>
                </tr>
              </template>
              <template #default>
                <tr
                  v-for="row in displayedRows"
                  :key="row.id"
                  class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100 py-1"
                >
                  <td class="px-2 py-1 text-gray-800 align-top">
                    <p class="font-semibold text-xs">
                      {{ row.location || "Unassigned site" }}
                    </p>
                    <p class="text-[11px] text-gray-500 mt-1" v-if="row.note">
                      {{ row.note }}
                    </p>
                    <p class="text-[11px] text-gray-400 mt-1" v-else>
                      No notes recorded.
                    </p>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <div class="text-xs">
                      <span class="font-semibold">{{ row.latitude || "N/A" }}</span>
                      /
                      <span class="font-semibold">{{ row.longitude || "N/A" }}</span>
                    </div>
                    <p class="text-[11px] text-gray-500 mt-1">
                      Lat / Lon
                    </p>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <div class="font-semibold text-xs">{{ row.name }}</div>
                    <div class="text-[11px] text-gray-500 mt-1">
                      ID: {{ row.id }} - {{ row.serialNumber }}
                    </div>
                    <p class="text-[11px] text-gray-500 mt-1">
                      {{ row.connectionKey }}
                      <span v-if="row.connectionHint" class="text-gray-400">
                        - {{ row.connectionHint }}
                      </span>
                    </p>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border font-semibold"
                      :class="statusChipClass(row.status)"
                    >
                      {{ statusLabel(row.status) }}
                    </span>
                    <p v-if="row.lastHeartbeat" class="text-[11px] text-gray-500 mt-2">
                      Last ping: {{ row.lastHeartbeat }}
                    </p>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <div class="text-xs font-medium">
                      {{ row.ipAddress || "N/A" }}
                    </div>
                    <p class="text-[11px] text-gray-500 mt-1">
                      {{ row.connectionHint || "No connection hint" }}
                    </p>
                  </td>
                  <td class="px-2 py-1 text-gray-700 align-top">
                    <div>{{ row.updatedAt }}</div>
                    <div v-if="row.updatedBy" class="text-[11px] text-gray-500 mt-2">
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
                        class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="Locate"
                      >
                        <BootstrapIcon name="geo-alt" class="w-3.5 h-3.5" />
                        <span class="sr-only">Locate</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
              <template #empty>
                No deployments to display yet.
              </template>

              <template #footer>
                <span>Showing {{ displayedRows.length }} entries on this page.</span>
                <span>Total filtered: <span class="text-gray-600 font-medium">{{ filteredRows.length }}</span></span>
              </template>
            </DataBoxCard>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import type { Section, DeviceFilterState } from "@/types/devices-control";

type MapTabKey = "indoor" | "outdoor";
type MarkerStatus = "online" | "warning" | "offline";

type MapDeviceRow = {
  id: string;
  name: string;
  serialNumber: string;
  connectionKey: string;
  connectionHint?: string | null;
  location?: string | null;
  ipAddress?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
  note?: string | null;
  lastHeartbeat?: string | null;
  status: MarkerStatus;
  latitude?: string | null;
  longitude?: string | null;
};

type MapTab = {
  key: MapTabKey;
  label: string;
  rows: MapDeviceRow[];
};

defineProps<{ section: Section }>();

const indoorRows: MapDeviceRow[] = [
  {
    id: "IN-4401",
    name: "Enviro Sensor Pro",
    serialNumber: "ESP-4421",
    connectionKey: "esp-4421-0a8d",
    connectionHint: "Last handshake 2 minutes ago",
    location: "North Campus / Lab 4",
    ipAddress: "10.21.4.12",
    updatedAt: "Updated 5 minutes ago",
    updatedBy: "QA Ops",
    note: "Row B rack - humidity cluster",
    lastHeartbeat: "5 min ago",
    status: "online",
    latitude: "40.7128 N",
    longitude: "74.0060 W",
  },
  {
    id: "IN-4302",
    name: "Tracker Lite",
    serialNumber: "TL-0082",
    connectionKey: "tracker-lite-a4",
    connectionHint: "Pending approval workflow",
    location: "Pilot Fleet A4 / Indoor range",
    ipAddress: "10.21.4.21",
    updatedAt: "Updated 18 minutes ago",
    updatedBy: "Factory QA",
    note: "Checklist already returned by QA.",
    lastHeartbeat: "18 min ago",
    status: "warning",
    latitude: "40.7134 N",
    longitude: "74.0052 W",
  },
  {
    id: "IN-4203",
    name: "Gateway Core",
    serialNumber: "GC-7710",
    connectionKey: "gc-7710-main",
    connectionHint: "Waiting on firmware manifest",
    location: "Wave 7 / Factory mezzanine",
    ipAddress: null,
    updatedAt: "Updated 32 minutes ago",
    updatedBy: "Design team",
    note: "Missing the latest BOM file.",
    lastHeartbeat: "45 min ago",
    status: "warning",
    latitude: "40.7111 N",
    longitude: "74.0041 W",
  },
  {
    id: "IN-4104",
    name: "Edge Control Nano",
    serialNumber: "ECN-3301",
    connectionKey: "ecn-3301-lab",
    connectionHint: "Auto escalated by telemetry",
    location: "Lab Stage / Bay 6",
    ipAddress: "10.30.0.44",
    updatedAt: "Flagged 10 minutes ago",
    updatedBy: "Telemetry Bot",
    note: "Automated alert from rack vibration.",
    lastHeartbeat: "2 min ago",
    status: "online",
    latitude: "40.7139 N",
    longitude: "74.0078 W",
  },
  {
    id: "IN-4005",
    name: "Enviro Sensor Pro",
    serialNumber: "ESP-4418",
    connectionKey: "esp-4418-1b90",
    connectionHint: "MQTT with TLS",
    location: "Batch 11 / North Site",
    ipAddress: "10.21.3.8",
    updatedAt: "Approved 1 hour ago",
    updatedBy: "Ops Bot",
    note: "Synced with CMDB successfully.",
    lastHeartbeat: "12 min ago",
    status: "online",
    latitude: "40.7142 N",
    longitude: "74.0090 W",
  },
  {
    id: "IN-3906",
    name: "Tracker Lite",
    serialNumber: "TL-0065",
    connectionKey: "tracker-lite-a3",
    connectionHint: "Bound to staging cluster",
    location: "Pilot Fleet A3 / Basement",
    ipAddress: "10.21.3.21",
    updatedAt: "Approved 3 hours ago",
    updatedBy: "Warehouse",
    note: "Queued for warehouse release.",
    lastHeartbeat: "29 min ago",
    status: "online",
    latitude: "40.7120 N",
    longitude: "74.0085 W",
  },
];

const outdoorRows: MapDeviceRow[] = [
  {
    id: "OUT-5201",
    name: "Gateway Core",
    serialNumber: "GC-7800",
    connectionKey: "gc-7800-rooftop",
    connectionHint: "Stable LTE tunnel",
    location: "HQ Rooftop / Antenna array",
    ipAddress: "10.40.1.12",
    updatedAt: "Updated 12 minutes ago",
    updatedBy: "Field Ops",
    note: "Oversees north parking coverage.",
    lastHeartbeat: "12 min ago",
    status: "online",
    latitude: "41.8781 N",
    longitude: "87.6298 W",
  },
  {
    id: "OUT-5102",
    name: "Tracker Lite",
    serialNumber: "TL-0190",
    connectionKey: "tracker-lite-yard",
    connectionHint: "Waiting for paperwork review",
    location: "Logistics Yard / Dock 8",
    ipAddress: "10.42.0.18",
    updatedAt: "Updated 25 minutes ago",
    updatedBy: "QA Ops",
    note: "Awaiting compliance sign-off.",
    lastHeartbeat: "24 min ago",
    status: "warning",
    latitude: "41.8770 N",
    longitude: "87.6310 W",
  },
  {
    id: "OUT-5003",
    name: "Enviro Sensor Pro",
    serialNumber: "ESP-4500",
    connectionKey: "esp-4500-mast",
    connectionHint: "Signal degraded by weather",
    location: "South Campus / Weather mast",
    ipAddress: "10.44.2.2",
    updatedAt: "Updated 1 hour ago",
    updatedBy: "Maintenance",
    note: "Wind gust warnings active.",
    lastHeartbeat: "55 min ago",
    status: "warning",
    latitude: "41.8750 N",
    longitude: "87.6285 W",
  },
  {
    id: "OUT-4904",
    name: "Remote Power Relay",
    serialNumber: "RPR-2205",
    connectionKey: "rpr-2205-yard",
    connectionHint: "Bounced last ping",
    location: "Utility easement / Sector 3",
    ipAddress: null,
    updatedAt: "Updated 2 hours ago",
    updatedBy: "Energy Ops",
    note: "Crew scheduled for inspection.",
    lastHeartbeat: "2 hours ago",
    status: "offline",
    latitude: "41.8799 N",
    longitude: "87.6272 W",
  },
  {
    id: "OUT-4805",
    name: "Enviro Sensor Pro",
    serialNumber: "ESP-4405",
    connectionKey: "esp-4405-greenhouse",
    connectionHint: "Last handshake 8 minutes ago",
    location: "Greenhouse perimeter",
    ipAddress: "10.46.0.22",
    updatedAt: "Updated 15 minutes ago",
    updatedBy: "Agri Ops",
    note: "Monitoring humidity along walkway.",
    lastHeartbeat: "8 min ago",
    status: "online",
    latitude: "41.8808 N",
    longitude: "87.6261 W",
  },
];

const mapTabs: MapTab[] = [
  {
    key: "indoor",
    label: "Indoor Map",
    rows: indoorRows,
  },
  {
    key: "outdoor",
    label: "Outdoor Map",
    rows: outdoorRows,
  },
];

const defaultMapTab = mapTabs[0];

if (!defaultMapTab) {
  throw new Error("At least one map tab must be configured.");
}

const mapFilterFields: FilterFieldRow[] = [
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
      placeholder: "North Campus",
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

const mapTableColumns = [
  "Location",
  "Coordinates",
  "Device",
  "Status",
  "Network",
  "Last Update",
  "Action",
];

const activeMapTab = ref<MapTabKey>(defaultMapTab.key);
const isFilterVisible = ref(true);
const searchKeyword = ref("");
const isLoading = ref(false);
const pagination = ref({
  page: 1,
  perPage: 5,
  lastPage: 1,
  total: 0,
});

const defaultFilters: DeviceFilterState = {
  name: "",
  serialNumber: "",
  connectionKey: "",
  location: "",
  ipAddress: "",
};

const filters = reactive<DeviceFilterState>({ ...defaultFilters });
const appliedFilters = ref(snapshotFilters());

const currentMapTab = computed<MapTab>(() => {
  const tab = mapTabs.find((entry) => entry.key === activeMapTab.value);
  return tab ?? defaultMapTab;
});

const filteredRows = computed<MapDeviceRow[]>(() => filterRows(currentMapTab.value.rows));
const displayedRows = computed<MapDeviceRow[]>(() => {
  const start = (pagination.value.page - 1) * pagination.value.perPage;
  const end = start + pagination.value.perPage;
  return filteredRows.value.slice(start, end);
});

const mapSummary = computed(() => {
  const rows = filteredRows.value;
  const counts = rows.reduce(
    (acc, row) => {
      if (row.status === "online") acc.online += 1;
      else if (row.status === "warning") acc.warning += 1;
      else acc.offline += 1;
      return acc;
    },
    { online: 0, warning: 0, offline: 0 }
  );

  return {
    total: rows.length,
    online: counts.online,
    warning: counts.warning,
    offline: counts.offline,
  };
});

const highlightedRows = computed<MapDeviceRow[]>(() => filteredRows.value.slice(0, 4));

let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
}

function handleFilterModelUpdate(value: Record<string, string>) {
  (Object.keys(defaultFilters) as (keyof DeviceFilterState)[]).forEach((key) => {
    filters[key] = value[key] ?? "";
  });
}

function snapshotFilters() {
  return {
    name: filters.name.trim(),
    serialNumber: filters.serialNumber.trim(),
    connectionKey: filters.connectionKey.trim(),
    location: filters.location.trim(),
    ipAddress: filters.ipAddress.trim(),
  };
}

function applyFilters(payload?: Record<string, string>) {
  if (payload) {
    handleFilterModelUpdate(payload);
  }
  appliedFilters.value = snapshotFilters();
  pagination.value.page = 1;
}

function resetFilters() {
  Object.assign(filters, defaultFilters);
  applyFilters();
}

function filterRows(rows: MapDeviceRow[]) {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const normalizedName = appliedFilters.value.name.toLowerCase();
  const normalizedSerial = appliedFilters.value.serialNumber.toLowerCase();
  const normalizedConnection = appliedFilters.value.connectionKey.toLowerCase();
  const normalizedLocation = appliedFilters.value.location.toLowerCase();
  const normalizedIp = appliedFilters.value.ipAddress.toLowerCase();

  return rows.filter((row) => {
    if (keyword) {
      const haystack = [
        row.name,
        row.serialNumber,
        row.connectionKey,
        row.location,
        row.ipAddress,
        row.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (normalizedName && !row.name.toLowerCase().includes(normalizedName)) {
      return false;
    }

    if (normalizedSerial && !(row.serialNumber || "").toLowerCase().includes(normalizedSerial)) {
      return false;
    }

    if (
      normalizedConnection &&
      !(row.connectionKey || "").toLowerCase().includes(normalizedConnection)
    ) {
      return false;
    }

    if (
      normalizedLocation &&
      !(row.location || "").toLowerCase().includes(normalizedLocation)
    ) {
      return false;
    }

    if (normalizedIp && !(row.ipAddress || "").toLowerCase().includes(normalizedIp)) {
      return false;
    }

    return true;
  });
}

function refreshRows() {
  if (isLoading.value) return;
  isLoading.value = true;
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  refreshTimeout = setTimeout(() => {
    isLoading.value = false;
  }, 800);
}

function exportRows() {
  if (!import.meta.client) return;
  const rows = filteredRows.value;
  if (!rows.length) {
    message.warning("No map devices to export.");
    return;
  }

  const headers = [
    "Name",
    "Serial Number",
    "Connection Key",
    "Location",
    "IP Address",
    "Last Update",
    "Updated By",
    "Note",
    "Last Heartbeat",
    "Status",
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
        row.location,
        row.ipAddress,
        row.updatedAt,
        row.updatedBy,
        row.note,
        row.lastHeartbeat,
        row.status,
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
    `map-${currentMapTab.value.label.toLowerCase()}-${timestamp}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  message.success("Map devices exported.");
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

function statusChipClass(status: MarkerStatus) {
  if (status === "online") return "bg-emerald-50 border-emerald-200 text-emerald-600";
  if (status === "warning") return "bg-amber-50 border-amber-200 text-amber-600";
  return "bg-rose-50 border-rose-200 text-rose-600";
}

function statusLabel(status: MarkerStatus) {
  if (status === "online") return "Online";
  if (status === "warning") return "Attention";
  return "Offline";
}

watch(filteredRows, () => {
  recalcPagination();
}, { immediate: true });

watch(
  () => pagination.value.perPage,
  () => {
    pagination.value.page = 1;
    recalcPagination();
  }
);

watch(searchKeyword, () => {
  pagination.value.page = 1;
});

watch(activeMapTab, () => {
  pagination.value.page = 1;
  recalcPagination();
});

function recalcPagination() {
  const total = filteredRows.value.length;
  pagination.value.total = total;
  const lastPage = Math.max(1, Math.ceil(total / pagination.value.perPage));
  pagination.value.lastPage = lastPage;
  if (pagination.value.page > lastPage) {
    pagination.value.page = lastPage;
  }
}

onBeforeUnmount(() => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
});
</script>

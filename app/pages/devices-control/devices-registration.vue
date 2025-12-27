<template>
  <div class="min-h-screen flex bg-slate-50">
    <DevicesControlSidebar
      :sections="sections"
      v-model:activeTab="activeTab"
      :is-sidebar-collapsed="isSidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
    />

    <section class="flex-1 flex flex-col">
      <main class="flex-1 bg-slate-50 overflow-y-auto">
        <component
          v-if="activeTab !== 'devices-registration' && activeSectionComponent"
          :is="activeSectionComponent"
          :section="activeSection"
        />

        <div
          v-else
          class="min-h-[100vh]"
        >
          <a-tabs
            v-model:activeKey="activeDeviceTab"
            class="px-6 pt-4 custom-tabs"
          >
            <a-tab-pane
              v-for="tab in deviceTabs"
              :key="tab.key"
              :tab="tab.label"
            >
              <div v-if="tab.key === activeDeviceTab" class="pb-2">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div
                    :class="[
                      'bg-white rounded border border-slate-200 overflow-hidden transition-all duration-200 w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
                      { hidden: !isDeviceFilterVisible },
                    ]"
                  >
                    <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
                        <p class="text-xs text-gray-500">Refine the device list.</p>
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
                    :columns="7"
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
                          {{ currentDeviceTab.label }} Devices
                        </h3>
                        <button
                          type="button"
                          class="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-0.5"
                          @click="toggleDeviceFilters"
                        >
                          {{ isDeviceFilterVisible ? "Hide Filters" : "Show Filters" }}
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
                          <BootstrapIcon name="file-earmark-arrow-down" class="w-3 h-3 mr-1" />
                          Export
                        </button>
                      </div>
                    </template>

                    <template #head>
                      <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
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
                        class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100 py-1" 
                      >
                        <td class="px-2 py-1 whitespace-nowrap text-gray-800 align-top">
                          <div class="font-semibold text-xs">{{ row.name }}</div>
                          <div class="text-[11px] text-gray-500 mt-2">ID: {{ row.id }}</div>
                        </td>
                        <td class="px-2 py-1 text-gray-700 align-top">
                          <p class="text-xs font-medium">{{ row.serialNumber }}</p>
                        </td>
                        <td class="px-2 py-1 text-gray-700 leading-5 wrap-break-words align-top">
                          <p class="text-xs font-semibold text-gray-800">
                            {{ row.connectionKey }}
                          </p>
                          <p v-if="row.connectionHint" class="text-[11px] text-gray-500 mt-2">
                            {{ row.connectionHint }}
                          </p>
                        </td>
                        <td class="px-2 py-1 text-gray-700 leading-5 wrap-break-words align-top">
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
                          <div v-if="row.lastHeartbeat" class="text-[11px] text-gray-500 mt-2">
                            Last ping: {{ row.lastHeartbeat }}
                          </div>
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
                              class="w-8 h-8 inline-flex items-center justify-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              title="Approve device"
                            >
                              <BootstrapIcon name="check-circle" class="w-3.5 h-3.5" />
                              <span class="sr-only">Approve</span>
                            </button>
        
                          </div>
                        </td>
                      </tr>
                    </template>
                    <template #empty>
                      No devices to display yet.
                    </template>

                    <template #footer>
                      <span>Showing {{ displayedDeviceRows.length }} entries on this page.</span>
                      <span>Total filtered: <span class="text-gray-600 font-medium">{{ filteredDeviceRows.length }}</span></span>
                    </template>
                  </DataBoxCard>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type Component,
} from "vue";
import {
  ChartBarIcon,
  CpuChipIcon,
  MapIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
} from "@heroicons/vue/24/outline";
import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import DevicesControlSidebar from "@/components/devices-control/layouts/DevicesControlSidebar.vue";
import DashboardSection from "@/components/devices-control/sections/DashboardSection.vue";
import DevicesControlSection from "@/components/devices-control/sections/DevicesControlSection.vue";
import MapSection from "@/components/devices-control/sections/MapSection.vue";
import ScenarioSection from "@/components/devices-control/sections/ScenarioSection.vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import type {
  DeviceFilterState,
  DeviceRow,
  DeviceTab,
  DeviceTabKey,
  Section,
} from "@/types/devices-control";

const ACTIVE_SECTION_STORAGE_KEY = "devices-registration-active-section";

const sections: Section[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "High-level intake snapshot",
    icon: ChartBarIcon,
    headline: "Track the overall registration throughput.",
    body: "Visualize how many devices entered, progressed, or stalled during the onboarding pipeline. Add charts, tables, or status widgets to this canvas without touching the sidebar layout.",
    cards: [
      {
        kicker: "Status",
        title: "Current registration health",
        description:
          "Display aggregated success rate, SLAs, and trendlines as soon as metrics are ready.",
      },
      {
        kicker: "Action",
        title: "Prioritize blocked batches",
        description:
          "Highlight the batches that exceed their processing window so your team can intervene early.",
      },
    ],
  },
  {
    id: "devices-registration",
    label: "Devices Registration",
    description: "Approval pipeline at a glance",
    icon: CpuChipIcon,
    headline: "Monitor the device approval backlog.",
    body: "Use the tabs to quickly pivot between pending, approved, or the full list of devices.",
    cards: [
      {
        kicker: "Idea",
        title: "Pre-provision firmware",
        description: "Trigger the firmware flashing queue from here when batches arrive.",
      },
      {
        kicker: "Idea",
        title: "Create exception ticket",
        description: "Open a compliance or quality ticket for any failed hardware while staying on this page.",
      },
    ],
  },
  {
    id: "devices-control",
    label: "Devices Control",
    description: "Operational command",
    icon: RectangleGroupIcon,
    headline: "Control device behavior from one console.",
    body: "Use this space for active monitoring widgets, quick actions, and summaries of control signals pushed to devices.",
    cards: [
      {
        kicker: "Status",
        title: "Live control plane",
        description: "Outline the command center widgets you need for approvals, remote actions, or throttling.",
      },
      {
        kicker: "Workflow",
        title: "Automation readiness",
        description: "Summarize the current automation queues or actions awaiting operator input.",
      },
    ],
  },
  {
    id: "map",
    label: "Map",
    description: "Deployment geography",
    icon: MapIcon,
    headline: "Track devices across physical locations.",
    body: "Associate every registered device with its warehouse, customer region, or manufacturing batch to spot gaps instantly.",
    cards: [
      {
        kicker: "Coverage",
        title: "Regional inventory",
        description: "Highlight which regions are saturated or lacking devices to rebalance capacity.",
      },
      {
        kicker: "Escalation",
        title: "Location risks",
        description: "Call out locations that exceed SLA or environmental thresholds for faster field response.",
      },
    ],
  },
  {
    id: "scenario",
    label: "Scenario",
    description: "Playbooks & automation",
    icon: Squares2X2Icon,
    headline: "Model operational scenarios.",
    body: "Capture the workflows and automation you need for provisioning, remote recovery, and compliance.",
    cards: [
      {
        kicker: "Playbook",
        title: "Provisioning blueprint",
        description: "Define the steps and owners for onboarding new hardware batches safely.",
      },
      {
        kicker: "Automation",
        title: "Recovery actions",
        description: "Document scripts and flows to self-heal devices when alerts trigger.",
      },
    ],
  },
];

const sectionComponentMap: Record<string, Component> = {
  dashboard: DashboardSection,
  "devices-control": DevicesControlSection,
  map: MapSection,
  scenario: ScenarioSection,
};

const pendingRows: DeviceRow[] = [
  {
    id: "GW-1101",
    name: "Enviro Sensor Pro",
    serialNumber: "ESP-4421",
    connectionKey: "esp-4421-0a8d",
    connectionHint: "Last handshake 2 minutes ago",
    location: "Batch 12 / North Site",
    ipAddress: "10.21.4.12",
    updatedAt: "Updated 5 minutes ago",
    updatedBy: "QA Ops",
    note: "New device waiting for paperwork review.",
    lastHeartbeat: "5 min ago",
  },
  {
    id: "GW-1102",
    name: "Tracker Lite",
    serialNumber: "TL-0082",
    connectionKey: "tracker-lite-a4",
    connectionHint: "Pending approval workflow",
    location: "Pilot Fleet A4",
    ipAddress: "10.21.4.21",
    updatedAt: "Updated 18 minutes ago",
    updatedBy: "Factory QA",
    note: "Checklist already returned by QA.",
    lastHeartbeat: "18 min ago",
  },
  {
    id: "GW-1103",
    name: "Gateway Core",
    serialNumber: "GC-7710",
    connectionKey: "gc-7710-main",
    connectionHint: "Waiting on firmware manifest",
    location: "Wave 7 / Factory A",
    ipAddress: null,
    updatedAt: "Updated 32 minutes ago",
    updatedBy: "Design team",
    note: "Missing the latest BOM file.",
    lastHeartbeat: "45 min ago",
  },
];

const approvedRows: DeviceRow[] = [
  {
    id: "GW-1088",
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
  },
  {
    id: "GW-1083",
    name: "Tracker Lite",
    serialNumber: "TL-0065",
    connectionKey: "tracker-lite-a3",
    connectionHint: "Bound to staging cluster",
    location: "Pilot Fleet A3",
    ipAddress: "10.21.3.21",
    updatedAt: "Approved 3 hours ago",
    updatedBy: "Warehouse",
    note: "Queued for warehouse release.",
    lastHeartbeat: "29 min ago",
  },
  {
    id: "GW-1077",
    name: "Gateway Core",
    serialNumber: "GC-7708",
    connectionKey: "gc-7708-edge",
    connectionHint: "Provisioned with API token",
    location: "Wave 6 / Factory A",
    ipAddress: "10.19.7.5",
    updatedAt: "Approved yesterday",
    updatedBy: "Supervisor",
    note: "Anti-counterfeit tags installed.",
    lastHeartbeat: "1 hour ago",
  },
];

const deviceTabs: DeviceTab[] = [
  {
    key: "pending",
    label: "Pending",
    rows: pendingRows,
  },
  {
    key: "approved",
    label: "Approved",
    rows: approvedRows,
  },
  {
    key: "all",
    label: "All",
    rows: [
      ...pendingRows,
      ...approvedRows,
      {
        id: "GW-1099",
        name: "Edge Control Nano",
        serialNumber: "ECN-3301",
        connectionKey: "ecn-3301-lab",
        connectionHint: "Auto escalated by telemetry",
        location: "Lab Stage / Bay 6",
        ipAddress: "10.30.0.44",
        updatedAt: "Flagged 10 minutes ago",
        updatedBy: "Telemetry Bot",
        note: "Automatically escalated by telemetry.",
        lastHeartbeat: "2 min ago",
      },
    ],
  },
];

const deviceFilterFields: FilterFieldRow[] = [
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

const defaultSection = sections[0];
const defaultDeviceTab = deviceTabs[0];

if (!defaultSection) {
  throw new Error("No sections configured for devices-registration view.");
}

if (!defaultDeviceTab) {
  throw new Error("No device tabs configured for devices-registration view.");
}

const activeTab = ref(defaultSection.id);
const isSidebarCollapsed = ref(true);
const helloMessage = ref("");
const authStore = useAuthStore();
const activeDeviceTab = ref<DeviceTabKey>(defaultDeviceTab.key);
const isDeviceFilterVisible = ref(true);
const deviceSearchKeyword = ref("");
const isDeviceLoading = ref(false);
const devicePagination = ref({
  page: 1,
  perPage: 5,
  lastPage: 1,
  total: 0,
});
const deviceTableColumns = [
  "Name",
  "Serial Number",
  "Connection Key",
  "Location",
  "IP Address",
  "Last Update",
  "Action",
];
const activeSection = computed<Section>(
  () => sections.find((section) => section.id === activeTab.value) ?? defaultSection
);
const activeSectionComponent = computed<Component | undefined>(
  () => sectionComponentMap[activeTab.value] ?? sectionComponentMap[defaultSection.id]
);
const defaultDeviceFilters: DeviceFilterState = {
  name: "",
  serialNumber: "",
  connectionKey: "",
  location: "",
  ipAddress: "",
};
const deviceFilters = reactive<DeviceFilterState>({
  ...defaultDeviceFilters,
});
const appliedDeviceFilters = ref(snapshotDeviceFilters());
const currentDeviceTab = computed(
  () =>
    deviceTabs.find((tab) => tab.key === activeDeviceTab.value) ?? defaultDeviceTab
);
const currentDeviceRows = computed<DeviceRow[]>(() => currentDeviceTab.value.rows);
const filteredDeviceRows = computed<DeviceRow[]>(() =>
  filterDeviceRows(currentDeviceRows.value)
);
const displayedDeviceRows = computed<DeviceRow[]>(() => {
  const start = (devicePagination.value.page - 1) * devicePagination.value.perPage;
  const end = start + devicePagination.value.perPage;
  return filteredDeviceRows.value.slice(start, end);
});
let deviceRefreshTimeout: ReturnType<typeof setTimeout> | null = null;

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function filterDeviceRows(rows: DeviceRow[]) {
  const keyword = deviceSearchKeyword.value.trim().toLowerCase();
  const normalizedName = appliedDeviceFilters.value.name.trim().toLowerCase();
  const normalizedSerial = appliedDeviceFilters.value.serialNumber.trim().toLowerCase();
  const normalizedConnection = appliedDeviceFilters.value.connectionKey.trim().toLowerCase();
  const normalizedLocation = appliedDeviceFilters.value.location.trim().toLowerCase();
  const normalizedIp = appliedDeviceFilters.value.ipAddress.trim().toLowerCase();

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

    if (
      normalizedSerial &&
      !(row.serialNumber || "").toLowerCase().includes(normalizedSerial)
    ) {
      return false;
    }

    if (
      normalizedConnection &&
      !(row.connectionKey || "").toLowerCase().includes(normalizedConnection)
    ) {
      return false;
    }

    if (normalizedLocation && !(row.location || "").toLowerCase().includes(normalizedLocation)) {
      return false;
    }

    if (normalizedIp && !(row.ipAddress || "").toLowerCase().includes(normalizedIp)) {
      return false;
    }

    return true;
  });
}

function snapshotDeviceFilters() {
  return {
    name: deviceFilters.name.trim(),
    serialNumber: deviceFilters.serialNumber.trim(),
    connectionKey: deviceFilters.connectionKey.trim(),
    location: deviceFilters.location.trim(),
    ipAddress: deviceFilters.ipAddress.trim(),
  };
}

function handleDeviceFilterModelUpdate(value: Record<string, string>) {
  (Object.keys(defaultDeviceFilters) as (keyof DeviceFilterState)[]).forEach((key) => {
    deviceFilters[key] = value[key] ?? "";
  });
}

function applyDeviceFilters(payload?: Record<string, string>) {
  if (payload) {
    handleDeviceFilterModelUpdate(payload);
  }
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
  link.setAttribute("download", `devices-${currentDeviceTab.value.label}-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  message.success("Devices exported.");
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
  const lastPage = Math.max(1, Math.ceil(total / devicePagination.value.perPage));
  devicePagination.value.lastPage = lastPage;
  if (devicePagination.value.page > lastPage) {
    devicePagination.value.page = lastPage;
  }
}

watch(filteredDeviceRows, () => {
  recalculateDevicePagination();
}, { immediate: true });

watch(activeTab, (value) => {
  if (!import.meta.client) return;
  window.localStorage.setItem(ACTIVE_SECTION_STORAGE_KEY, value);
});

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

watch(activeDeviceTab, () => {
  devicePagination.value.page = 1;
});

onMounted(() => {
  if (!import.meta.client) return;
  const storedSection = window.localStorage.getItem(ACTIVE_SECTION_STORAGE_KEY);
  if (storedSection && sections.some((section) => section.id === storedSection)) {
    activeTab.value = storedSection;
  }
});

onMounted(async () => {
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    console.warn("Missing authorization token, skip hello message fetch.");
    return;
  }

  try {
    const response = await fetch(
      `${apiConfig.controlModule}/devices-control/devices-registration/test-jwt`,
      {
        headers: {
          Authorization: authorization,
        },
      }
    );

    if (!response.ok) {
      console.error("Unable to load hello message", await response.text());
      return;
    }

    const payload = await response.json();
    helloMessage.value = typeof payload.message === "string" ? payload.message : "";
  } catch (error) {
    console.error("Unable to load hello message", error);
  }
});

onBeforeUnmount(() => {
  if (deviceRefreshTimeout) {
    clearTimeout(deviceRefreshTimeout);
  }
});
</script>

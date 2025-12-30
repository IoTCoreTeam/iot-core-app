<template>
<section class="min-h-[100vh]">
  <div class="flex flex-col gap-4 lg:flex-row lg:items-start py-4">
    <div
      :class="[
        'bg-white rounded border border-slate-200 overflow-hidden transition-all duration-200 w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
        { hidden: !isFilterVisible },
      ]"
    >
        <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
            <p class="text-xs text-gray-500">Limit the devices log list.</p>
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
          :fields="logFilterFields"
          :model-value="logFilters"
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
        :columns="5"
        :is-loading="false"
        :pagination="logPagination"
        :has-data="displayedLogs.length > 0"
        loading-text="Loading logs..."
        @prev-page="prevLogPage"
        @next-page="nextLogPage"
        @change-per-page="changeLogPerPage"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-gray-700 text-xs">Devices Log</h3>
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
                placeholder="Search device, message..."
                class="pl-5 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-60 text-xs cursor-text"
              />
              <BootstrapIcon
                name="search"
                class="absolute left-1 top-1.5 h-3 w-3 text-gray-400"
              />
            </div>
            <button
              type="button"
              class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs"
              :disabled="!displayedLogs.length"
              @click="exportLogs"
            >
              <BootstrapIcon name="download" class="w-3 h-3 mr-1" />
              Export
            </button>
          </div>
        </template>

        <template #head>
          <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
            <th class="px-2 py-2 text-left font-medium">Device</th>
            <th class="px-2 py-2 text-left font-medium">Event</th>
            <th class="px-2 py-2 text-left font-medium">Severity</th>
            <th class="px-2 py-2 text-left font-medium">Timestamp</th>
            <th class="px-2 py-2 text-left font-medium">Message</th>
          </tr>
        </template>

        <template #default>
          <tr
            v-for="log in displayedLogs"
            :key="log.id"
            class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100 py-1"
          >
            <td class="px-2 py-2 text-gray-800">
              <div class="font-semibold text-xs">{{ log.deviceName }}</div>
              <div class="text-[11px] text-gray-500 mt-1">{{ log.deviceId }}</div>
            </td>
            <td class="px-2 py-2 text-gray-700">
              <div class="text-xs font-semibold">{{ log.eventType }}</div>
              <p class="text-[11px] text-gray-500 mt-1">{{ log.scope }}</p>
            </td>
            <td class="px-2 py-2 text-gray-700">
              <span
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
                :class="severityBadgeClass(log.severity)"
              >
                {{ log.severity }}
              </span>
            </td>
            <td class="px-2 py-2 text-gray-700">
              <div class="text-xs font-medium">{{ log.timestamp }}</div>
              <p class="text-[11px] text-gray-500 mt-1">By {{ log.actor }}</p>
            </td>
            <td class="px-2 py-2 text-gray-700">{{ log.message }}</td>
          </tr>
        </template>

        <template #empty>
          No logs available for these filters.
        </template>

        <template #footer>
          <span>Showing {{ displayedLogs.length }} entries on this page.</span>
          <span>Total filtered: <span class="text-gray-600 font-medium">{{ filteredLogs.length }}</span></span>
        </template>
      </DataBoxCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";

type DeviceLogEntry = {
  id: string;
  deviceId: string;
  deviceName: string;
  eventType: string;
  scope: string;
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  actor: string;
};

const deviceLogs: DeviceLogEntry[] = [
  {
    id: "log-1001",
    deviceId: "GW-1101",
    deviceName: "Enviro Sensor Pro",
    eventType: "Firmware Update",
    scope: "Gateway",
    severity: "info",
    message: "Firmware package v2.0.1 deployed successfully.",
    timestamp: "2025-12-29 13:05",
    actor: "OTA Service",
  },
  {
    id: "log-1002",
    deviceId: "TL-0082",
    deviceName: "Tracker Lite",
    eventType: "Configuration Change",
    scope: "Node",
    severity: "warning",
    message: "Connection key rotated; awaiting confirmation.",
    timestamp: "2025-12-29 12:47",
    actor: "QA Ops",
  },
  {
    id: "log-1003",
    deviceId: "CTRL-2101",
    deviceName: "Process Controller X",
    eventType: "Control Override",
    scope: "Controller",
    severity: "critical",
    message: "Manual override engaged for production line B.",
    timestamp: "2025-12-29 12:30",
    actor: "Manufacturing Admin",
  },
  {
    id: "log-1004",
    deviceId: "SNS-3011",
    deviceName: "Atmos Sensor Mini",
    eventType: "Alert",
    scope: "Sensor",
    severity: "warning",
    message: "Humidity reading exceeded calibrated baseline.",
    timestamp: "2025-12-29 12:05",
    actor: "Telemetry Bot",
  },
  {
    id: "log-1005",
    deviceId: "GW-1099",
    deviceName: "Edge Control Nano",
    eventType: "Heartbeat",
    scope: "Gateway",
    severity: "info",
    message: "Standard heartbeat received from field lab.",
    timestamp: "2025-12-29 11:55",
    actor: "Monitoring Core",
  },
];

const logFilterFields: FilterFieldRow[] = [
  [
    {
      key: "deviceName",
      label: "Device Name",
      type: "text",
      placeholder: "Enviro Sensor Pro",
    },
  ],
  [
    {
      key: "eventType",
      label: "Event Type",
      type: "text",
      placeholder: "Firmware Update",
    },
  ],
  [
    {
      key: "severity",
      label: "Severity",
      type: "select",
      options: [
        { label: "All", value: "" },
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
        { label: "Critical", value: "critical" },
      ],
    },
  ],
];

const defaultFilters = {
  deviceName: "",
  eventType: "",
  severity: "",
};

const logFilters = reactive({ ...defaultFilters });
const appliedFilters = ref({ ...defaultFilters });
const isFilterVisible = ref(true);
const searchKeyword = ref("");
const logPagination = ref({
  page: 1,
  perPage: 5,
  lastPage: 1,
  total: deviceLogs.length,
});

const filteredLogs = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return deviceLogs.filter((entry) => {
    if (appliedFilters.value.deviceName && !entry.deviceName.toLowerCase().includes(appliedFilters.value.deviceName.toLowerCase())) {
      return false;
    }
    if (appliedFilters.value.eventType && !entry.eventType.toLowerCase().includes(appliedFilters.value.eventType.toLowerCase())) {
      return false;
    }
    if (appliedFilters.value.severity && entry.severity !== appliedFilters.value.severity) {
      return false;
    }
    if (keyword) {
      const haystack = `${entry.deviceName} ${entry.deviceId} ${entry.eventType} ${entry.scope} ${entry.message}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
});

const displayedLogs = computed(() => {
  const start = (logPagination.value.page - 1) * logPagination.value.perPage;
  return filteredLogs.value.slice(start, start + logPagination.value.perPage);
});

function handleFilterModelUpdate(value: Record<string, string>) {
  Object.assign(logFilters, value);
}

function applyFilters(payload?: Record<string, string>) {
  if (payload) {
    Object.assign(logFilters, payload);
  }
  appliedFilters.value = {
    deviceName: logFilters.deviceName.trim(),
    eventType: logFilters.eventType.trim(),
    severity: logFilters.severity.trim(),
  };
  logPagination.value.page = 1;
  recalcPagination();
}

function resetFilters() {
  Object.assign(logFilters, defaultFilters);
  applyFilters();
}

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
}

function exportLogs() {
  if (!import.meta.client || !filteredLogs.value.length) return;
  const headers = ["Device", "Event", "Severity", "Timestamp", "Actor", "Message"];
  const csvRows = [
    headers.join(","),
    ...filteredLogs.value.map((entry) =>
      [
        entry.deviceName,
        entry.eventType,
        entry.severity,
        entry.timestamp,
        entry.actor,
        `"${entry.message.replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ];
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "devices-log.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function severityBadgeClass(severity: DeviceLogEntry["severity"]) {
  const classes: Record<DeviceLogEntry["severity"], string> = {
    info: "bg-slate-100 text-slate-600 border-slate-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return classes[severity];
}

function prevLogPage() {
  if (logPagination.value.page > 1) {
    logPagination.value.page -= 1;
  }
}

function nextLogPage() {
  if (logPagination.value.page < logPagination.value.lastPage) {
    logPagination.value.page += 1;
  }
}

function changeLogPerPage(value: number) {
  if (value <= 0) return;
  logPagination.value.perPage = value;
  logPagination.value.page = 1;
  recalcPagination();
}

function recalcPagination() {
  const total = filteredLogs.value.length;
  logPagination.value.total = total;
  logPagination.value.lastPage = Math.max(1, Math.ceil(total / logPagination.value.perPage));
  if (logPagination.value.page > logPagination.value.lastPage) {
    logPagination.value.page = logPagination.value.lastPage;
  }
}

watch(filteredLogs, () => {
  recalcPagination();
}, { immediate: true });

watch(searchKeyword, () => {
  logPagination.value.page = 1;
});
</script>

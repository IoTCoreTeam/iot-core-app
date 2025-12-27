<template>
  <div class="w-full min-h-[80vh] p-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
      <!-- Filters sidebar -->
      <div
        :class="[
          'bg-white shadow-sm rounded border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-sm w-full lg:w-64 shrink-0 h-fit lg:sticky lg:top-4',
          { hidden: !isFilterVisible },
        ]"
      >
        <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h4 class="text-xs font-semibold text-gray-700">Filters</h4>
            <p class="text-xs text-gray-500">Refine the log results.</p>
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
          :fields="systemFilterFields"
          :model-value="advancedFilters"
          :is-loading="isLoading"
          apply-label="Apply"
          reset-label="Reset"
          @update:modelValue="handleAdvancedFilterModelUpdate"
          @apply="applyAdvancedFilters"
          @reset="resetAdvancedFilters"
        />
      </div>

      <!-- Logs table -->
      <DataBoxCard
        :class="[
          'lg:self-start',
          isFilterVisible ? 'flex-1' : 'max-w-7xl w-full mx-auto',
        ]"
        :is-loading="isLoading"
        :pagination="pagination"
        :has-data="displayedLogs.length > 0"
        :columns="7"
        loading-text="Loading logs..."
        @prev-page="prevPage"
        @next-page="nextPage"
        @change-per-page="changePerPage"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-gray-700 text-xs">
              {{ title || "System Logs" }}
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
                placeholder="Search message, device, source..."
                class="pl-5 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white w-60 text-xs cursor-text"
              />
              <BootstrapIcon
                name="search"
                class="absolute left-1 top-1.5 h-3 w-3 text-gray-400"
              />
            </div>

            <button
              @click="refreshLogs"
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
              :disabled="isLoading || !logs.length"
              @click="exportLogs"
            >
              <BootstrapIcon name="file-earmark-arrow-down" class="w-3 h-3 mr-1" />
              Export
            </button>
          </div>
        </template>

        <template #head>
          <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
            <th class="px-2 py-2 text-left font-medium text-gray-600 ">
              Timestamp
            </th>
            <th class="px-2 py-2 text-left font-medium text-gray-600">Level</th>
            <th class="px-2 py-2 text-left font-medium text-gray-600">
              Source / Action
            </th>
            <th class="px-2 py-2 text-left font-medium text-gray-600 ">
              Message
            </th>
            <th class="px-2 py-2 text-left font-medium text-gray-600 ">
              Actor
            </th>
            <th class="px-2 py-2 text-left font-medium text-gray-600">
              Origin
            </th>
            <th class="px-2 py-2 text-center font-medium text-gray-600">
              Detail
            </th>
          </tr>
        </template>

        <template #default>
          <tr
            v-for="log in displayedLogs"
            :key="log.id"
            class="hover:bg-gray-50 transition-colors text-xs align-top border-b border-gray-100"
          >
            <td class="px-2 py-1 whitespace-nowrap text-gray-600 align-top">
              <div>{{ formatTimestamp(log.createdAt) }}</div>
              <div class="text-[11px] text-gray-400">#{{ log.id }}</div>
            </td>
            <td class="px-2 py-1 align-top">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide"
                :class="levelBadgeClass(log.level)"
              >
                {{ (log.level || "info").toUpperCase() }}
              </span>
            </td>
            <td class="px-2 py-1 align-top">
              <div class="text-gray-800 font-medium leading-5 text-xs">
                {{ log.source || "Unknown source" }}
              </div>
              <div v-if="log.tags?.length" class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="tag in log.tags"
                  :key="tag"
                  class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide"
                >
                  {{ tag }}
                </span>
              </div>
            </td>
            <td class="px-2 py-1 text-gray-700 leading-5 wrap-break-words align-top">
              <p class="text-xs text-gray-800 leading-5">
                {{ log.message }}
              </p>
              <p
                v-if="metadataPreview(log.metadata)"
                class="text-[11px] text-gray-500 mt-2"
              >
                {{ metadataPreview(log.metadata) }}
              </p>
            </td>
            <td class="px-2 py-1 align-top">
              <div class="text-gray-800 font-medium">
                {{ log.actor || "System" }}
              </div>
              <div v-if="log.actorEmail" class="text-[11px] text-gray-500">
                {{ log.actorEmail }}
              </div>
              <div v-if="log.userId" class="text-[11px] text-gray-500">
                User ID: {{ log.userId }}
              </div>
            </td>
            <td class="px-2 py-1 align-top">
              <div v-if="log.deviceId" class="text-gray-800 font-medium">
                {{ log.deviceId }}
              </div>
              <div v-else class="text-gray-800 font-medium">N/A</div>
              <div v-if="log.ipAddress" class="text-[11px] text-gray-500">
                IP: {{ log.ipAddress }}
              </div>
            </td>
            <td class="px-2 py-1 align-top text-center">
              <button
                type="button"
                class="inline-flex items-center justify-center w-8 h-8 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition disabled:opacity-60"
                :title="`View details for log #${log.id}`"
                @click="openDetailModal(log)"
              >
                <BootstrapIcon name="info-circle" class="w-4 h-4" />
                <span class="sr-only">View details</span>
              </button>
            </td>
          </tr>
        </template>

        <template #empty>
          No system logs to show yet.
        </template>

        <template #footer>
          <span>
            Showing {{ displayedLogs.length }} entries on this page.
          </span>
          <span>
            Last updated:
            <span class="text-gray-600 font-medium">
              {{ formattedLastUpdated }}
            </span>
          </span>
        </template>
      </DataBoxCard>
    </div>

    <SystemLogDetailModal
      v-if="selectedLog"
      :model-value="isDetailModalVisible"
      :log="selectedLog"
      @update:modelValue="handleDetailVisibility"
      @close="handleDetailClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, reactive } from "vue";
import { message } from "ant-design-vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import SystemLogDetailModal from "@/components/Modals/Devices/SystemLogDetailModal.vue";
import AdvancedFilterPanel, {
  type FilterFieldRow,
} from "@/components/common/AdvancedFilterPanel.vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

interface LogEntry {
  id: string | number;
  level: string;
  message: string;
  source?: string;
  deviceId?: string;
  createdAt?: string;
  tags?: string[];
  actor?: string;
  actorEmail?: string;
  userId?: string | number | null;
  ipAddress?: string;
  metadata?: Record<string, unknown> | string | unknown[] | null;
}

interface AdvancedFiltersState {
  action: string;
  userId: string;
  ipAddress: string;
  startDate: string;
  endDate: string;
}

const { title } = defineProps({
  title: { type: String, default: "" },
});

const logs = ref<LogEntry[]>([]);
const selectedLog = ref<LogEntry | null>(null);
const isDetailModalVisible = ref(false);
const searchKeyword = ref("");
const isLoading = ref(false);
const isFilterVisible = ref(true);
const pagination = ref({
  page: 1,
  perPage: 10,
  lastPage: 1,
  total: 0,
});
const lastUpdatedAt = ref<string | null>(null);

const defaultAdvancedFilters: AdvancedFiltersState = {
  action: "",
  userId: "",
  ipAddress: "",
  startDate: "",
  endDate: "",
};

const advancedFilters = reactive<AdvancedFiltersState>({
  ...defaultAdvancedFilters,
});

const systemFilterFields: FilterFieldRow[] = [
  [
    {
      key: "action",
      label: "Action",
      type: "text",
      placeholder: "auth.login.success",
    },
  ],
  [
    {
      key: "userId",
      label: "User ID",
      type: "text",
      placeholder: "e.g. 51",
      inputmode: "numeric",
    },
  ],
  [
    {
      key: "ipAddress",
      label: "IP Address",
      type: "text",
      placeholder: "127.0.0.1",
    },
  ],
  [
    {
      key: "startDate",
      label: "Start Date",
      type: "datetime-local",
    },
    {
      key: "endDate",
      label: "End Date",
      type: "datetime-local",
    },
  ],
];

function snapshotAdvancedFilters() {
  return {
    action: advancedFilters.action.trim(),
    userId: advancedFilters.userId.trim(),
    ipAddress: advancedFilters.ipAddress.trim(),
    startDate: advancedFilters.startDate,
    endDate: advancedFilters.endDate,
  };
}

const appliedAdvancedFilters = ref(snapshotAdvancedFilters());

const displayedLogs = computed(() => logs.value);
const formattedLastUpdated = computed(() => {
  if (!lastUpdatedAt.value) return "—";
  const date = new Date(lastUpdatedAt.value);
  return Number.isNaN(date.getTime()) ? lastUpdatedAt.value : date.toLocaleString();
});

function levelBadgeClass(level: string) {
  const normalized = level?.toLowerCase();
  if (["critical", "fatal"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (["error"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (["warning", "warn"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["debug"].includes(normalized)) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function formatTimestamp(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function previewValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function metadataPreview(meta: LogEntry["metadata"]) {
  if (!meta) return "";
  if (typeof meta === "string") return meta;
  if (Array.isArray(meta)) {
    return meta
      .slice(0, 2)
      .map((value) => previewValue(value))
      .join(", ");
  }
  const entries = Object.entries(meta).slice(0, 2);
  return entries.map(([key, value]) => `${key}: ${previewValue(value)}`).join(", ");
}

function resolveActor(entry: any) {
  let actorName = "";
  let actorEmail = "";

  const normalize = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  const directActor = normalize(entry?.actor);
  const triggered = normalize(entry?.triggered_by);
  const userString = normalize(entry?.user);

  if (directActor) {
    actorName = directActor;
  } else if (triggered) {
    actorName = triggered;
  } else if (entry?.user && typeof entry.user === "object") {
    actorName = normalize(entry.user.name) || normalize(entry.user.email);
    actorEmail = normalize(entry.user.email);
  } else if (userString) {
    actorName = userString;
  }

  return {
    actorName,
    actorEmail,
  };
}

function parseNumeric(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizeUserId(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function generateFallbackId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapLogEntry(entry: any): LogEntry {
  const normalizedLevel = String(
    entry?.level ?? entry?.severity ?? entry?.type ?? "info"
  ).toLowerCase();

  const tags: string[] = Array.isArray(entry?.tags)
    ? entry.tags
    : entry?.tag
    ? [entry.tag]
    : [];

  const { actorName, actorEmail } = resolveActor(entry);

  return {
    id:
      entry?.id ??
      entry?.log_id ??
      entry?.event_id ??
      entry?.uuid ??
      generateFallbackId(),
    level: normalizedLevel,
    message:
      entry?.message ??
      entry?.event ??
      entry?.description ??
      entry?.summary ??
      "No message provided.",
    source:
      entry?.action ??
      entry?.source ??
      entry?.service ??
      entry?.module ??
      entry?.component ??
      entry?.category ??
      "",
    deviceId:
      entry?.device_id ??
      entry?.deviceId ??
      entry?.device ??
      entry?.gateway ??
      entry?.sensor ??
      "",
    createdAt:
      entry?.created_at ??
      entry?.createdAt ??
      entry?.timestamp ??
      entry?.time ??
      "",
    tags,
    actor: actorName,
    actorEmail,
    userId: entry?.user_id ?? entry?.userId ?? null,
    ipAddress:
      entry?.ip_address ??
      entry?.ip ??
      entry?.ipAddress ??
      entry?.ip_addr ??
      "",
    metadata:
      entry?.metadata ??
      entry?.meta ??
      entry?.context ??
      entry?.payload ??
      entry?.data ??
      null,
  };
}

const authStore = useAuthStore();

async function fetchLogs(options: { showLoader?: boolean } = {}) {
  const { showLoader = true } = options;
  if (!import.meta.client) return;

  try {
    if (showLoader) {
      isLoading.value = true;
    }

    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      throw new Error("Missing access token. Please sign in again.");
    }
    const queryParams = new URLSearchParams({
      page: String(pagination.value.page),
      per_page: String(pagination.value.perPage),
    });

    const keyword = searchKeyword.value.trim();
    if (keyword) {
      queryParams.append("search", keyword);
    }
    const advanced = appliedAdvancedFilters.value;
    if (advanced.action) {
      queryParams.append("action", advanced.action);
    }
    if (advanced.ipAddress) {
      queryParams.append("ip_address", advanced.ipAddress);
    }
    const normalizedUserId = normalizeUserId(advanced.userId);
    if (normalizedUserId !== null) {
      queryParams.append("user_id", String(normalizedUserId));
    }
    if (advanced.startDate) {
      queryParams.append("start", advanced.startDate);
    }
    if (advanced.endDate) {
      queryParams.append("end", advanced.endDate);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: authorization,
    };

    const response = await fetch(
      `${apiConfig.auth}/system-logs?${queryParams.toString()}`,
      {
        method: "GET",
        headers,
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message ?? `Unable to load logs (${response.status}).`);
    }

    const payload = data?.data;
    let paginatedBlock: any = null;
    let list: any[] = [];

    if (Array.isArray(payload)) {
      list = payload;
    } else if (payload && typeof payload === "object") {
      paginatedBlock = payload;
      if (Array.isArray(payload.data)) {
        list = payload.data;
      }
    } else if (Array.isArray(data?.logs)) {
      list = data.logs;
    }

    logs.value = list.map(mapLogEntry);

    const resolvedLastPage = parseNumeric(
      paginatedBlock?.last_page ??
        paginatedBlock?.lastPage ??
        data?.last_page ??
        data?.lastPage
    );
    if (typeof resolvedLastPage === "number") {
      pagination.value.lastPage = resolvedLastPage;
    }

    const resolvedCurrentPage = parseNumeric(
      paginatedBlock?.current_page ??
        paginatedBlock?.currentPage ??
        data?.current_page ??
        data?.currentPage
    );
    if (typeof resolvedCurrentPage === "number") {
      pagination.value.page = resolvedCurrentPage;
    }

    const resolvedTotal = parseNumeric(paginatedBlock?.total ?? data?.total);
    pagination.value.total =
      typeof resolvedTotal === "number" ? resolvedTotal : list.length;

    const resolvedPerPage = parseNumeric(
      paginatedBlock?.per_page ??
        paginatedBlock?.perPage ??
        data?.per_page ??
        data?.perPage
    );
    if (typeof resolvedPerPage === "number") {
      pagination.value.perPage = resolvedPerPage;
    }

    lastUpdatedAt.value = new Date().toISOString();
  } catch (error) {
    const messageText =
      (error as Error)?.message ?? "Unable to load system logs.";
    message.error(messageText);
  } finally {
    if (showLoader) {
      isLoading.value = false;
    }
  }
}

function handleAdvancedFilterModelUpdate(value: Record<string, string>) {
  (Object.keys(defaultAdvancedFilters) as (keyof AdvancedFiltersState)[]).forEach(
    (key) => {
      advancedFilters[key] = value[key] ?? "";
    }
  );
}

function applyAdvancedFilters(payload?: Record<string, string>) {
  if (payload) {
    handleAdvancedFilterModelUpdate(payload);
  }
  appliedAdvancedFilters.value = snapshotAdvancedFilters();
  pagination.value.page = 1;
  fetchLogs();
}

function resetAdvancedFilters() {
  Object.assign(advancedFilters, defaultAdvancedFilters);
  applyAdvancedFilters();
}

function toggleFilters() {
  isFilterVisible.value = !isFilterVisible.value;
}

function refreshLogs() {
  fetchLogs();
}

function exportLogs() {
  if (!import.meta.client) return;
  const data = logs.value;
  if (!data.length) {
    message.warning("No logs to export.");
    return;
  }

  const headers = [
    "Timestamp",
    "Level",
    "Source",
    "Message",
    "Actor",
    "Device",
    "IP Address",
  ];

  const escapeValue = (value: string | number | null | undefined) => {
    const str = (value ?? "").toString().replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeValue).join(","),
    ...data.map((log) =>
      [
        formatTimestamp(log.createdAt),
        (log.level || "").toUpperCase(),
        log.source || "",
        log.message || "",
        log.actor || "System",
        log.deviceId || "N/A",
        log.ipAddress || "",
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
  link.setAttribute("download", `system-logs-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  message.success("Logs exported.");
}

function prevPage() {
  if (pagination.value.page > 1) {
    pagination.value.page -= 1;
    fetchLogs({ showLoader: false });
  }
}

function nextPage() {
  if (pagination.value.page < pagination.value.lastPage) {
    pagination.value.page += 1;
    fetchLogs({ showLoader: false });
  }
}

function changePerPage(value: number) {
  pagination.value.perPage = value;
  pagination.value.page = 1;
  fetchLogs({ showLoader: false });
}

function openDetailModal(log: LogEntry) {
  selectedLog.value = log;
  isDetailModalVisible.value = true;
}

function handleDetailVisibility(value: boolean) {
  isDetailModalVisible.value = value;
}

function handleDetailClose() {
  selectedLog.value = null;
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null;
watch(searchKeyword, () => {
  pagination.value.page = 1;
  if (searchDebounce) {
    clearTimeout(searchDebounce);
  }
  searchDebounce = setTimeout(() => fetchLogs(), 450);
});

onMounted(() => {
  fetchLogs();
});

onBeforeUnmount(() => {
  if (searchDebounce) {
    clearTimeout(searchDebounce);
  }
});
</script>

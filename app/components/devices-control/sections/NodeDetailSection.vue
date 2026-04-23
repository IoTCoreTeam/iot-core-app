<template>
  <section class="w-full px-4 py-4">
    <div class="flex items-center justify-between border-b border-gray-200 pb-2">
      <button
        type="button"
        class="inline-flex items-center rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
        @click="emit('navigate-device-registration')"
      >
        Back to Device Registration
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!selectedNode || isContextLoading"
        @click="handleResetContext"
      >
        <BootstrapIcon name="arrow-clockwise" class="h-3 w-3" />
        Reset
      </button>
    </div>

    <div
      v-if="!selectedNode"
      class="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700"
    >
      No node selected. Open a node detail from Device Registration first.
    </div>

    <div v-else class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article class="overflow-hidden rounded border border-slate-200 bg-white">
        <header class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-gray-700">
          <span>Node Information</span>
          <span class="text-[11px] font-normal text-blue-600">Realtime</span>
        </header>
        <div v-if="isContextLoading" class="space-y-2 px-3 py-3">
          <div v-for="item in 7" :key="`node-info-skeleton-${item}`" class="grid grid-cols-[140px_1fr] items-center gap-3">
            <div class="h-3 w-20 rounded bg-slate-100 animate-pulse" />
            <div class="h-3 w-40 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        <table v-else class="w-full text-xs">
          <tbody>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">External ID</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedNode.external_id ?? resolvedNode.id) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">Name</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedNode.name) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">Type</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedNode.type) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">Gateway ID</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedNode.gateway_id) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">MAC</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedNode.mac_address) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">Status</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedNode.status) }}</td></tr>
            <tr><td class="w-36 px-3 py-2 text-gray-500">Last Seen</td><td class="px-3 py-2 text-gray-900">{{ formatDate(resolvedNode.last_seen) }}</td></tr>
          </tbody>
        </table>
      </article>

      <article class="overflow-hidden rounded border border-slate-200 bg-white">
        <header class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-gray-700">
          <span>Gateway Connection</span>
          <span class="text-[11px] font-normal text-blue-600">Realtime</span>
        </header>
        <div v-if="isContextLoading" class="space-y-2 px-3 py-3">
          <div v-for="item in 6" :key="`gateway-info-skeleton-${item}`" class="grid grid-cols-[140px_1fr] items-center gap-3">
            <div class="h-3 w-20 rounded bg-slate-100 animate-pulse" />
            <div class="h-3 w-44 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        <table v-else class="w-full text-xs">
          <tbody>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">Name</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedGateway.name) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">External ID</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedGateway.external_id ?? resolvedNode.gateway_id) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">IP</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedGateway.ip_address) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">MAC</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedGateway.mac_address) }}</td></tr>
            <tr class="border-b border-gray-100"><td class="w-36 px-3 py-2 text-gray-500">Status</td><td class="px-3 py-2 text-gray-900">{{ displayValue(resolvedGateway.status) }}</td></tr>
            <tr><td class="w-36 px-3 py-2 text-gray-500">Last Seen</td><td class="px-3 py-2 text-gray-900">{{ formatDate(resolvedGateway.last_seen) }}</td></tr>
          </tbody>
        </table>
      </article>

      <article class="overflow-hidden rounded border border-slate-200 bg-white xl:col-span-2">
        <header class="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-gray-700">Control URLs</header>
        <div v-if="isContextLoading" class="space-y-2 px-3 py-3">
          <div class="grid grid-cols-6 gap-3 border-b border-slate-200 pb-2">
            <div v-for="item in 6" :key="`control-url-head-skeleton-${item}`" class="h-3 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
          <div v-for="row in 3" :key="`control-url-row-skeleton-${row}`" class="grid grid-cols-6 items-center gap-3 py-2">
            <div class="h-3 w-40 rounded bg-slate-200 animate-pulse" />
            <div class="h-3 w-28 rounded bg-slate-200 animate-pulse" />
            <div class="h-3 w-36 rounded bg-slate-200 animate-pulse" />
            <div class="h-3 w-20 rounded bg-slate-200 animate-pulse" />
            <div class="h-3 w-24 rounded bg-slate-200 animate-pulse" />
            <div class="flex items-center gap-2">
              <div class="h-7 w-7 rounded border border-slate-200 bg-slate-100 animate-pulse" />
              <div class="h-7 w-7 rounded border border-slate-200 bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
        <DataBoxCard
          v-else
          :is-loading="false"
          :columns="6"
          :has-data="controlUrls.length > 0"
          :elevated="false"
          :padded="false"
        >
          <template #head>
            <tr class="border-b border-gray-200 bg-slate-50 text-xs text-gray-600">
              <th class="px-3 py-2 text-left font-normal tracking-wide">Controller ID</th>
              <th class="px-3 py-2 text-left font-normal tracking-wide">Name</th>
              <th class="px-3 py-2 text-left font-normal tracking-wide">URL</th>
              <th class="px-3 py-2 text-left font-normal tracking-wide">Input Type</th>
              <th class="px-3 py-2 text-left font-normal tracking-wide">Updated</th>
              <th class="px-3 py-2 text-center font-normal tracking-wide">Actions</th>
            </tr>
          </template>
          <template #default>
            <template v-for="item in controlUrls" :key="item.id">
              <tr class="border-b border-gray-100 text-xs hover:bg-gray-50">
                <td class="break-all px-3 py-2">{{ displayValue(item.controller_id) }}</td>
                <td class="px-3 py-2">
                  <span class="block max-w-55 truncate" :title="displayValue(item.name)">
                    {{ displayValue(item.name) }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="item.draft_url"
                      type="text"
                      placeholder="e.g. /pump"
                      class="w-full border-0 border-b border-slate-300 rounded-none bg-transparent px-0 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      class="inline-flex h-7 w-7 items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="isSavingControlUrl || !canRegisterControlUrl(item)"
                      title="Register URL"
                      @click="handleRegisterControlUrl(item)"
                    >
                      <BootstrapIcon
                        name="plus-lg"
                        class="h-3 w-3"
                        :class="{ 'animate-spin': isSavingControlUrl && savingControlUrlId === item.id }"
                      />
                    </button>
                  </div>
                </td>
                <td class="px-3 py-2">{{ displayValue(item.input_type) }}</td>
                <td class="px-3 py-2">{{ formatDate(item.updated_at) }}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      class="inline-flex h-7 w-7 items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!item.control_url_id || isLoadingUsageChart"
                      title="Usage chart"
                      @click="openUsageChart(item)"
                    >
                      <BootstrapIcon
                        name="bar-chart-line"
                        class="h-3 w-3"
                        :class="{ 'animate-spin': isLoadingUsageChart && selectedUsageChartControlUrlId === item.control_url_id }"
                      />
                    </button>
                    <button
                      v-if="isJsonCommandType(item)"
                      type="button"
                      class="inline-flex h-7 w-7 items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!item.control_url_id"
                      title="Add command detail"
                      @click="openCommandDetailFromControlUrl(item)"
                    >
                      <BootstrapIcon name="plus-lg" class="h-3 w-3" />
                    </button>
                    <button
                      v-if="isJsonCommandType(item)"
                      type="button"
                      class="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!item.control_url_id || isLoadingCommandListByControlUrl[item.control_url_id]"
                      title="Toggle command list"
                      @click="toggleJsonCommandsInline(item)"
                    >
                      <BootstrapIcon
                        name="list-ul"
                        class="h-3 w-3"
                        :class="{ 'animate-spin': item.control_url_id && isLoadingCommandListByControlUrl[item.control_url_id] }"
                      />
                    </button>
                  </div>
                </td>
              </tr>
              <tr
                v-if="isJsonCommandType(item) && item.control_url_id && expandedCommandControlUrlIds[item.control_url_id]"
                class="border-b border-blue-100 bg-slate-50"
              >
                <td :colspan="6" class="px-3 py-2">
                  <div
                    v-if="isLoadingCommandListByControlUrl[item.control_url_id]"
                    class="py-2 text-xs text-gray-500"
                  >
                    Loading json commands...
                  </div>
                  <div
                    v-else-if="!(jsonCommandsByControlUrl[item.control_url_id] || []).length"
                    class="py-2 text-xs text-gray-500"
                  >
                    No json command found for this control url.
                  </div>
                  <div class="overflow-x-auto rounded border border-slate-200 bg-white text-xs">
                    <div class="min-w-140 grid grid-cols-[minmax(0,1.6fr)_120px_180px_80px] gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-gray-600">
                      <span>Name</span>
                      <span>Mode</span>
                      <span>Updated</span>
                      <span class="text-center">Actions</span>
                    </div>
                    <div
                      v-for="command in jsonCommandsByControlUrl[item.control_url_id]"
                      :key="command.id"
                      class="min-w-140 grid grid-cols-[minmax(0,1.6fr)_120px_180px_80px] items-center gap-2 border-b border-slate-100 px-2 py-1.5 last:border-b-0"
                    >
                      <span class="truncate text-gray-700" :title="command.name || 'N/A'">
                        {{ command.name || "N/A" }}
                      </span>
                      <span>
                        <span class="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                          {{ command.mode || "N/A" }}
                        </span>
                      </span>
                      <span class="truncate text-gray-500" :title="formatDate(command.updated_at)">
                        {{ formatDate(command.updated_at) }}
                      </span>
                      <span class="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
                          title="Edit command"
                          @click="openCommandDetailFromRow(item, command)"
                        >
                          <BootstrapIcon name="pencil-square" class="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          :disabled="isDeletingCommandId === command.id"
                          title="Delete command"
                          @click="handleDeleteJsonCommand(item, command)"
                        >
                          <BootstrapIcon
                            name="trash3"
                            class="h-3 w-3"
                            :class="{ 'animate-spin': isDeletingCommandId === command.id }"
                          />
                        </button>
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </template>
          <template #empty>
            No control URLs found.
          </template>
        </DataBoxCard>

        <div v-if="isUsageChartVisible" class="border-t border-slate-200 bg-white px-3 py-3">
          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-xs font-semibold text-gray-700">
              Usage Frequency (Last 24h): {{ selectedUsageChartControlUrlLabel }}
            </h4>
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              title="Hide chart"
              @click="
                selectedUsageChartControlUrlId = null;
                selectedUsageChartControlUrlLabel = '';
                usageChartError = null;
              "
            >
              <BootstrapIcon name="x-lg" class="h-3 w-3" />
            </button>
          </div>

          <div v-if="isLoadingUsageChart" class="py-8 text-center text-xs text-gray-500">
            <div class="mx-auto grid max-w-4xl grid-cols-12 gap-2">
              <div v-for="bar in 24" :key="`usage-chart-skeleton-${bar}`" class="h-24 self-end rounded bg-slate-100 animate-pulse" :style="{ height: `${20 + (bar % 6) * 16}px` }" />
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
        </div>
      </article>
    </div>
    <AddCommandSetupModal
      :model-value="isCommandDetailModalOpen"
      :is-editing="isCommandDetailEditing"
      :is-saving="isSavingCommandDetail"
      :control-url-options="[]"
      :show-control-url-select="false"
      title-text="Command Detail"
      :form="commandDetailForm"
      @request-close="closeCommandDetailModal"
      @after-leave="resetCommandDetailForm"
      @save="saveCommandDetail"
      @draft-changed="handleCommandDraftChanged"
      @add-generated-field-input="addGeneratedFieldInput"
      @remove-generated-field-input="removeGeneratedFieldInput"
      @mode-changed="handleCommandModeChanged"
      @input-type-changed="handleCommandInputTypeChanged"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ApexOptions } from "apexcharts";
import { message } from "ant-design-vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import { useControlUrlActions } from "@/composables/DeviceControl/useControlUrlActions";
import AddCommandSetupModal from "@/components/Modals/Devices/AddCommandSetupModal.vue";
import type { ControllerState, NodeInfo, Section } from "@/types/devices-control";
import type { GatewayEventPayload } from "@/composables/DeviceRegistration/SSEHandle";
import type { ControlLogRow } from "@/types/control-ack";
import { formatIotDateTime } from "~~/config/iot-time-format";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

type GatewayDetail = {
  id?: string | null;
  external_id?: string | null;
  name?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  status?: string | null;
  last_seen?: string | null;
};

type ControlUrlRow = {
  id: string;
  control_url_id?: string | null;
  controller_id?: string | null;
  name?: string | null;
  url?: string | null;
  draft_url: string;
  input_type?: string | null;
  updated_at?: string | null;
};

type JsonCommandRow = {
  id: string;
  control_url_id: string;
  name?: string | null;
  command?: unknown;
  mode?: string | null;
  updated_at?: string | null;
};

type CommandDetailForm = {
  control_url_id: string;
  name: string;
  commandInputType: "generated" | "raw";
  commandMode: "digital" | "analog";
  generatedFields: Array<{ key: string; valueText: string }>;
  commandText: string;
};

const props = defineProps<{
  section?: Section;
  selectedNode?: NodeInfo | null;
}>();

const emit = defineEmits<{
  (event: "navigate-device-registration"): void;
}>();

const authStore = useAuthStore();
const { createControlUrl, updateControlUrl } = useControlUrlActions();
const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

const gatewayDetail = ref<GatewayDetail | null>(null);
const realtimeGateway = ref<GatewayDetail | null>(null);
const realtimeNode = ref<NodeInfo | null>(null);
const controlUrls = ref<ControlUrlRow[]>([]);
const realtimeControllers = ref<ControllerState[]>([]);
const nodeInternalId = ref<string | null>(null);
const isContextLoading = ref(false);
const isSavingControlUrl = ref(false);
const savingControlUrlId = ref<string | null>(null);
const expandedCommandControlUrlIds = ref<Record<string, boolean>>({});
const isLoadingCommandListByControlUrl = ref<Record<string, boolean>>({});
const jsonCommandsByControlUrl = ref<Record<string, JsonCommandRow[]>>({});
const isCommandDetailModalOpen = ref(false);
const isSavingCommandDetail = ref(false);
const isDeletingCommandId = ref<string | null>(null);
const editingCommandDetailId = ref<string | null>(null);
const selectedUsageChartControlUrlId = ref<string | null>(null);
const selectedUsageChartControlUrlLabel = ref<string>("");
const isLoadingUsageChart = ref(false);
const usageChartError = ref<string | null>(null);
const usageChartSeries = ref<Array<{ x: string; y: number }>>([]);
const commandDetailForm = ref<CommandDetailForm>({
  control_url_id: "",
  name: "",
  commandInputType: "generated",
  commandMode: "digital",
  generatedFields: [{ key: "", valueText: "" }],
  commandText: "",
});
let gatewayEventSource: EventSource | null = null;

const selectedNode = computed(() => props.selectedNode ?? null);
const selectedNodeKey = computed(() => {
  const node = selectedNode.value;
  if (!node) return "";
  return String(node.external_id ?? node.id ?? "");
});

const resolvedNode = computed<NodeInfo>(() => ({
  ...(selectedNode.value ?? {}),
  ...(realtimeNode.value ?? {}),
}));

const resolvedGateway = computed<GatewayDetail>(() => ({
  ...(gatewayDetail.value ?? {}),
  ...(realtimeGateway.value ?? {}),
}));
const isCommandDetailEditing = computed(() => editingCommandDetailId.value !== null);
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
    fontFamily: "inherit",
  },
  plotOptions: {
    bar: {
      columnWidth: "55%",
      borderRadius: 3,
    },
  },
  stroke: { width: 0 },
  colors: ["#2563eb"],
  dataLabels: { enabled: false },
  xaxis: {
    type: "datetime",
    labels: { datetimeUTC: false },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    title: { text: "Count" },
  },
  tooltip: {
    x: { format: "dd/MM/yyyy HH:mm" },
  },
  grid: {
    borderColor: "#e5e7eb",
  },
}));

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function formatDate(value?: string | null) {
  return formatIotDateTime(value, { fallback: "N/A" });
}

function pickRows(payload: any) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickFirstRow(payload: any) {
  const rows = pickRows(payload);
  return rows[0] ?? null;
}

function parseGatewayNode(payload: GatewayEventPayload) {
  const nodeExternalId = selectedNodeKey.value;
  if (!nodeExternalId) return null;

  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
  return (
    nodes.find((item) => {
      const candidateIds = [item.external_id, item.externalId, item.id, item.node_id, item.nodeId]
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value));
      return candidateIds.includes(nodeExternalId);
    }) ?? null
  );
}

function normalizeControllerKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeInputType(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function mergeControlUrlRowsFromControllers(controllers?: ControllerState[] | null) {
  if (!Array.isArray(controllers) || !controllers.length) return;

  const existingByKey = new Map<string, ControlUrlRow>();
  controlUrls.value.forEach((row) => {
    const key =
      normalizeControllerKey(row.name ?? null) ||
      normalizeControllerKey(row.controller_id ?? null);
    if (key) {
      existingByKey.set(key, row);
    }
  });

  controllers.forEach((controller) => {
    const key =
      normalizeControllerKey(controller.device ?? null) ||
      normalizeControllerKey(controller.name ?? null) ||
      normalizeControllerKey(controller.id ?? null);
    if (!key) return;
    if (existingByKey.has(key)) return;

    controlUrls.value.push({
      id: `controller:${key}`,
      control_url_id: null,
      controller_id: controller.id ? String(controller.id) : null,
      name: controller.device ?? controller.name ?? key,
      url: null,
      draft_url: "",
      input_type: controller.kind ?? controller.type ?? "digital",
      updated_at: null,
    });
  });
}

function isJsonCommandType(item: ControlUrlRow) {
  return normalizeInputType(item.input_type) === "json_command";
}

function applyRealtimePayload(payload: GatewayEventPayload) {
  const nodePayload = parseGatewayNode(payload);

  if (nodePayload) {
    realtimeNode.value = {
      ...(realtimeNode.value ?? {}),
      id: nodePayload.id ?? nodePayload.node_id ?? nodePayload.nodeId ?? realtimeNode.value?.id ?? null,
      external_id:
        nodePayload.external_id ??
        nodePayload.externalId ??
        selectedNode.value?.external_id ??
        (selectedNode.value?.id !== null && selectedNode.value?.id !== undefined
          ? String(selectedNode.value.id)
          : null) ??
        null,
      name: nodePayload.name ?? realtimeNode.value?.name ?? selectedNode.value?.name ?? null,
      type: nodePayload.node_type ?? nodePayload.type ?? realtimeNode.value?.type ?? selectedNode.value?.type ?? null,
      gateway_id:
        nodePayload.gateway_id ??
        nodePayload.gatewayId ??
        realtimeNode.value?.gateway_id ??
        selectedNode.value?.gateway_id ??
        null,
      ip_address: nodePayload.ip ?? nodePayload.ip_address ?? realtimeNode.value?.ip_address ?? null,
      mac_address: nodePayload.mac ?? nodePayload.mac_address ?? realtimeNode.value?.mac_address ?? null,
      status: nodePayload.status ?? realtimeNode.value?.status ?? null,
      registered: nodePayload.registered ?? realtimeNode.value?.registered ?? null,
      last_seen:
        nodePayload.last_seen ??
        nodePayload.lastSeen ??
        nodePayload.gateway_timestamp ??
        realtimeNode.value?.last_seen ??
        null,
    };
    realtimeControllers.value = Array.isArray(nodePayload.devices)
      ? nodePayload.devices
      : [];
    mergeControlUrlRowsFromControllers(realtimeControllers.value);
  }

  const gatewayId = String(
    resolvedNode.value.gateway_id ?? selectedNode.value?.gateway_id ?? "",
  );
  const payloadGatewayId = String(payload.id ?? "");
  const gatewayMatches = Boolean(gatewayId) && payloadGatewayId === gatewayId;

  if (!gatewayMatches) {
    return;
  }

  realtimeGateway.value = {
    ...(realtimeGateway.value ?? {}),
    id: payload.id ? String(payload.id) : realtimeGateway.value?.id ?? null,
    external_id: payload.id ? String(payload.id) : realtimeGateway.value?.external_id ?? null,
    name: payload.name ?? realtimeGateway.value?.name ?? null,
    ip_address: payload.ip ?? realtimeGateway.value?.ip_address ?? null,
    mac_address: payload.mac ?? realtimeGateway.value?.mac_address ?? null,
    status: payload.status ?? realtimeGateway.value?.status ?? null,
    last_seen: payload.last_seen ?? payload.lastSeen ?? realtimeGateway.value?.last_seen ?? null,
  };
}

function canRegisterControlUrl(item: ControlUrlRow) {
  if (!item.controller_id) return false;
  const nextUrl = (item.draft_url ?? "").trim();
  return nextUrl.startsWith("/");
}

function normalizeDateKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeHourKey(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(0, 0, 0);
  return date.toISOString();
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

function buildDeviceCandidates(item: ControlUrlRow) {
  const fromUrl = String(item.url ?? "")
    .trim()
    .replace(/^\//, "");
  const controllerId = String(item.controller_id ?? "").trim();
  const tailByDash = controllerId.split("-").pop() ?? "";
  return uniqueStrings([
    item.controller_id,
    item.name,
    fromUrl || null,
    tailByDash || null,
    tailByDash.replaceAll("_", "-") || null,
  ]);
}

function buildNodeCandidates() {
  const base = uniqueStrings([
    resolvedNode.value.external_id,
    resolvedNode.value.id ? String(resolvedNode.value.id) : null,
    selectedNode.value?.external_id,
    selectedNode.value?.id ? String(selectedNode.value.id) : null,
  ]);
  return uniqueStrings([
    ...base,
    ...base.map((value) => value.replace(/^test-/i, "")),
  ]);
}

function rowIdentity(row: ControlLogRow) {
  const raw = row._id;
  if (!raw) return `${row.timestamp ?? ""}-${row.received_at ?? ""}-${row.device ?? ""}`;
  if (typeof raw === "string") return raw;
  return String(raw.$oid ?? `${row.timestamp ?? ""}-${row.received_at ?? ""}-${row.device ?? ""}`);
}

async function fetchControlAckRowsPage(
  authorization: string,
  options: { page: number; limit: number; nodeId?: string; device?: string; timestampFrom?: string },
) {
  const serverBase = (apiConfig.server || "").replace(/\/$/, "");
  const params = new URLSearchParams();
  params.set("limit", String(options.limit));
  params.set("page", String(options.page));
  if (options.nodeId) params.set("node_id", options.nodeId);
  if (options.device) params.set("device", options.device);
  if (options.timestampFrom) params.set("timestamp_from", options.timestampFrom);

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

async function fetchAllControlAckRowsForControlUrl(authorization: string, item: ControlUrlRow) {
  const limit = 500;
  const maxPagesPerQuery = 20;
  const deviceCandidates = buildDeviceCandidates(item);
  const nodeCandidates = buildNodeCandidates();
  const plans: Array<{ nodeId?: string; device: string }> = [];

  deviceCandidates.forEach((device) => {
    nodeCandidates.forEach((nodeId) => {
      plans.push({ nodeId, device });
    });
    plans.push({ device });
  });

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const timestampFrom = since.toISOString();

  const merged = new Map<string, ControlLogRow>();
  for (const plan of plans) {
    for (let page = 1; page <= maxPagesPerQuery; page += 1) {
      const rows = await fetchControlAckRowsPage(authorization, {
        page,
        limit,
        nodeId: plan.nodeId,
        device: plan.device,
        timestampFrom,
      });
      rows.forEach((row) => {
        merged.set(rowIdentity(row), row);
      });
      if (rows.length < limit) break;
    }
  }

  return Array.from(merged.values());
}

async function openUsageChart(item: ControlUrlRow) {
  if (!item.control_url_id) {
    message.warning("Please register URL first.");
    return;
  }
  if (!item.controller_id && !item.name) {
    message.warning("Missing controller for usage chart.");
    return;
  }

  const isSame = selectedUsageChartControlUrlId.value === item.control_url_id;
  if (isSame) {
    selectedUsageChartControlUrlId.value = null;
    selectedUsageChartControlUrlLabel.value = "";
    usageChartSeries.value = [];
    usageChartError.value = null;
    return;
  }

  selectedUsageChartControlUrlId.value = item.control_url_id;
  selectedUsageChartControlUrlLabel.value = item.name || item.controller_id || item.control_url_id;
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

    const rows = await fetchAllControlAckRowsForControlUrl(authorization, item);
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const bucketMap = new Map<string, number>();
    const cursor = new Date(since);
    cursor.setMinutes(0, 0, 0);
    while (cursor <= now) {
      bucketMap.set(cursor.toISOString(), 0);
      cursor.setHours(cursor.getHours() + 1);
    }

    rows.forEach((row) => {
      const eventTime = parseRowTime(row);
      if (!eventTime || eventTime < since || eventTime > now) return;
      const key = normalizeHourKey(eventTime.toISOString());
      if (!key) return;
      bucketMap.set(key, (bucketMap.get(key) ?? 0) + 1);
    });

    usageChartSeries.value = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({
        x: key,
        y: count,
      }));
  } catch (error: any) {
    usageChartError.value = error?.message ?? "Failed to load usage chart.";
  } finally {
    isLoadingUsageChart.value = false;
  }
}

async function handleRegisterControlUrl(item: ControlUrlRow) {
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    message.error("Missing authorization.");
    return;
  }
  if (!nodeInternalId.value) {
    message.warning("Missing node id.");
    return;
  }
  if (!item.controller_id) {
    message.warning("Missing controller id.");
    return;
  }
  const nextUrl = (item.draft_url ?? "").trim();
  if (!nextUrl.startsWith("/")) {
    message.warning("URL must start with '/'.");
    return;
  }

  const payload = {
    controller_id: item.controller_id,
    node_id: nodeInternalId.value,
    name: item.name?.trim() ? String(item.name) : String(item.controller_id),
    url: nextUrl,
    input_type: item.input_type?.trim() ? String(item.input_type) : "digital",
  };

  isSavingControlUrl.value = true;
  savingControlUrlId.value = item.id;
  try {
    if (item.control_url_id) {
      await updateControlUrl(authorization, item.control_url_id, payload);
    } else {
      await createControlUrl(authorization, payload);
    }
    message.success("Control URL registered.");
    await fetchControlUrls();
    if (item.control_url_id) {
      await fetchJsonCommandsByControlUrl(item.control_url_id);
    }
  } catch (error: any) {
    message.error(error?.message ?? "Failed to register control URL.");
  } finally {
    isSavingControlUrl.value = false;
    savingControlUrlId.value = null;
  }
}

function parseGeneratedFieldValue(valueText: string): unknown {
  const normalized = valueText.trim();
  if (normalized === "") return "";
  const lowered = normalized.toLowerCase();
  if (lowered === "true") return true;
  if (lowered === "false") return false;
  if (lowered === "null") return null;

  const numberValue = Number(normalized);
  if (!Number.isNaN(numberValue)) {
    return Number.isInteger(numberValue) ? Math.trunc(numberValue) : numberValue;
  }
  if (
    (normalized.startsWith("{") && normalized.endsWith("}")) ||
    (normalized.startsWith("[") && normalized.endsWith("]"))
  ) {
    try {
      return JSON.parse(normalized);
    } catch {
      return normalized;
    }
  }
  return normalized;
}

function stringifyGeneratedFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildGeneratedCommandObject() {
  const command: Record<string, unknown> = {
    mode: commandDetailForm.value.commandMode,
  };
  commandDetailForm.value.generatedFields.forEach((field) => {
    const key = field.key.trim();
    if (!key || key === "mode") return;
    command[key] = parseGeneratedFieldValue(field.valueText);
  });
  return command;
}

function syncGeneratedCommandText() {
  commandDetailForm.value.commandText = JSON.stringify(buildGeneratedCommandObject(), null, 2);
}

function handleCommandModeChanged() {
  syncGeneratedCommandText();
}

function handleCommandDraftChanged() {
  syncGeneratedCommandText();
}

function addGeneratedFieldInput() {
  commandDetailForm.value.generatedFields.push({ key: "", valueText: "" });
}

function removeGeneratedFieldInput(index: number) {
  if (index < 0 || index >= commandDetailForm.value.generatedFields.length) return;
  commandDetailForm.value.generatedFields.splice(index, 1);
  if (!commandDetailForm.value.generatedFields.length) {
    commandDetailForm.value.generatedFields.push({ key: "", valueText: "" });
  }
  syncGeneratedCommandText();
}

function handleCommandInputTypeChanged() {
  if (commandDetailForm.value.commandInputType === "generated") {
    syncGeneratedCommandText();
  }
}

function resetCommandDetailForm() {
  commandDetailForm.value = {
    control_url_id: "",
    name: "",
    commandInputType: "generated",
    commandMode: "digital",
    generatedFields: [{ key: "", valueText: "" }],
    commandText: "",
  };
  editingCommandDetailId.value = null;
}

function closeCommandDetailModal() {
  isCommandDetailModalOpen.value = false;
}

function extractCommandMode(command: unknown) {
  if (!command || typeof command !== "object" || Array.isArray(command)) return null;
  const mode = (command as Record<string, unknown>).mode;
  if (mode === null || mode === undefined || mode === "") return null;
  return String(mode);
}

async function fetchJsonCommandsByControlUrl(controlUrlId: string) {
  const base = (apiConfig.controlModule || "").replace(/\/$/, "");
  const authorization = authStore.authorizationHeader;
  if (!base || !authorization) return;

  isLoadingCommandListByControlUrl.value = {
    ...isLoadingCommandListByControlUrl.value,
    [controlUrlId]: true,
  };
  try {
    const endpoint = `${base}/control-json-commands?control_url_id=${encodeURIComponent(controlUrlId)}&include=all&per_page=200`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to load json commands.");
    const payload = await response.json().catch(() => null);
    const rows = pickRows(payload).filter(
      (row: any) => String(row?.control_url_id ?? row?.control_url?.id ?? "") === controlUrlId,
    );
    jsonCommandsByControlUrl.value = {
      ...jsonCommandsByControlUrl.value,
      [controlUrlId]: rows.map((row: any) => ({
        id: String(row?.id ?? ""),
        control_url_id: controlUrlId,
        name: row?.name ? String(row.name) : null,
        command: row?.command ?? row?.command_payload ?? null,
        mode: extractCommandMode(row?.command ?? row?.command_payload ?? null),
        updated_at: row?.updated_at ? String(row.updated_at) : null,
      })),
    };
  } catch (error: any) {
    message.error(error?.message ?? "Failed to load json commands.");
    jsonCommandsByControlUrl.value = {
      ...jsonCommandsByControlUrl.value,
      [controlUrlId]: [],
    };
  } finally {
    isLoadingCommandListByControlUrl.value = {
      ...isLoadingCommandListByControlUrl.value,
      [controlUrlId]: false,
    };
  }
}

async function toggleJsonCommandsInline(item: ControlUrlRow) {
  const controlUrlId = item.control_url_id;
  if (!controlUrlId) return;

  const isExpanded = Boolean(expandedCommandControlUrlIds.value[controlUrlId]);
  expandedCommandControlUrlIds.value = {
    ...expandedCommandControlUrlIds.value,
    [controlUrlId]: !isExpanded,
  };
  if (isExpanded) return;
  await fetchJsonCommandsByControlUrl(controlUrlId);
}

function openCommandDetailFromControlUrl(item: ControlUrlRow) {
  if (!item.control_url_id) {
    message.warning("Please register URL first.");
    return;
  }
  resetCommandDetailForm();
  commandDetailForm.value.control_url_id = item.control_url_id;
  commandDetailForm.value.name = item.name ? String(item.name) : "";
  commandDetailForm.value.commandMode =
    normalizeInputType(item.input_type) === "analog" ? "analog" : "digital";
  syncGeneratedCommandText();
  isCommandDetailModalOpen.value = true;
}

function openCommandDetailFromRow(item: ControlUrlRow, command: JsonCommandRow) {
  if (!item.control_url_id) return;
  resetCommandDetailForm();
  editingCommandDetailId.value = command.id;
  const source = command.command;
  const sourceObject =
    source && typeof source === "object" && !Array.isArray(source)
      ? (source as Record<string, unknown>)
      : null;
  const mode = String(sourceObject?.mode ?? "").toLowerCase();
  const canUseGenerated = mode === "digital" || mode === "analog";
  commandDetailForm.value = {
    control_url_id: item.control_url_id,
    name: command.name ? String(command.name) : "",
    commandInputType: canUseGenerated ? "generated" : "raw",
    commandMode: mode === "analog" ? "analog" : "digital",
    generatedFields: sourceObject
      ? Object.entries(sourceObject)
          .filter(([key]) => key !== "mode")
          .map(([key, value]) => ({
            key,
            valueText: stringifyGeneratedFieldValue(value),
          }))
      : [{ key: "", valueText: "" }],
    commandText:
      source === null || source === undefined
        ? ""
        : typeof source === "string"
          ? source
          : JSON.stringify(source, null, 2),
  };
  if (canUseGenerated) {
    syncGeneratedCommandText();
  }
  isCommandDetailModalOpen.value = true;
}

async function saveCommandDetail() {
  const base = (apiConfig.controlModule || "").replace(/\/$/, "");
  const authorization = authStore.authorizationHeader;
  if (!base || !authorization) {
    message.warning("Control module endpoint or auth is missing.");
    return;
  }
  if (!commandDetailForm.value.control_url_id) {
    message.warning("Missing control url id.");
    return;
  }
  if (!commandDetailForm.value.name.trim()) {
    message.warning("Please input command name.");
    return;
  }

  let parsedCommand: Record<string, unknown>;
  if (commandDetailForm.value.commandInputType === "generated") {
    parsedCommand = buildGeneratedCommandObject();
  } else {
    if (!commandDetailForm.value.commandText.trim()) {
      message.warning("Please input command JSON.");
      return;
    }
    try {
      const parsed = JSON.parse(commandDetailForm.value.commandText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        message.warning("Command must be a JSON object.");
        return;
      }
      parsedCommand = {
        ...(parsed as Record<string, unknown>),
        mode: commandDetailForm.value.commandMode,
      };
    } catch {
      message.warning("Command must be valid JSON.");
      return;
    }
  }

  isSavingCommandDetail.value = true;
  try {
    const isEdit = Boolean(editingCommandDetailId.value);
    const endpoint = isEdit
      ? `${base}/control-json-commands/${encodeURIComponent(editingCommandDetailId.value ?? "")}`
      : `${base}/control-json-commands`;
    const response = await fetch(endpoint, {
      method: isEdit ? "PUT" : "POST",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        control_url_id: commandDetailForm.value.control_url_id,
        name: commandDetailForm.value.name.trim(),
        command: parsedCommand,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to save command detail.");
    }
    message.success(payload?.message ?? "Command detail saved.");
    const controlUrlId = commandDetailForm.value.control_url_id;
    await fetchJsonCommandsByControlUrl(controlUrlId);
    isCommandDetailModalOpen.value = false;
    resetCommandDetailForm();
  } catch (error: any) {
    message.error(error?.message ?? "Unable to save command detail.");
  } finally {
    isSavingCommandDetail.value = false;
  }
}

async function handleDeleteJsonCommand(item: ControlUrlRow, command: JsonCommandRow) {
  const base = (apiConfig.controlModule || "").replace(/\/$/, "");
  const authorization = authStore.authorizationHeader;
  if (!base || !authorization) {
    message.warning("Control module endpoint or auth is missing.");
    return;
  }
  if (!item.control_url_id || !command.id) return;

  isDeletingCommandId.value = command.id;
  try {
    const endpoint = `${base}/control-json-commands/${encodeURIComponent(command.id)}`;
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to delete command.");
    }
    message.success(payload?.message ?? "Command deleted.");
    await fetchJsonCommandsByControlUrl(item.control_url_id);
  } catch (error: any) {
    message.error(error?.message ?? "Unable to delete command.");
  } finally {
    isDeletingCommandId.value = null;
  }
}

function handleGatewayUpdate(event: MessageEvent) {
  if (!event.data) return;
  try {
    const payload = JSON.parse(event.data) as GatewayEventPayload;
    applyRealtimePayload(payload);
  } catch (error) {
    console.error("Failed to parse gateway SSE payload:", error);
  }
}

function handleGatewayError(event: Event) {
  console.error("Gateway SSE error:", event);
}

function connectGatewaySse() {
  if (!import.meta.client || !apiConfig.server) return;

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
  if (!gatewayEventSource) return;
  gatewayEventSource.close();
  gatewayEventSource = null;
}

async function fetchNodeContext() {
  const node = selectedNode.value;
  if (!node || !import.meta.client || !authStore.authorizationHeader) {
    gatewayDetail.value = null;
    controlUrls.value = [];
    nodeInternalId.value = null;
    return;
  }

  const externalId = node.external_id ?? node.id;
  if (!externalId) return;

  isContextLoading.value = true;
  gatewayDetail.value = null;
  controlUrls.value = [];
  realtimeControllers.value = [];
  expandedCommandControlUrlIds.value = {};
  isLoadingCommandListByControlUrl.value = {};
  jsonCommandsByControlUrl.value = {};
  nodeInternalId.value = null;

  try {
    const nodeRes = await fetch(
      `${apiConfig.controlModule}/nodes?external_id=${encodeURIComponent(String(externalId))}&include=gateway`,
      {
        headers: {
          Authorization: authStore.authorizationHeader,
          Accept: "application/json",
        },
      },
    );
    if (!nodeRes.ok) throw new Error("Failed to fetch node context");

    const nodePayload = await nodeRes.json();
    const nodeData = pickFirstRow(nodePayload);

    if (nodeData?.id) {
      nodeInternalId.value = String(nodeData.id);
    }
    if (Array.isArray(nodeData?.devices)) {
      realtimeControllers.value = nodeData.devices as ControllerState[];
    }

    const gatewayData = nodeData?.gateway ?? null;
    if (gatewayData) {
      gatewayDetail.value = {
        id: gatewayData.id ? String(gatewayData.id) : null,
        external_id: gatewayData.external_id ? String(gatewayData.external_id) : null,
        name: gatewayData.name ? String(gatewayData.name) : null,
        ip_address: gatewayData.ip_address ? String(gatewayData.ip_address) : null,
        mac_address: gatewayData.mac_address ? String(gatewayData.mac_address) : null,
        status: gatewayData.status ? String(gatewayData.status) : null,
        last_seen: gatewayData.last_seen ? String(gatewayData.last_seen) : null,
      };
    }

    await fetchControlUrls();
  } catch (error) {
    console.error(error);
    gatewayDetail.value = null;
    controlUrls.value = [];
  } finally {
    isContextLoading.value = false;
  }
}

async function handleResetContext() {
  if (!selectedNode.value || isContextLoading.value) return;
  await fetchNodeContext();
}

async function fetchControlUrls() {
  if (!nodeInternalId.value || !authStore.authorizationHeader) {
    controlUrls.value = [];
    return;
  }

  const controlUrlRes = await fetch(
    `${apiConfig.controlModule}/control-urls?node_id=${encodeURIComponent(nodeInternalId.value)}&include=all&per_page=200`,
    {
      headers: {
        Authorization: authStore.authorizationHeader,
        Accept: "application/json",
      },
    },
  );
  if (!controlUrlRes.ok) throw new Error("Failed to fetch control URLs");

  const controlUrlPayload = await controlUrlRes.json();
  const rows = pickRows(controlUrlPayload);
  controlUrls.value = rows.map((row: any) => ({
    id: String(row?.id ?? row?.controller_id ?? ""),
    control_url_id: row?.id ? String(row.id) : null,
    controller_id: row?.controller_id ? String(row.controller_id) : null,
    name: row?.name ? String(row.name) : null,
    url: row?.url ? String(row.url) : null,
    draft_url: row?.url ? String(row.url) : "",
    input_type: row?.input_type ? String(row.input_type) : null,
    updated_at: row?.updated_at ? String(row.updated_at) : null,
  }));
  mergeControlUrlRowsFromControllers(realtimeControllers.value);
}

watch(
  selectedNodeKey,
  () => {
    realtimeNode.value = null;
    realtimeGateway.value = null;
    fetchNodeContext();
  },
  { immediate: true },
);

onMounted(() => {
  connectGatewaySse();
});

onBeforeUnmount(() => {
  disconnectGatewaySse();
});
</script>

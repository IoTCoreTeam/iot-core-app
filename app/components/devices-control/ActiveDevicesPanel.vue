<template>
  <div class="bg-white border border-slate-200 rounded h-full flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-slate-100 flex items-center justify-between">
      <p class="text-sm font-semibold text-slate-900">Active Devices</p>
      <NuxtLink
        to="/devices-control/device-control-center"
        class="text-xs font-semibold text-blue-600 hover:text-blue-800"
      >
        View All
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <div class="px-4 border-b border-slate-100">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="gateway" tab="Gateways" />
        <a-tab-pane key="node" tab="Nodes" />
      </a-tabs>
    </div>

    <div class="flex-1 overflow-auto">
      <div v-if="activeTab === 'node'" class="p-4 border-b border-slate-100">
        <SingleMetricChart
          :metrics="nodeMetrics"
          :selected-metric-key="selectedNodeMetricKey"
          :selected-timeframe="selectedNodeTimeframe"
          :node-ids="nodeChartNodeIds"
          :selected-node-id="selectedNodeId"
          @update:selected-metric-key="handleNodeMetricChange"
          @update:selected-node-id="handleNodeIdChange"
        />
      </div>

      <DataBoxCard
        :is-loading="false"
        :has-data="filteredDevices.length > 0"
        :columns="4"
        :elevated="false"
        :padded="false"
        class="border-0 shadow-none h-full"
      >
        <template #head>
          <tr
            class="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500"
          >
            <th class="px-3 py-2 text-left font-semibold">Name</th>
            <th class="px-3 py-2 text-center font-semibold">Status</th>
            <th class="px-3 py-2 text-center font-semibold">Registered</th>
            <th class="px-3 py-2 text-right font-semibold">Last Seen</th>
          </tr>
        </template>

        <template #default>
          <tr
            v-for="device in displayedDevices"
            :key="device.id"
            class="hover:bg-gray-50 text-xs"
          >
            <td class="px-3 py-3">
              <div class="font-medium">{{ device.name }}</div>
              <div class="text-[10px] text-gray-500">{{ device.id }}</div>
            </td>

            <td class="px-3 text-center">
              <span
                class="px-1.5 py-0.5 rounded text-xs font-semibold"
                :class="statusColorClass(device.status)"
              >
                {{ formatStatus(device.status) }}
              </span>
            </td>

            <td class="px-1.5 py-0.5 rounded text-xs font-semibold text-center">
              <span :class="registeredClass(device.registered)">
                {{ formatRegistered(device.registered) }}
              </span>
            </td>

            <td class="px-3 text-right text-gray-600">
              {{ formatLastSeen(device.lastSeen ?? null) }}
            </td>
          </tr>
        </template>

        <template #empty> No devices to display yet. </template>
      </DataBoxCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import type { DashboardMetric, TimeframeKey } from "@/types/dashboard";
import type { DeviceRow, DeviceRowStatus } from "@/types/devices-control";
import { useLoadDataRow } from "@/composables/DeviceRegistration/loadDataRow";
import { apiConfig } from "~~/config/api";

// Internal State
const activeTab = ref<"gateway" | "node">("gateway");
const isConnected = ref(false);

const gatewayRows = ref<DeviceRow[]>([]);
const nodeRows = ref<DeviceRow[]>([]); // To be implemented similarly
const controllerRows = ref<DeviceRow[]>([]); // To be implemented similarly
const sensorRows = ref<DeviceRow[]>([]); // To be implemented similarly

const {
  updateGatewayFromPayload,
  startDeviceStatusPolling,
  stopDeviceStatusPolling,
} = useLoadDataRow({
  gatewayRows,
  nodeRows,
  controllerRows,
  sensorRows,
});
let gatewayEventSource: EventSource | null = null;

// Derived State
const filteredDevices = computed(() => {
  switch (activeTab.value) {
    case "gateway":
      return gatewayRows.value;
    case "node":
      return nodeRows.value;
    default:
      return [];
  }
});

const nodeMetrics = ref<DashboardMetric[]>([
  {
    key: "soilMoisture",
    title: "Soil moisture",
    subtitle: "Soil moisture",
    value: 0,
    unit: "%",
    icon: "droplet-half",
    change: 0,
    status: "good",
    statusText: "Stable",
    description: "Keep between 40-60% for healthy roots.",
    min: 0,
    max: 100,
    trend: [44, 45, 46, 47, 48, 49, 48],
    rules: { warnLow: 35, warnHigh: 70, dangerLow: 25, dangerHigh: 80 },
  },
  {
    key: "airHumidity",
    title: "Air humidity",
    subtitle: "Air humidity",
    value: 0,
    unit: "%",
    icon: "droplet",
    change: 0,
    status: "good",
    statusText: "Comfortable",
    description: "Ideal range 55-70% for most plants.",
    min: 0,
    max: 100,
    trend: [58, 60, 61, 62, 63, 64, 63],
    rules: { warnLow: 40, warnHigh: 80, dangerLow: 30, dangerHigh: 90 },
  },
  {
    key: "temperature",
    title: "Temperature",
    subtitle: "Temperature",
    value: 0,
    unit: "C",
    icon: "thermometer-half",
    change: 0,
    status: "good",
    statusText: "Cool",
    description: "Ambient temperature in the greenhouse.",
    min: 0,
    max: 45,
    trend: [26.5, 27.1, 27.8, 28.2, 28.5, 28.0, 28.4],
    rules: { warnLow: 15, warnHigh: 32, dangerLow: 10, dangerHigh: 36 },
  },
]);

const selectedNodeMetricKey = ref<string>(nodeMetrics.value[0]?.key ?? "");
const selectedNodeTimeframe = ref<TimeframeKey>("second");
const selectedNodeId = ref<string | undefined>(undefined);

const nodeChartNodeIds = computed(() =>
  nodeRows.value.map((row) => row.id).filter((id) => id)
);

function handleNodeMetricChange(value: string) {
  selectedNodeMetricKey.value = value;
}

function handleNodeIdChange(value: string) {
  selectedNodeId.value = value;
}

const displayedDevices = computed(() => {
  return filteredDevices.value;
});

// SSE Logic
function connectGatewaySse() {
  if (!import.meta.client || !apiConfig.server) return;

  disconnectGatewaySse();

  try {
    const endpoint = `${apiConfig.server.replace(/\/$/, "")}/events/gateways`;
    const source = new EventSource(endpoint);

    source.addEventListener("open", () => {
      isConnected.value = true;
    });

    source.addEventListener("gateway-update", handleGatewayUpdate);
    source.addEventListener("error", handleGatewayError);

    gatewayEventSource = source;
  } catch (error) {
    console.error("Failed to connect to gateway SSE:", error);
    isConnected.value = false;
  }
}

function disconnectGatewaySse() {
  if (gatewayEventSource) {
    gatewayEventSource.close();
    gatewayEventSource = null;
    isConnected.value = false;
  }
}

function handleGatewayUpdate(event: MessageEvent) {
  if (!event.data) return;
  try {
    const payload = JSON.parse(event.data);
    updateGatewayFromPayload(payload);
  } catch (error) {
    console.error("Failed to parse gateway SSE payload:", error);
  }
}

function handleGatewayError(event: Event) {
  console.error("Gateway SSE error:", event);
  isConnected.value = false;
  // Optional: Implement reconnection logic here if needed
}

// UI Helpers
function formatStatus(status: DeviceRowStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColorClass(status: DeviceRowStatus) {
  if (status === "online") return "text-blue-600";
  return "text-rose-600";
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

function formatLastSeen(val: string | null) {
  if (!val) return "-";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return timeFormatter.format(date);
  } catch {
    return val;
  }
}

function formatRegistered(value?: boolean) {
  if (value === undefined) return "-";
  return value ? "True" : "False";
}

function registeredClass(value?: boolean) {
  if (value === undefined) {
    return "text-gray-400";
  }
  return value ? "text-blue-600" : "text-rose-600";
}
// Lifecycle
onMounted(() => {
  connectGatewaySse();
  startDeviceStatusPolling();
});

onBeforeUnmount(() => {
  disconnectGatewaySse();
  stopDeviceStatusPolling();
});
</script>


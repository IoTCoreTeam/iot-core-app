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
    <div class="px-4 pt-2 border-b border-slate-100">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="gateway" tab="Gateways" />
        <a-tab-pane key="node" tab="Nodes" />
        <a-tab-pane key="controller" tab="Controller" />
        <a-tab-pane key="sensor" tab="Sensor" />
      </a-tabs>
    </div>

    <div class="flex-1 overflow-auto">
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
            class="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase"
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
              <div class="text-[10px] text-gray-500">
                {{ device.short || device.id }}
              </div>
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
              {{ formatLastSeen(device.lastPing) }}
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
import { apiConfig } from "~~/config/api";

type ActiveDeviceStatus = "online" | "offline";

export interface ActiveDevice {
  id: string;
  short: string; // usually same as ID or a short code
  name: string;
  status: ActiveDeviceStatus;
  lastPing: string | null; // Timestamp string
  registered?: boolean;
  type: "gateway" | "node" | "controller" | "sensor";
}

// Internal State
const activeTab = ref<"gateway" | "node" | "controller" | "sensor">("gateway");
const isConnected = ref(false);

const gatewayRows = ref<ActiveDevice[]>([]);
const nodeRows = ref<ActiveDevice[]>([]); // To be implemented similarly
const controllerRows = ref<ActiveDevice[]>([]); // To be implemented similarly
const sensorRows = ref<ActiveDevice[]>([]); // To be implemented similarly

// Cache maps for efficient updates
const gatewayCache = new Map<string, ActiveDevice>();
let gatewayEventSource: EventSource | null = null;

// Derived State
const filteredDevices = computed(() => {
  switch (activeTab.value) {
    case "gateway":
      return gatewayRows.value;
    case "node":
      return nodeRows.value;
    case "controller":
      return controllerRows.value;
    case "sensor":
      return sensorRows.value;
    default:
      return [];
  }
});

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

function updateGatewayFromPayload(payload: any) {
  if (!payload?.id) return;

  // Only consider 'online' or specifically active devices if that's the intention of "ActiveDevicesPanel"
  // But usually we show all and filter by status or just show current state.
  // Assuming we show all known states for now, but sort by activity.

  const device: ActiveDevice = {
    id: payload.id,
    short: payload.id,
    name: payload.name || `Gateway ${payload.id}`,
    status: normalizeActiveDeviceStatus(payload.status),
    registered: payload.registered === true,
    lastPing: payload.lastSeen || null,
    type: "gateway",
  };

  gatewayCache.set(device.id, device);

  // Sync to reactive array and sort by lastPing descending
  gatewayRows.value = Array.from(gatewayCache.values()).sort((a, b) => {
    const timeA = a.lastPing ? new Date(a.lastPing).getTime() : 0;
    const timeB = b.lastPing ? new Date(b.lastPing).getTime() : 0;
    return timeB - timeA;
  });
}

function normalizeActiveDeviceStatus(value?: string | null): ActiveDeviceStatus {
  return (value ?? "").toLowerCase() === "online" ? "online" : "offline";
}

// UI Helpers
function formatStatus(status: ActiveDeviceStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColorClass(status: ActiveDeviceStatus) {
  if (status === "online") return "text-emerald-600";
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
});

onBeforeUnmount(() => {
  disconnectGatewaySse();
});
</script>

<style scoped>
:deep(.ant-tabs-nav) {
  margin-bottom: 0 !important;
}
:deep(.ant-tabs-tab) {
  padding: 8px 0 !important;
  margin: 0 16px 0 0 !important;
  font-size: 12px !important;
}
:deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin: 0 16px !important;
}
</style>

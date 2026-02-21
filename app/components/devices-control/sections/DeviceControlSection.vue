<template>
  <div class="flex flex-col gap-4 p-4 h-full">
    <SingleMetricChart
      class="w-full"
      :selected-metric-key="selectedMetricKey"
      :selected-timeframe="selectedTimeframe"
      @update:selected-metric-key="handleMetricChange"
    />
    <ControlWidgetBox
      :items="controlUrlItems"
      :is-loading="isLoadingControlUrls"
      :error="controlUrlLoadError"
      :on-execute="handleExecuteControlUrl"
      :has-sse="isSseConnected"
      :controller-states-by-node="controllerStatesByNode"
    />
    <DevicesControlContentSection :section="section" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import ControlWidgetBox from "@/components/devices-control/ControlWidgetBox.vue";
import DevicesControlContentSection from "@/components/devices-control/layouts/DevicesControlContentSection.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import { METRICS } from "~~/config/metric";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import { useControlUrlActions } from "@/composables/DeviceControl/useControlUrlActions";
import {
  createNodeCollectionsStore,
  type GatewayEventPayload,
} from "@/composables/DeviceRegistration/SSEHandle";
import type { TimeframeKey } from "@/types/dashboard";
import type { ControllerState, DeviceRow, Section } from "@/types/devices-control";

defineProps<{
  section: Section;
}>();

const selectedMetricKey = ref<string>(METRICS[0]?.key ?? "");
const selectedTimeframe = ref<TimeframeKey>("second");

type ControlUrlItem = {
  id: string;
  controller_id?: string | null;
  name?: string | null;
  url?: string | null;
  input_type?: string | null;
  node?: {
    id?: string | null;
    name?: string | null;
    external_id?: string | null;
    mac_address?: string | null;
    ip_address?: string | null;
    type?: string | null;
    gateway?: {
      id?: string | null;
      name?: string | null;
      external_id?: string | null;
      mac_address?: string | null;
      ip_address?: string | null;
    } | null;
  } | null;
};

const authStore = useAuthStore();
const { executeControlUrl } = useControlUrlActions();
const controlUrlItems = ref<ControlUrlItem[]>([]);
const isLoadingControlUrls = ref(false);
const controlUrlLoadError = ref<string | null>(null);
const nodeRows = ref<DeviceRow[]>([]);
const controllerStatesByNode = ref<Record<string, ControllerState[]>>({});
const isSseConnected = ref(false);

const nodeCollectionsStore = createNodeCollectionsStore();
let gatewayEventSource: EventSource | null = null;

function handleMetricChange(value: string) {
  selectedMetricKey.value = value;
}

async function fetchControlUrls() {
  if (!apiConfig.controlModule) return;
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    controlUrlLoadError.value = "Missing authorization.";
    return;
  }

  isLoadingControlUrls.value = true;
  controlUrlLoadError.value = null;
  try {
    const endpoint = `${apiConfig.controlModule.replace(/\/$/, "")}/control-urls?include=gateway&per_page=100`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to load control urls.");
    }
    const rows = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    controlUrlItems.value = rows as ControlUrlItem[];
  } catch (error: any) {
    controlUrlLoadError.value = error?.message ?? "Failed to load control urls.";
    controlUrlItems.value = [];
    message.error(controlUrlLoadError.value);
  } finally {
    isLoadingControlUrls.value = false;
  }
}

async function handleExecuteControlUrl(widget: {
  id: string;
  raw: ControlUrlItem;
}, nextState: boolean) {
  if (!apiConfig.controlModule) return;
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    throw new Error("Missing authorization.");
  }

  const url = widget.raw.url ?? "";
  if (!url) {
    throw new Error("Missing control URL.");
  }

  const state = nextState ? "on" : "off";
  await executeControlUrl(authorization, widget.id, {
    url,
    state,
  });

}

function handleGatewayUpdate(event: MessageEvent) {
  if (!event.data) {
    return;
  }

  try {
    const payload = JSON.parse(event.data) as GatewayEventPayload;
    nodeCollectionsStore.updateFromGatewayPayload(payload, {
      nodeRows,
      controllerStatesByNode,
    });
  } catch (error) {
    console.error("Failed to parse gateway SSE payload:", error);
  }
}

function handleGatewayReady() {
  isSseConnected.value = true;
}

function handleGatewayError(event: Event) {
  console.error("Gateway SSE error:", event);
  isSseConnected.value = false;
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
    source.addEventListener("ready", handleGatewayReady);
    source.addEventListener("error", handleGatewayError);
    source.onopen = handleGatewayReady;
    gatewayEventSource = source;
  } catch (error) {
    console.error("Failed to connect to gateway SSE:", error);
    isSseConnected.value = false;
  }
}

function disconnectGatewaySse() {
  if (gatewayEventSource) {
    gatewayEventSource.close();
    gatewayEventSource = null;
  }
  isSseConnected.value = false;
}

onMounted(() => {
  if (!import.meta.client) return;
  connectGatewaySse();
  fetchControlUrls();
});

onBeforeUnmount(() => {
  disconnectGatewaySse();
});
</script>

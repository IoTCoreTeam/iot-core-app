import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { DeviceRow } from "@/types/devices-control";
import { apiConfig } from "~~/config/api";
import { createNodeCollectionsStore, type GatewayEventPayload } from "@/composables/DeviceRegistration/SSEHandle";
import { useLoadDataRow } from "@/composables/DeviceRegistration/loadDataRow";

type ActiveDeviceRow = {
  key: string;
  kind: "gateway" | "node";
  row: DeviceRow;
  id: string;
};

export const useMapSectionActiveDevices = () => {
  const gatewayRows = ref<DeviceRow[]>([]);
  const nodeRows = ref<DeviceRow[]>([]);
  const isActiveDevicesLoading = ref(true);
  const ACTIVE_DEVICES_INITIAL_TIMEOUT_MS = 8000;
  const ACTIVE_DEVICES_RETRY_MS = 30000;
  let activeDevicesInitialTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let activeDevicesRetryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let gatewayEventSource: EventSource | null = null;
  const nodeCollectionsStore = createNodeCollectionsStore();

  const { updateGatewayFromPayload, startDeviceStatusPolling, stopDeviceStatusPolling } =
    useLoadDataRow({
      gatewayRows,
      nodeRows,
    });

  const ONLINE_DEVICE_STATUSES = new Set<DeviceRow["status"]>(["online"]);

  const activeDeviceRows = computed<ActiveDeviceRow[]>(() => {
    const gateways = gatewayRows.value
      .filter((row) => ONLINE_DEVICE_STATUSES.has(row.status))
      .map((row) => ({ key: `gateway-${row.id}`, kind: "gateway" as const, row, id: row.id }));
    const nodes = nodeRows.value
      .filter((row) => ONLINE_DEVICE_STATUSES.has(row.status))
      .map((row) => ({ key: `node-${row.id}`, kind: "node" as const, row, id: row.id }));
    return [...gateways, ...nodes].sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" }),
    );
  });

  function clearActiveDeviceTimers() {
    if (activeDevicesInitialTimeoutId) {
      clearTimeout(activeDevicesInitialTimeoutId);
      activeDevicesInitialTimeoutId = null;
    }
    if (activeDevicesRetryTimeoutId) {
      clearTimeout(activeDevicesRetryTimeoutId);
      activeDevicesRetryTimeoutId = null;
    }
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
      });
      isActiveDevicesLoading.value = false;
      clearActiveDeviceTimers();
    } catch (error) {
      console.error("Failed to parse gateway SSE payload:", error);
    }
  }

  function handleGatewayError(event: Event) {
    console.error("Gateway SSE error:", event);
    isActiveDevicesLoading.value = false;
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
      isActiveDevicesLoading.value = false;
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
    connectGatewaySse();
    startDeviceStatusPolling();
    clearActiveDeviceTimers();
    activeDevicesInitialTimeoutId = setTimeout(() => {
      if (activeDeviceRows.value.length === 0) {
        isActiveDevicesLoading.value = false;
        if (activeDevicesRetryTimeoutId) {
          clearTimeout(activeDevicesRetryTimeoutId);
        }
        activeDevicesRetryTimeoutId = setTimeout(() => {
          isActiveDevicesLoading.value = true;
          connectGatewaySse();
        }, ACTIVE_DEVICES_RETRY_MS);
      }
    }, ACTIVE_DEVICES_INITIAL_TIMEOUT_MS);
  });

  onBeforeUnmount(() => {
    disconnectGatewaySse();
    stopDeviceStatusPolling();
    clearActiveDeviceTimers();
  });

  return {
    gatewayRows,
    nodeRows,
    activeDeviceRows,
    isActiveDevicesLoading,
    clearNodeCache: () => nodeCollectionsStore.clearNodeCache({ nodeRows }),
  };
};

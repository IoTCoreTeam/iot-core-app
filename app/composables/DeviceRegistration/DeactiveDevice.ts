import { ref } from "vue";
import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import type { DeviceRow, DeviceTabKey } from "@/types/devices-control";

const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");
function resolveDeactivateEndpoint(deviceId: string, tab: DeviceTabKey) {
  if (!CONTROL_MODULE_BASE) {
    return null;
  }

  const encodedId = encodeURIComponent(deviceId);

  if (tab === "gateways") {
    return `${CONTROL_MODULE_BASE}/gateways/${encodedId}/deactivate`;
  }

  return `${CONTROL_MODULE_BASE}/nodes/${encodedId}/deactivate`;
}

export function useDeviceDeactivation() {
  const deactivatingDevices = ref<Record<string, boolean>>({});
  const authStore = useAuthStore();

  const isDeactivatingDevice = (id: string) => Boolean(deactivatingDevices.value[id]);

  async function deactivateDevice(row: DeviceRow, tab: DeviceTabKey) {
    if (!CONTROL_MODULE_BASE) {
      message.warning("Control module endpoint is not configured.");
      return false;
    }

    if (!row?.id) {
      return false;
    }

    if (isDeactivatingDevice(row.id)) {
      return false;
    }

    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      message.warning("Missing authentication token.");
      return false;
    }

    const endpoint = resolveDeactivateEndpoint(row.id, tab);
    if (!endpoint) {
      message.warning("Control module endpoint is not configured.");
      return false;
    }

    deactivatingDevices.value = {
      ...deactivatingDevices.value,
      [row.id]: true,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authorization,
          Accept: "application/json",
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage =
          payload?.message ?? "Failed to deactivate the selected device.";
        throw new Error(errorMessage);
      }

      message.success(payload?.message ?? "Device deactivated successfully.");
      return true;
    } catch (error: any) {
      console.error("Failed to deactivate device", error);
      message.error(error?.message ?? "Unable to deactivate the device.");
      return false;
    } finally {
      deactivatingDevices.value = {
        ...deactivatingDevices.value,
        [row.id]: false,
      };
    }
  }

  return {
    isDeactivatingDevice,
    deactivateDevice,
  };
}

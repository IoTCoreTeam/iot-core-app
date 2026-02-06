import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import type { DeviceRow, DeviceTabKey } from "@/types/devices-control";

const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");

export function useRegisterDevice() {
  const authStore = useAuthStore();

  function resolveRegisterEndpoint(tab: DeviceTabKey) {
    if (!CONTROL_MODULE_BASE) {
      return null;
    }
    if (tab === "gateways") {
      return `${CONTROL_MODULE_BASE}/gateways/register`;
    }
    return `${CONTROL_MODULE_BASE}/nodes/register`;
  }

  async function registerDevice(
    row: DeviceRow,
    options?: {
      tab?: DeviceTabKey;
      gatewayIp?: string | null;
      gatewayId?: string | null;
    },
  ): Promise<boolean> {
    if (!CONTROL_MODULE_BASE) {
      message.warning("Control module endpoint is not configured.");
      return false;
    }

    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      message.warning("Missing authentication token.");
      return false;
    }

    try {
      const tab = options?.tab ?? "gateways";
      const endpoint = resolveRegisterEndpoint(tab);
      if (!endpoint) {
        message.warning("Control module endpoint is not configured.");
        return false;
      }

      const registrationPayload =
        tab === "gateways"
          ? {
              name: row.name,
              ip_address: row.ip,
              mac_address: row.mac,
              external_id: row.id,
            }
          : {
              name: row.name,
              ip_address: options?.gatewayIp ?? null,
              mac_address: row.mac,
              external_id: row.id,
              gateway_id: options?.gatewayId ?? row.gatewayId ?? null,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationPayload),
      });

      const responsePayload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          responsePayload?.message ??
          (tab === "gateways"
            ? "Failed to enroll the selected gateway."
            : "Failed to enroll the selected node.");
        throw new Error(errorMessage);
      }

      message.success(
        responsePayload?.message ??
          (tab === "gateways" ? "Gateway enrolled." : "Node enrolled."),
      );
      row.registered = true;

      return true;
    } catch (error: any) {
      console.error("Failed to enroll device", error);
      message.error(error?.message ?? "Unable to enroll the device.");
      return false;
    }
  }

  return {
    registerDevice,
  };
}

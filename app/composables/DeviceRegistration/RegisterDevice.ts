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

  async function registerNode(
    row: DeviceRow,
    options?: {
      gatewayId?: string | null;
      gatewayIp?: string | null;
      type?: "controller" | "sensor" | "other" | string | null;
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

    const endpoint = `${CONTROL_MODULE_BASE}/nodes/register`;
    const payload = {
      name: row.name,
      ip_address: options?.gatewayIp ?? row.ip ?? null,
      mac_address: row.mac ?? null,
      external_id: row.id,
      gateway_id: options?.gatewayId ?? row.gatewayId ?? null,
      type: options?.type ?? null,
    };

    try {
      message.info({
        content: `Payload: ${JSON.stringify(payload)}`,
        duration: 5,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          responsePayload?.message ?? "Failed to register the selected node.",
        );
      }

      message.success(responsePayload?.message ?? "Node registered.");
      row.registered = true;
      return true;
    } catch (error: any) {
      console.error("Failed to register node", error);
      message.error(error?.message ?? "Unable to register the node.");
      return false;
    }
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

      message.info({
        content: `Payload: ${JSON.stringify(registrationPayload)}`,
        duration: 5,
      });

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
    registerNode,
  };
}

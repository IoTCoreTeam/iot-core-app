import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import type { DeviceRow } from "@/types/devices-control";

const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");

export function useRegisterDevice() {
  const authStore = useAuthStore();

  async function registerDevice(row: DeviceRow): Promise<boolean> {
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
      const registrationPayload = {
        name: row.name,
        ip_address: row.ip,
        mac_address: row.mac,
        external_id: row.id,
      };

      const response = await fetch(`${CONTROL_MODULE_BASE}/gateways/register`, {
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
          responsePayload?.message ?? "Failed to enroll the selected gateway.";
        throw new Error(errorMessage);
      }

      message.success(responsePayload?.message ?? "Gateway enrolled.");
      row.registered = true;

      return true;
    } catch (error: any) {
      console.error("Failed to enroll gateway", error);
      message.error(error?.message ?? "Unable to enroll the gateway.");
      return false;
    }
  }

  return {
    registerDevice,
  };
}

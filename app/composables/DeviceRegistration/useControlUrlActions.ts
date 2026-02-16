import { apiConfig } from "~~/config/api";

type ControlUrlPayload = {
  node_id: string;
  name: string;
  url: string;
  input_type: string;
  status: "on" | "off";
};

const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");

async function requestJson(
  endpoint: string,
  options: RequestInit,
): Promise<any> {
  const response = await fetch(endpoint, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Request failed.");
  }
  return payload;
}

export function useControlUrlActions() {
  async function createControlUrl(
    authorization: string,
    payload: ControlUrlPayload,
  ) {
    const endpoint = `${CONTROL_MODULE_BASE}/control-urls`;
    return requestJson(endpoint, {
      method: "POST",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async function updateControlUrl(
    authorization: string,
    id: string,
    payload: ControlUrlPayload,
  ) {
    const endpoint = `${CONTROL_MODULE_BASE}/control-urls/${id}`;
    return requestJson(endpoint, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async function deleteControlUrl(authorization: string, id: string) {
    const endpoint = `${CONTROL_MODULE_BASE}/control-urls/${id}`;
    return requestJson(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
  }

  return {
    createControlUrl,
    updateControlUrl,
    deleteControlUrl,
  };
}

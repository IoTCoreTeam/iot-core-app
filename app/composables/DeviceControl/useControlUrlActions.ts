import { apiConfig } from "~~/config/api";

type CreateControlUrlPayload = {
  controller_id: string;
  node_id: string;
  name: string;
  url: string;
  input_type: string;
};

type UpdateControlUrlPayload = {
  controller_id?: string;
  node_id?: string;
  name?: string;
  url?: string;
  input_type?: string;
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
    payload: CreateControlUrlPayload,
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
    payload: UpdateControlUrlPayload,
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

  async function executeControlUrl(
    authorization: string,
    id: string,
    payload: Record<string, any>,
  ) {
    const endpoint = `${CONTROL_MODULE_BASE}/control-urls/${id}/execute`;
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

  return {
    createControlUrl,
    updateControlUrl,
    deleteControlUrl,
    executeControlUrl,
  };
}

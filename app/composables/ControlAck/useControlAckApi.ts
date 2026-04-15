import {
  DEFAULT_CONTROL_ACK_BUCKET,
  DEFAULT_CONTROL_ACK_TOTALS,
  type ControlAckBucket,
  type ControlAckTotals,
  type ControlLogFilterState,
  type ControlLogRow,
} from "@/types/control-ack";
import { useAuthStore } from "~~/stores/auth";

type ControlAckOverviewResponse = {
  bucket?: string;
  buckets?: ControlAckBucket[];
  totals?: Partial<ControlAckTotals>;
};

type ControlAckOverviewResult = {
  bucket: "hour" | "minute";
  buckets: ControlAckBucket[];
  totals: ControlAckTotals;
};

export type ControllerExecutionPoint = {
  timestamp: string;
  count: number;
};

export type ControllerExecutionSeries = {
  controller: string;
  data: ControllerExecutionPoint[];
  total: number;
};

export type ControllerExecutionStatsResult = {
  node_id: string;
  range_hours: number;
  bucket: "hour" | "minute";
  step_ms: number;
  controllers: string[];
  timeline: Array<{ timestamp: string; total: number }>;
  series: ControllerExecutionSeries[];
  total_executions: number;
};

function fromLocalInputToIso(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

async function parseJsonResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (payload as { message?: string; error?: string })?.message ??
        (payload as { message?: string; error?: string })?.error ??
        `Request failed (${response.status}).`,
    );
  }
  return payload;
}

export function useControlAckApi(serverBaseUrl: string) {
  const SERVER_BASE_URL = (serverBaseUrl || "").replace(/\/$/, "");

  async function fetchOverview(
    hours = 24,
    bucket: "hour" | "minute" = "hour",
  ): Promise<ControlAckOverviewResult> {
    if (!import.meta.client || !SERVER_BASE_URL) {
      return {
        bucket: DEFAULT_CONTROL_ACK_BUCKET,
        buckets: [] as ControlAckBucket[],
        totals: { ...DEFAULT_CONTROL_ACK_TOTALS },
      };
    }
    const authStore = useAuthStore();
    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      return {
        bucket: DEFAULT_CONTROL_ACK_BUCKET,
        buckets: [] as ControlAckBucket[],
        totals: { ...DEFAULT_CONTROL_ACK_TOTALS },
      };
    }

    const response = await fetch(
      `${SERVER_BASE_URL}/v1/control-acks/overview?hours=${hours}&bucket=${bucket}`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: authorization },
      },
    );

    const payload = (await parseJsonResponse(response)) as ControlAckOverviewResponse;
    const totals = payload?.totals ?? {};

    return {
      bucket: payload?.bucket === "minute" ? "minute" : "hour",
      buckets: Array.isArray(payload?.buckets) ? payload.buckets : [],
      totals: {
        success: Number(totals?.success ?? 0),
        failed: Number(totals?.failed ?? 0),
        timeout: Number(totals?.timeout ?? 0),
        total: Number(totals?.total ?? 0),
      } as ControlAckTotals,
    };
  }

  async function fetchRows(filters: ControlLogFilterState, limit = 500, page = 1) {
    if (!import.meta.client || !SERVER_BASE_URL) {
      return [] as ControlLogRow[];
    }
    const authStore = useAuthStore();
    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      return [] as ControlLogRow[];
    }

    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("page", String(page));

    if (filters.gateway_id) params.set("gateway_id", filters.gateway_id);
    if (filters.node_id) params.set("node_id", filters.node_id);
    if (filters.device) params.set("device", filters.device);
    if (filters.state) params.set("state", filters.state);
    if (filters.status) params.set("status", filters.status);
    if (filters.topic) params.set("topic", filters.topic);

    const fromIso = fromLocalInputToIso(filters.timestamp_from);
    const toIso = fromLocalInputToIso(filters.timestamp_to);
    if (fromIso) params.set("timestamp_from", fromIso);
    if (toIso) params.set("timestamp_to", toIso);

    const response = await fetch(`${SERVER_BASE_URL}/v1/control-acks/query?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: authorization },
    });

    const payload = await parseJsonResponse(response);
    return Array.isArray(payload) ? (payload as ControlLogRow[]) : [];
  }

  async function fetchControllerExecutions(
    nodeId: string,
    options?: { hours?: number; bucket?: "hour" | "minute" },
  ): Promise<ControllerExecutionStatsResult | null> {
    if (!import.meta.client || !SERVER_BASE_URL || !nodeId) {
      return null;
    }
    const authStore = useAuthStore();
    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      return null;
    }

    const params = new URLSearchParams();
    params.set("node_id", nodeId);
    params.set("hours", String(options?.hours ?? 24));
    params.set("bucket", options?.bucket === "minute" ? "minute" : "hour");

    const response = await fetch(
      `${SERVER_BASE_URL}/v1/control-acks/controller-executions?${params.toString()}`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: authorization },
      },
    );

    const payload = (await parseJsonResponse(response)) as Partial<ControllerExecutionStatsResult>;
    if (!payload || typeof payload !== "object") return null;

    return {
      node_id: String(payload.node_id ?? nodeId),
      range_hours: Number(payload.range_hours ?? 24),
      bucket: payload.bucket === "minute" ? "minute" : "hour",
      step_ms: Number(payload.step_ms ?? 0),
      controllers: Array.isArray(payload.controllers)
        ? payload.controllers.map((item) => String(item))
        : [],
      timeline: Array.isArray(payload.timeline)
        ? payload.timeline.map((item: any) => ({
            timestamp: String(item?.timestamp ?? ""),
            total: Number(item?.total ?? 0),
          }))
        : [],
      series: Array.isArray(payload.series)
        ? payload.series.map((item: any) => ({
            controller: String(item?.controller ?? "unknown"),
            total: Number(item?.total ?? 0),
            data: Array.isArray(item?.data)
              ? item.data.map((point: any) => ({
                  timestamp: String(point?.timestamp ?? ""),
                  count: Number(point?.count ?? 0),
                }))
              : [],
          }))
        : [],
      total_executions: Number(payload.total_executions ?? 0),
    };
  }

  return {
    fetchOverview,
    fetchRows,
    fetchControllerExecutions,
  };
}

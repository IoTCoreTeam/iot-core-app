import type { Ref } from "vue";
import type { DeviceRow } from "@/types/devices-control";

export type NodeEventPayload = {
  gateway_id?: string | null;
  gatewayId?: string | null;
  id?: string | null;
  node_id?: string | null;
  nodeId?: string | null;
  name?: string | null;
  ip?: string | null;
  ip_address?: string | null;
  mac?: string | null;
  mac_address?: string | null;
  status?: string | null;
  registered?: boolean | null;
  lastSeen?: string | null;
  last_seen?: string | null;
  timestamp?: string | null;
  gateway_timestamp?: string | null;
  type?: string | null;
  node_type?: string | null;
  role?: string | null;
  category?: string | null;
};

export type GatewayEventPayload = {
  id?: string;
  name?: string | null;
  ip?: string | null;
  mac?: string | null;
  status?: string | null;
  registered?: boolean | null;
  lastSeen?: string | null;
  nodes?: NodeEventPayload[] | null;
};

type NodeCollectionsRefs = {
  nodeRows: Ref<DeviceRow[]>;
  controllerRows: Ref<DeviceRow[]>;
  sensorRows: Ref<DeviceRow[]>;
};

function normalizeStatus(value?: string | null): DeviceRow["status"] {
  return (value ?? "").toLowerCase() === "online" ? "online" : "offline";
}

function normalizeDeviceType(value?: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized.startsWith("node-")) {
    return normalized.slice("node-".length);
  }
  return normalized;
}

function resolveNodeId(payload: NodeEventPayload): string | null {
  return (
    payload.id ??
    payload.node_id ??
    payload.nodeId ??
    null
  );
}

function normalizeLastSeen(payload: NodeEventPayload, existing?: DeviceRow) {
  return (
    payload.lastSeen ??
    payload.last_seen ??
    payload.timestamp ??
    payload.gateway_timestamp ??
    existing?.lastSeen ??
    null
  );
}

function buildNodeRow(
  payload: NodeEventPayload,
  existing?: DeviceRow,
  gatewayId?: string | null,
): DeviceRow {
  const id = resolveNodeId(payload) ?? existing?.id ?? "unknown-node";
  return {
    id,
    name: payload.name ?? existing?.name ?? `Node ${id}`,
    gatewayId:
      payload.gateway_id ??
      payload.gatewayId ??
      gatewayId ??
      existing?.gatewayId ??
      null,
    ip: payload.ip ?? payload.ip_address ?? existing?.ip ?? null,
    mac: payload.mac ?? payload.mac_address ?? existing?.mac ?? null,
    type: normalizeDeviceType(
      payload.type ??
        payload.node_type ??
        existing?.type ??
        null,
    ),
    status: normalizeStatus(payload.status ?? existing?.status ?? null),
    registered: payload.registered ?? existing?.registered ?? false,
    lastSeen: normalizeLastSeen(payload, existing),
  };
}

function sortRows(rows: DeviceRow[]) {
  return rows.slice().sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function createNodeCollectionsStore() {
  const nodeCache = new Map<string, DeviceRow>();

  function syncToRefs(refs: NodeCollectionsRefs) {
    refs.nodeRows.value = sortRows(Array.from(nodeCache.values()));
    refs.controllerRows.value = [];
    refs.sensorRows.value = [];
  }

  function hydrateFromRows(refs: NodeCollectionsRefs) {
    nodeCache.clear();
    refs.nodeRows.value.forEach((row) => {
      if (!row?.id) return;
      nodeCache.set(row.id, row);
    });
    refs.controllerRows.value = [];
    refs.sensorRows.value = [];
  }

  function updateFromGatewayPayload(
    payload: GatewayEventPayload,
    refs: NodeCollectionsRefs,
  ) {
    const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
    if (!nodes.length) {
      return;
    }

    nodes.forEach((node) => {
      const id = resolveNodeId(node);
      if (!id) return;

      const existing = nodeCache.get(id);

      const row = buildNodeRow(node, existing, payload.id ?? null);

      nodeCache.set(id, row);
    });

    syncToRefs(refs);
  }

  return {
    hydrateFromRows,
    updateFromGatewayPayload,
  };
}

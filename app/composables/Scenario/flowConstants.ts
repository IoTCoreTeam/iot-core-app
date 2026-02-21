import type { Edge, Node } from "@vue-flow/core";

export type FlowNodeKind = "start" | "action" | "condition" | "end";

export type FlowNodeData = {
  kind?: FlowNodeKind;
};

export const FLOW_CONSTANTS = {
  maxStartNodes: 1,
  maxEndNodes: 1,
  maxConditionBranches: 2,
  maxOutgoingForNonCondition: 1,
} as const;

export function countKind(nodes: Node<FlowNodeData>[], kind: FlowNodeKind) {
  return nodes.filter((node) => node.data?.kind === kind).length;
}

export function getOutgoingEdges(edges: Edge[], sourceId: string) {
  return edges.filter((edge) => edge.source === sourceId);
}

export function resolveConditionBranch(outgoingEdges: Edge[]) {
  const existing = outgoingEdges
    .map((edge) => edge.data?.branch)
    .find((branch) => branch === "true" || branch === "false");
  if (existing === "true") return "false";
  if (existing === "false") return "true";
  return null;
}

export function canCreateStart(nodes: Node<FlowNodeData>[]) {
  return countKind(nodes, "start") < FLOW_CONSTANTS.maxStartNodes;
}

export function canCreateEnd(nodes: Node<FlowNodeData>[]) {
  return countKind(nodes, "end") < FLOW_CONSTANTS.maxEndNodes;
}

export function canConnectFromNode(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  sourceId: string,
) {
  const sourceNode = nodes.find((node) => node.id === sourceId);
  if (!sourceNode) return { ok: false, reason: "Source node not found." };
  const kind = sourceNode.data?.kind;
  if (kind === "end") return { ok: false, reason: "End node cannot connect." };
  const outgoing = getOutgoingEdges(edges, sourceId);
  if (kind !== "condition" && outgoing.length >= FLOW_CONSTANTS.maxOutgoingForNonCondition) {
    return { ok: false, reason: "Each node can only connect to one other node." };
  }
  if (kind === "condition" && outgoing.length >= FLOW_CONSTANTS.maxConditionBranches) {
    return { ok: false, reason: "Condition node can only have two branches." };
  }
  return { ok: true, kind, outgoing };
}

export function hasPathStartToEnd(nodes: Node<FlowNodeData>[], edges: Edge[]) {
  const start = nodes.find((node) => node.data?.kind === "start");
  const end = nodes.find((node) => node.data?.kind === "end");
  if (!start || !end) return false;
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!edge.source || !edge.target) return;
    const next = adjacency.get(edge.source) ?? [];
    next.push(edge.target);
    adjacency.set(edge.source, next);
  });
  const visited = new Set<string>();
  const queue = [start.id];
  while (queue.length) {
    const current = queue.shift();
    if (!current) continue;
    if (current === end.id) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const neighbors = adjacency.get(current) ?? [];
    neighbors.forEach((next) => {
      if (!visited.has(next)) queue.push(next);
    });
  }
  return false;
}

export function validateFlow(nodes: Node<FlowNodeData>[], edges: Edge[]) {
  const startCount = countKind(nodes, "start");
  const endCount = countKind(nodes, "end");
  if (startCount !== FLOW_CONSTANTS.maxStartNodes || endCount !== FLOW_CONSTANTS.maxEndNodes) {
    return {
      ok: false,
      message: "Flow must have exactly one Start and one End node.",
    };
  }
  if (!hasPathStartToEnd(nodes, edges)) {
    return { ok: false, message: "Flow must connect Start to End." };
  }
  return { ok: true };
}

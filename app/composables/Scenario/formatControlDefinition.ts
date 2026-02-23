import type { Edge, Node } from "@vue-flow/core";

type BranchValue = "true" | "false";

export type ControlDefinitionNode = {
  id: string | null;
  type: "start" | "action" | "condition" | "end";
  control_url_id?: string | null;
  duration_seconds?: number | null;
  metric_key?: string | null;
  operator?: string | null;
  value?: number | null;
};

export type ControlDefinitionEdge = {
  source: string | null;
  target: string | null;
  branch?: BranchValue | null;
};

export type ControlDefinition = {
  version: number;
  nodes: ControlDefinitionNode[];
  edges: ControlDefinitionEdge[];
};

type NodeData = {
  kind?: "start" | "action" | "condition" | "end";
  control_url_id?: string;
  duration_seconds?: number;
  metric_key?: string;
  operator?: string;
  value?: number;
};

function normalizeBranch(value: unknown): BranchValue | null {
  if (value === "true" || value === "false") return value;
  return null;
}

export function formatControlDefinition(
  nodes: Node<NodeData>[],
  edges: Edge[],
): ControlDefinition {
  const formattedNodes: ControlDefinitionNode[] = nodes.map((node) => {
    const kind = node.data?.kind ?? "action";
    const base: ControlDefinitionNode = {
      id: node.id ?? null,
      type: kind,
    };

    if (kind === "action") {
      return {
        ...base,
        control_url_id: node.data?.control_url_id ?? null,
        duration_seconds:
          typeof node.data?.duration_seconds === "number"
            ? node.data.duration_seconds
            : null,
      };
    }

    if (kind === "condition") {
      return {
        ...base,
        metric_key: node.data?.metric_key ?? null,
        operator: node.data?.operator ?? null,
        value:
          typeof node.data?.value === "number" ? node.data.value : null,
      };
    }

    return base;
  });

  const formattedEdges: ControlDefinitionEdge[] = edges.map((edge) => ({
    source: edge.source ?? null,
    target: edge.target ?? null,
    branch: normalizeBranch(edge.data?.branch ?? edge.label),
  }));

  return {
    version: 1,
    nodes: formattedNodes,
    edges: formattedEdges,
  };
}

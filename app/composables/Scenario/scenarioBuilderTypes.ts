import type { Edge, Node } from "@vue-flow/core";

export type ScenarioNodeData = {
  label?: string;
  kind?: "start" | "action" | "condition" | "end";
  control_url_id?: string;
  duration_seconds?: number;
  action_value?: string | number;
  metric_key?: string;
  operator?: string;
  value?: number;
};

export type ScenarioDefinition = {
  nodes?: Node<ScenarioNodeData>[];
  edges?: Edge[];
} | null;

export type ControlUrlOption = {
  id: string;
  name?: string | null;
  url?: string | null;
  input_type?: string | null;
  node?: {
    id?: string | null;
    external_id?: string | null;
    name?: string | null;
    gateway?: {
      id?: string | null;
      external_id?: string | null;
      name?: string | null;
    } | null;
  } | null;
};

export type WorkflowRuntimeState =
  | "idle"
  | "queued"
  | "running"
  | "stopping"
  | "error";

export type WorkflowRuntimeStatus =
  | "idle"
  | "queued"
  | "running"
  | "stopping"
  | "stopped"
  | "error";

const baseClassName =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border";

const workflowRuntimeStateMeta: Record<
  WorkflowRuntimeStatus,
  { label: string; className: string }
> = {
  idle: {
    label: "Idle",
    className: `${baseClassName} bg-gray-100 text-gray-600 border-gray-200`,
  },
  queued: {
    label: "Queued",
    className: `${baseClassName} bg-cyan-50 text-cyan-700 border-cyan-200`,
  },
  running: {
    label: "Running",
    className: `${baseClassName} bg-blue-50 text-blue-700 border-blue-200`,
  },
  stopping: {
    label: "Stopping",
    className: `${baseClassName} bg-amber-50 text-amber-700 border-amber-200`,
  },
  stopped: {
    label: "Stopped",
    className: `${baseClassName} bg-slate-100 text-slate-700 border-slate-200`,
  },
  error: {
    label: "Error",
    className: `${baseClassName} bg-red-50 text-red-700 border-red-200`,
  },
};

export function normalizeWorkflowRuntimeStatus(
  status: string | null | undefined,
): WorkflowRuntimeStatus {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "queued") return "queued";
  if (normalized === "running") return "running";
  if (normalized === "stopping") return "stopping";
  if (normalized === "stopped") return "stopped";
  if (normalized === "error") return "error";
  return "idle";
}

export function getWorkflowRuntimeStateMeta(status: string | null | undefined) {
  return workflowRuntimeStateMeta[normalizeWorkflowRuntimeStatus(status)];
}

export function isWorkflowBusyStatus(status: string | null | undefined) {
  const normalized = normalizeWorkflowRuntimeStatus(status);
  return normalized === "queued" || normalized === "running" || normalized === "stopping";
}

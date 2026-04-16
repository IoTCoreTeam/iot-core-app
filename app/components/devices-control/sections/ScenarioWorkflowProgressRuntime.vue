<template>
  <WorkflowProgressPanel
    :workflow-steps="workflowSteps"
    :current-workflow-step="currentWorkflowStep"
    :workflow-overall-status="workflowOverallStatus"
    :workflow-error-message="workflowErrorMessage"
    @clear="$emit('clear')"
  />
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import WorkflowProgressPanel from "@/components/devices-control/sections/WorkflowProgressPanel.vue";
import type {
  WorkflowRuntimeSnapshot,
} from "@/composables/Scenario/useScenarioWorkflowRuntime";
import type { WorkflowRuntimeState } from "@/composables/Scenario/scenarioBuilderTypes";

type WorkflowStep = {
  key: string;
  title: string;
  status: "wait" | "process" | "finish" | "error";
  description?: string;
};

const props = defineProps<{
  scenarioId: string | number;
  workflowSteps: WorkflowStep[];
  currentWorkflowStep: number;
  workflowOverallStatus: "wait" | "process" | "finish" | "error";
  workflowErrorMessage?: string | null;
  currentWorkflowRunId?: string | null;
  workflowRuntimeState?: WorkflowRuntimeState;
}>();

const emit = defineEmits<{
  (e: "clear"): void;
  (e: "restore", snapshot: WorkflowRuntimeSnapshot): void;
}>();

const storageKey = computed(
  () => `scenario-workflow-progress:${String(props.scenarioId ?? "").trim() || "unknown"}`,
);

function loadSnapshot() {
  if (!import.meta.client) return;
  const raw = sessionStorage.getItem(storageKey.value);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as WorkflowRuntimeSnapshot;
    emit("restore", parsed);
  } catch {
    sessionStorage.removeItem(storageKey.value);
  }
}

function persistSnapshot() {
  if (!import.meta.client) return;
  const snapshot: WorkflowRuntimeSnapshot = {
    workflowSteps: props.workflowSteps ?? [],
    currentWorkflowStep: Number(props.currentWorkflowStep ?? 0),
    workflowErrorMessage: props.workflowErrorMessage ?? null,
    currentWorkflowRunId: props.currentWorkflowRunId ?? null,
    workflowRuntimeState: props.workflowRuntimeState ?? "idle",
  };
  sessionStorage.setItem(storageKey.value, JSON.stringify(snapshot));
}

watch(
  () => props.scenarioId,
  () => {
    loadSnapshot();
  },
  { immediate: true },
);

watch(
  () => [
    props.workflowSteps,
    props.currentWorkflowStep,
    props.workflowErrorMessage,
    props.currentWorkflowRunId,
    props.workflowRuntimeState,
  ],
  () => {
    persistSnapshot();
  },
  { deep: true },
);
</script>

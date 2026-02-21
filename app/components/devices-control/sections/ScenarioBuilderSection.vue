<template>
  <section class="bg-white rounded border border-slate-200 p-4">
    <div class="border-b border-gray-200 pb-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Back to list"
            title="Back to list"
            @click="$emit('back')"
          >
            <BootstrapIcon name="arrow-left" class="h-3.5 w-3.5" />
          </button>
            <h3 class="text-sm font-semibold text-gray-800">Scenario Builder</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            @click="resetFlow"
          >
            <BootstrapIcon name="arrow-counterclockwise" class="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
      <div class="mt-3 w-full">
        <div class="flex flex-wrap items-center gap-2">
          <div
            v-for="node in palette"
            :key="node.type"
            class="cursor-grab rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-blue-300 active:cursor-grabbing"
            draggable="true"
            @dragstart="handleDragStart($event, node.type)"
          >
            <div class="flex items-center gap-2">
              <span class="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-blue-600">
                <BootstrapIcon :name="node.icon as any" class="h-3 w-3" />
              </span>
              <div class="leading-tight">
                <div class="font-semibold">{{ node.label }}</div>
                <div class="text-[10px] text-gray-400">{{ node.subtitle }}</div>
              </div>
            </div>
          </div>
          <span class="text-[10px] text-gray-400">
            Drop nodes onto the canvas to build a flow.
          </span>
        </div>
      </div>
    </div>

    <div
      class="mt-4 min-h-[420px] rounded border border-gray-200 bg-slate-50 "
      @drop="handleDrop"
      @dragover="handleDragOver"
    >
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1 }"
        :fit-view-on-init="true"
        class="scenario-flow rounded bg-white"
        @connect="handleConnect"
      >
      </VueFlow>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  VueFlow,
  type Connection,
  type Edge,
  type Node,
  useVueFlow,
} from "@vue-flow/core";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

type ScenarioRow = {
  id: string | number;
  name: string | null;
};

const props = defineProps<{
  scenario: ScenarioRow;
}>();

defineEmits<{
  (e: "back"): void;
}>();

const palette = [
  {
    type: "start",
    label: "Start",
    subtitle: "Entry point",
    icon: "play-fill",
  },
  {
    type: "action",
    label: "Action",
    subtitle: "Trigger control",
    icon: "lightning-fill",
  },
  {
    type: "condition",
    label: "Condition",
    subtitle: "If / else",
    icon: "shuffle",
  },
] as const;

const { addNodes, addEdges, project } = useVueFlow();

const nodes = ref<Node[]>([
  {
    id: "start-node",
    type: "default",
    position: { x: 100, y: 80 },
    data: { label: "Start" },
  },
]);

const edges = ref<Edge[]>([]);

function handleDragStart(event: DragEvent, type: string) {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData("application/vueflow", type);
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function buildNodeLabel(type: string) {
  const item = palette.find((entry) => entry.type === type);
  return item?.label ?? type;
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  if (!event.dataTransfer) return;
  const type = event.dataTransfer.getData("application/vueflow");
  if (!type) return;
  const position = project({
    x: event.clientX,
    y: event.clientY,
  });
  const id = `${type}-${Date.now()}`;
  addNodes([
    {
      id,
      type: "default",
      position,
      data: { label: buildNodeLabel(type) },
    },
  ]);
}

function handleConnect(connection: Connection) {
  addEdges([connection]);
}

function resetFlow() {
  nodes.value = [
    {
      id: "start-node",
      type: "default",
      position: { x: 100, y: 80 },
      data: { label: "Start" },
    },
  ];
  edges.value = [];
}
</script>

<style scoped>
.scenario-flow {
  height: 420px;
  width: 100%;
}
</style>

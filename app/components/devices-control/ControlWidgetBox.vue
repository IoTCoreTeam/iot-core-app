<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    <div
      v-for="(widget, index) in widgets"
      :key="widget.id"
      class="group relative rounded border border-slate-200 bg-white p-6
             transition-all duration-200"
    >
      <!-- Status Indicator -->
      <div
        class="absolute top-4 right-4 flex h-3 w-3 items-center justify-center rounded-full"
        :class="widget.isOn
          ? 'bg-emerald-500 ring-4 ring-emerald-100'
          : 'bg-slate-300 ring-4 ring-slate-100'"
      />

      <!-- Content -->
      <div class="space-y-4">
        <!-- Gateway -->
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Gateway
          </p>
          <p class="text-sm font-semibold text-slate-900">
            {{ widget.gatewayName }}
          </p>
        </div>

        <!-- Node -->
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Node
          </p>
          <p class="text-sm font-medium text-slate-800">
            {{ widget.nodeName }}
          </p>
        </div>

        <!-- Controller -->
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Controller
          </p>
          <p class="text-sm font-medium text-slate-800">
            {{ widget.controllerName }}
          </p>
        </div>
      </div>

      <!-- Toggle Button -->
      <button
        type="button"
        class="mt-6 flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5
               text-xs font-semibold transition-all duration-200
               focus:outline-none focus:ring-2 focus:ring-offset-1"
        :class="widget.isOn
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-300'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300'"
        :aria-pressed="widget.isOn"
        @click="toggleWidget(index)"
      >
        <span
          class="inline-block h-2 w-2 rounded-full"
          :class="widget.isOn ? 'bg-emerald-500' : 'bg-slate-400'"
        />
        <span>
          {{ widget.isOn ? 'ON' : 'OFF' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

type ControlWidget = {
  id: string;
  gatewayName: string;
  nodeName: string;
  controllerName: string;
  isOn: boolean;
};

const widgets = ref<ControlWidget[]>([
  {
    id: "widget-1",
    gatewayName: "Gateway A",
    nodeName: "Node 01",
    controllerName: "Controller Alpha",
    isOn: true,
  },
  {
    id: "widget-2",
    gatewayName: "Gateway B",
    nodeName: "Node 02",
    controllerName: "Controller Beta",
    isOn: false,
  },
  {
    id: "widget-3",
    gatewayName: "Gateway C",
    nodeName: "Node 03",
    controllerName: "Controller Gamma",
    isOn: true,
  },
  {
    id: "widget-4",
    gatewayName: "Gateway D",
    nodeName: "Node 04",
    controllerName: "Controller Delta",
    isOn: false,
  },
  {
    id: "widget-5",
    gatewayName: "Gateway E",
    nodeName: "Node 05",
    controllerName: "Controller Epsilon",
    isOn: true,
  },
]);

function toggleWidget(index: number) {
  const widget = widgets.value[index];
  if (!widget) return;
  widget.isOn = !widget.isOn;
}
</script>

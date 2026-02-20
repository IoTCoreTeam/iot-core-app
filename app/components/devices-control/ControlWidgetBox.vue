<template>
  <div class="space-y-3">
    <div v-if="error" class="text-xs text-red-500">
      {{ error }}
    </div>
    <div v-else-if="isLoading" class="text-xs text-slate-500">
      Loading control urls...
    </div>
    <div v-else-if="!widgets.length" class="text-xs text-slate-500">
      No control urls found.
    </div>
    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <div
        v-for="widget in widgets"
        :key="widget.id"
        class="group relative rounded border border-slate-200 bg-white p-6
               transition-all duration-200"
      >
        <!-- Status Indicator -->
        <div
          class="absolute top-4 right-4 flex h-3 w-3 items-center justify-center rounded-full"
          :class="isWidgetOn(widget)
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

        <div class="mt-6 flex gap-2">
          <!-- Toggle Button -->
          <button
            v-if="isDigitalInput(widget)"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5
                   text-xs font-semibold transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-offset-1"
            :class="isWidgetOn(widget)
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-300'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:ring-slate-300'"
            :aria-pressed="isWidgetOn(widget)"
            :disabled="isExecuting(widget.id)"
            @click="toggleWidget(widget)"
          >
            <span
              class="inline-block h-2 w-2 rounded-full"
              :class="isWidgetOn(widget) ? 'bg-emerald-500' : 'bg-slate-400'"
            />
            <span>
              {{ isWidgetOn(widget) ? "ON" : "OFF" }}
            </span>
          </button>
          <div
            v-else
            class="flex w-full items-center justify-center rounded-md border border-slate-200
                   bg-slate-50 px-3 py-2.5 text-center text-xs font-semibold text-slate-500"
          >
            Input type not supported.
          </div>
          <button
            type="button"
            class="flex items-center justify-center rounded-md border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            @click="openDetail(widget)"
          >
            Details
          </button>
        </div>
      </div>
    </div>

    <ControlUrlDetailModal
      v-if="selectedWidget"
      v-model="isDetailOpen"
      :control-url="selectedWidget.raw"
      @close="closeDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { message } from "ant-design-vue";
import ControlUrlDetailModal from "@/components/Modals/Devices/ControlUrlDetailModal.vue";

type ControlUrlItem = {
  id: string;
  name?: string | null;
  url?: string | null;
  input_type?: string | null;
  status?: string | null;
  node?: {
    id?: string | null;
    name?: string | null;
    external_id?: string | null;
    mac_address?: string | null;
    ip_address?: string | null;
    type?: string | null;
    gateway?: {
      id?: string | null;
      name?: string | null;
      external_id?: string | null;
      mac_address?: string | null;
      ip_address?: string | null;
    } | null;
  } | null;
};

type ControlWidget = {
  id: string;
  gatewayName: string;
  nodeName: string;
  controllerName: string;
  isOn: boolean;
  raw: ControlUrlItem;
};

const props = defineProps<{
  items: ControlUrlItem[];
  isLoading?: boolean;
  error?: string | null;
  onExecute?: (widget: ControlWidget, nextState: boolean) => Promise<void>;
}>();

const widgetState = ref<Record<string, boolean>>({});
const executingMap = ref<Record<string, boolean>>({});
const isDetailOpen = ref(false);
const selectedWidget = ref<ControlWidget | null>(null);

const widgets = computed<ControlWidget[]>(() =>
  (props.items ?? []).map((item) => ({
    id: item.id,
    gatewayName:
      item.node?.gateway?.name ??
      item.node?.gateway?.external_id ??
      "N/A",
    nodeName: item.node?.name ?? item.node?.external_id ?? "N/A",
    controllerName: item.name ?? item.url ?? "N/A",
    isOn: item.status === "on",
    raw: item,
  })),
);

function isWidgetOn(widget: ControlWidget) {
  const state = widgetState.value[widget.id];
  return typeof state === "boolean" ? state : widget.isOn;
}

function isExecuting(id: string) {
  return executingMap.value[id] === true;
}

async function toggleWidget(widget: ControlWidget) {
  const nextState = !isWidgetOn(widget);
  if (!props.onExecute) {
    widgetState.value[widget.id] = nextState;
    return;
  }

  if (isExecuting(widget.id)) {
    return;
  }

  executingMap.value[widget.id] = true;
  try {
    await props.onExecute(widget, nextState);
    widgetState.value[widget.id] = nextState;
  } catch (error: any) {
    message.error(error?.message ?? "Failed to execute control url.");
  } finally {
    executingMap.value[widget.id] = false;
  }
}

function isDigitalInput(widget: ControlWidget) {
  return String(widget.raw.input_type ?? "").toLowerCase() === "digital";
}

function openDetail(widget: ControlWidget) {
  selectedWidget.value = widget;
  isDetailOpen.value = true;
}

function closeDetail() {
  isDetailOpen.value = false;
  selectedWidget.value = null;
}
</script>

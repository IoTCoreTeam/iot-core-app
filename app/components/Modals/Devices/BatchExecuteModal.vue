<template>
  <BaseModal
    :model-value="modelValue"
    title="Batch Execute Controls"
    max-width="max-w-2xl"
    @request-close="handleClose"
  >
    <div class="space-y-4 text-xs text-gray-700">
      <div class="flex items-center gap-3 pb-3 border-b border-gray-200">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            @change="toggleSelectAll"
          />
          <span class="font-medium">Select All Online</span>
        </label>
        <span class="ml-auto text-gray-500">
          {{ selectedIds.length }} / {{ onlineItems.length }} selected
          <span v-if="offlineItems.length > 0" class="text-red-400 ml-1">
            ({{ offlineItems.length }} offline)
          </span>
        </span>
      </div>

      <div v-if="items.length === 0" class="text-center text-gray-500 py-8">
        No items match the selected input type.
      </div>

      <div v-else class="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
        <!-- Online items -->
        <div
          v-for="item in onlineItems"
          :key="item.id"
          class="flex items-center gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            :value="item.id"
            v-model="selectedIds"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 truncate">
              {{ item.name }}
            </div>
            <div class="text-[10px] text-gray-500 mt-0.5">
              <span class="font-semibold">Gateway:</span> {{ item.gatewayName }}
              <span class="mx-1">|</span>
              <span class="font-semibold">Node:</span> {{ item.nodeName }}
            </div>
          </div>
          <span
            class="shrink-0 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium"
            :class="badgeClass(item.inputType)"
          >
            {{ item.inputType }}
          </span>
        </div>

        <!-- Offline items -->
        <div
          v-for="item in offlineItems"
          :key="item.id"
          class="flex items-center gap-3 p-3 rounded border border-gray-200 bg-gray-50 opacity-60"
        >
          <input
            type="checkbox"
            disabled
            class="h-4 w-4 rounded border-gray-300 text-gray-300 shrink-0 cursor-not-allowed"
          />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-500 truncate line-through">
              {{ item.name }}
            </div>
            <div class="text-[10px] text-gray-400 mt-0.5">
              <span class="font-semibold">Gateway:</span> {{ item.gatewayName }}
              <span class="mx-1">|</span>
              <span class="font-semibold">Node:</span> {{ item.nodeName }}
            </div>
          </div>
          <span
            class="shrink-0 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-600 border border-red-200"
          >
            Offline
          </span>
        </div>
      </div>

      <div v-if="isAnalogType" class="flex items-center gap-3 pt-2">
        <label class="font-medium text-gray-700">Analog Value:</label>
        <a-input-number
          v-model:value="analogValue"
          class="w-32"
          :min="0"
          :max="100"
          :step="1"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="selectedIds.length === 0 || isExecuting"
          @click="handleExecute"
        >
          {{ isExecuting ? "Executing..." : `Execute (${selectedIds.length})` }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseModal from "../BaseModal.vue";
import type { ControllerState } from "@/types/devices-control";

type BatchItem = {
  id: string;
  baseId: string;
  name: string;
  gatewayName: string;
  nodeName: string;
  inputType: string;
  raw: any;
  selectedJsonCommand?: {
    id?: string | null;
    name?: string | null;
    command?: unknown;
  } | null;
};

const props = defineProps<{
  modelValue: boolean;
  items: BatchItem[];
  inputType: string;
  controllerStatesByNode?: Record<string, ControllerState[]>;
  hasSse?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "execute", targets: BatchItem[]): void;
}>();

const selectedIds = ref<string[]>([]);
const isExecuting = ref(false);
const analogValue = ref<number>(50);

function normalizeKey(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length ? normalized : null;
}

function resolveNodeKey(item: BatchItem) {
  const node = item.raw?.node;
  return normalizeKey(node?.external_id ?? node?.id ?? node?.name ?? null);
}

function resolveControllerId(item: BatchItem) {
  return normalizeKey(
    item.raw?.controller_id ?? item.selectedJsonCommand?.id ?? null,
  );
}

function resolveControllerStateValue(state: ControllerState) {
  const raw = state.state ?? state.status ?? state.value ?? null;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (["on", "true", "1", "open", "opened", "enabled"].includes(normalized)) {
      return true;
    }
    if (["off", "false", "0", "close", "closed", "disabled"].includes(normalized)) {
      return false;
    }
  }
  return null;
}

function resolveMatchedControllerState(
  controllers: ControllerState[],
  controllerId: string,
) {
  return (
    controllers.find((c) => normalizeKey(c.id) === controllerId) ??
    controllers.find((c) => normalizeKey(c.name) === controllerId) ??
    null
  );
}

function isItemOnline(item: BatchItem): boolean {
  if (!props.hasSse) return false;
  const nodeKey = resolveNodeKey(item);
  if (!nodeKey) return false;
  const controllers = props.controllerStatesByNode?.[nodeKey];
  if (!Array.isArray(controllers) || controllers.length === 0) {
    return false;
  }
  const controllerId = resolveControllerId(item);
  if (!controllerId) return false;
  const match = resolveMatchedControllerState(controllers, controllerId);
  if (!match) return false;
  return resolveControllerStateValue(match) !== null;
}

const onlineItems = computed(() => props.items.filter((item) => isItemOnline(item)));
const offlineItems = computed(() => props.items.filter((item) => !isItemOnline(item)));

const isAnalogType = computed(() => {
  return props.inputType === "analog" || props.inputType === "json_command.analog";
});

const isAllSelected = computed(() => {
  if (onlineItems.value.length === 0) return false;
  return selectedIds.value.length === onlineItems.value.length;
});

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < onlineItems.value.length;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = onlineItems.value.map((item) => item.id);
  }
}

function badgeClass(inputType: string) {
  if (inputType.includes("digital")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (inputType.includes("analog")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  return "bg-gray-50 text-gray-700 border border-gray-200";
}

function handleClose() {
  emit("update:modelValue", false);
  emit("close");
}

function handleExecute() {
  const targets = props.items.filter((item) => selectedIds.value.includes(item.id));
  if (targets.length === 0) return;
  isExecuting.value = true;
  emit("execute", targets);
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      selectedIds.value = [];
      isExecuting.value = false;
      if (isAnalogType.value && analogValue.value === 0) {
        analogValue.value = 50;
      }
    }
  }
);

watch(
  () => props.items,
  () => {
    selectedIds.value = [];
  },
  { immediate: true }
);
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    :max-width="maxWidth"
    panel-class="p-6 shadow-xl"
    @request-close="handleClose"
  >
    <div class="space-y-6 text-xs text-gray-700">
      <LoadingState
        v-if="loading"
        message="Loading node details..."
      />

      <div
        v-else-if="!nodeView"
        class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 text-center"
      >
        Node information is unavailable.
      </div>

      <template v-else>
        <section class="space-y-4">
          <div class="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 class="text-xs font-semibold text-gray-700">Node Information</h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded bg-gray-50 p-3 border border-gray-200">
              <p class="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                External ID
              </p>
              <p class="text-gray-900 text-xs break-all">{{ nodeView.externalId }}</p>
            </div>

            <div class="rounded bg-gray-50 p-3 border border-gray-200">
              <p class="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                Name
              </p>
              <p class="text-gray-900 text-xs">{{ nodeView.name }}</p>
            </div>

            <div class="rounded bg-gray-50 p-3 border border-gray-200">
              <p class="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                Type
              </p>
              <p class="text-gray-900 text-xs">{{ nodeView.type }}</p>
            </div>

            <div class="rounded bg-gray-50 p-3 border border-gray-200">
              <p class="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                Gateway ID
              </p>
              <p class="text-gray-900 text-xs break-all">{{ nodeView.gatewayId }}</p>
            </div>

            <div class="rounded bg-gray-50 p-3 border border-gray-200">
              <p class="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                MAC Address
              </p>
              <p class="text-gray-900 text-xs">{{ nodeView.mac }}</p>
            </div>

            <div class="rounded bg-gray-50 p-3 border border-gray-200">
              <p class="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1">
                Last Seen
              </p>
              <p class="text-gray-900 text-xs">{{ nodeView.lastSeen }}</p>
            </div>
          </div>
        </section>

        <section v-if="hasExtendedSlot" class="space-y-4">
          <div class="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 class="text-xs font-semibold text-gray-700">{{ extendedTitle }}</h4>
            <slot name="extended-header" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <slot />
          </div>
        </section>
      </template>
    </div>

    <template v-if="hasFooterSlot" #footer>
      <slot name="footer" />
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import LoadingState from "@/components/common/LoadingState.vue";
import BaseModal from "../BaseModal.vue";
import type { NodeInfo } from "@/types/devices-control";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    node: NodeInfo | null;
    extendedTitle?: string;
    maxWidth?: string;
    loading?: boolean;
  }>(),
  {
    title: "Node Details",
    extendedTitle: "Extended Details",
    maxWidth: "max-w-4xl",
    loading: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

const slots = useSlots();
const hasExtendedSlot = computed(() => Boolean(slots.default));
const hasFooterSlot = computed(() => Boolean(slots.footer));

const nodeView = computed(() => {
  const node = props.node as NodeInfo | null;
  if (!node) return null;

  return {
    id: formatValue(node.id ?? "--"),
    externalId: formatValue(node.external_id ?? "--"),
    name: formatValue(node.name ?? "--"),
    type: formatValue(node.type ?? "--"),
    gatewayId: formatValue(node.gateway_id ?? "--"),
    ip: formatValue(node.ip_address ?? "--"),
    mac: formatValue(node.mac_address ?? "--"),
    status: formatValue(node.status ?? "--"),
    registered:
      typeof node.registered === "boolean"
        ? node.registered
          ? "true"
          : "false"
        : "--",
    lastSeen: formatLastSeen(node.last_seen),
  };
});


function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function formatLastSeen(value?: string | null) {
  if (!value) return "N/A";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function handleClose() {
  emit("update:modelValue", false);
  emit("close");
}
</script>

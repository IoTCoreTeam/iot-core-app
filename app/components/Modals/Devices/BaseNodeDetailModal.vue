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
            <span class="text-[10px] uppercase tracking-wider text-gray-500">
              {{ nodeView.externalId }}
            </span>
          </div>

          <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table class="w-full text-xs">
              <tbody>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    Name
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ nodeView.name }}
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    Type
                  </td>
                  <td class="px-4 py-3 text-gray-900">
                    {{ nodeView.type }}
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    Gateway ID
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ nodeView.gatewayId }}
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    MAC
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ nodeView.mac }}
                  </td>
                </tr>
                <tr>
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    Last Seen
                  </td>
                  <td class="px-4 py-3 text-gray-900">
                    {{ nodeView.lastSeen }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 class="text-xs font-semibold text-gray-700">Connected Nodes</h4>
            <span class="text-[10px] uppercase tracking-wider text-gray-500">
              {{ connectedNodes.length }}
            </span>
          </div>
          <div class="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div v-if="connectedNodes.length === 0" class="text-gray-500 text-xs">
              No connected nodes reported.
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <span
                v-for="nodeId in connectedNodes"
                :key="nodeId"
                class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
              >
                {{ nodeId }}
              </span>
            </div>
          </div>
        </section>

        <section v-if="hasExtendedSlot" class="space-y-4">
          <div class="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 class="text-xs font-semibold text-gray-700">{{ extendedTitle }}</h4>
            <slot name="extended-header" />
          </div>
          <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table class="w-full text-xs">
              <tbody>
                <slot />
              </tbody>
            </table>
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
import { formatIotDateTime } from "~~/config/iot-time-format";

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

const connectedNodes = computed(() => {
  const nodes = props.node?.connected_nodes;
  if (!Array.isArray(nodes)) return [];
  return nodes.map((item) => String(item).trim()).filter(Boolean);
});

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
  return formatIotDateTime(value, {
    formatter: new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    fallback: "N/A",
  });
}

function handleClose() {
  emit("update:modelValue", false);
  emit("close");
}
</script>

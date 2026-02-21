<template>
  <BaseModal
    :model-value="modelValue"
    title="Control URL Details"
    max-width="max-w-5xl"
    panel-class="p-6 shadow-xl"
    @request-close="handleClose"
  >
    <div class="space-y-6 text-xs text-gray-700">
      <div
        v-if="!controlUrl"
        class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 text-center"
      >
        Control URL information is unavailable.
      </div>

      <template v-else>
        <section class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-gray-200">
            <h4 class="text-xs font-semibold text-gray-700">Control URL</h4>
          </div>

          <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table class="w-full text-xs">
              <tbody>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    Name
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ formatValue(controlUrl.name) }}
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    URL
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ formatValue(controlUrl.url) }}
                  </td>
                </tr>
                <tr>
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    Input Type
                  </td>
                  <td class="px-4 py-3 text-gray-900">
                    {{ formatValue(controlUrl.input_type) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-gray-200">
            <h4 class="text-xs font-semibold text-gray-700">Node</h4>
            <span class="text-[10px] uppercase tracking-wider text-gray-500">
              {{ formatValue(controlUrl.node?.external_id) }}
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
                    {{ formatValue(controlUrl.node?.name) }}
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    Type
                  </td>
                  <td class="px-4 py-3 text-gray-900">
                    {{ formatValue(controlUrl.node?.type) }}
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    MAC
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ formatValue(controlUrl.node?.mac_address) }}
                  </td>
                </tr>
                <tr>
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    IP
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ formatValue(controlUrl.node?.ip_address) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-gray-200">
            <h4 class="text-xs font-semibold text-gray-700">Gateway</h4>
            <span class="text-[10px] uppercase tracking-wider text-gray-500">
              {{ formatValue(controlUrl.node?.gateway?.external_id) }}
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
                    {{ formatValue(controlUrl.node?.gateway?.name) }}
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    MAC
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ formatValue(controlUrl.node?.gateway?.mac_address) }}
                  </td>
                </tr>
                <tr>
                  <td class="w-40 px-4 py-3 text-gray-500 uppercase tracking-wider text-[10px]">
                    IP
                  </td>
                  <td class="px-4 py-3 text-gray-900 break-all">
                    {{ formatValue(controlUrl.node?.gateway?.ip_address) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "../BaseModal.vue";

type ControlUrlItem = {
  id: string;
  name?: string | null;
  url?: string | null;
  input_type?: string | null;
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

const props = defineProps<{
  modelValue: boolean;
  controlUrl: ControlUrlItem | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function handleClose() {
  emit("update:modelValue", false);
  emit("close");
}
</script>

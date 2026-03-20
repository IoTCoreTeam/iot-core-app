<template>
  <article class="bg-white border border-slate-200 rounded p-4">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Gateways</p>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div class="rounded border border-slate-200 bg-white p-2">
            <p class="text-xs text-slate-500">Registered</p>
            <p class="mt-1 text-2xl font-semibold text-slate-800">
              {{ formatNumber(gatewayRegisteredCount) }}
            </p>
          </div>
          <div class="rounded border border-blue-100 bg-blue-50 p-2">
            <p class="text-xs text-blue-700">Active (Realtime)</p>
            <p class="mt-1 text-2xl font-semibold text-blue-700">
              {{ formatNumber(gatewayActiveCount) }}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nodes</p>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div class="rounded border border-slate-200 bg-white p-2">
            <p class="text-xs text-slate-500">Registered</p>
            <p class="mt-1 text-2xl font-semibold text-slate-800">
              {{ formatNumber(nodeRegisteredCount) }}
            </p>
          </div>
          <div class="rounded border border-blue-100 bg-blue-50 p-2">
            <p class="text-xs text-blue-700">Active (Realtime)</p>
            <p class="mt-1 text-2xl font-semibold text-blue-700">
              {{ formatNumber(nodeActiveCount) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { toRefs } from "vue";

const props = defineProps<{
  gatewayRegisteredCount: number;
  gatewayActiveCount: number;
  nodeRegisteredCount: number;
  nodeActiveCount: number;
}>();

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const {
  gatewayRegisteredCount,
  gatewayActiveCount,
  nodeRegisteredCount,
  nodeActiveCount,
} = toRefs(props);
</script>

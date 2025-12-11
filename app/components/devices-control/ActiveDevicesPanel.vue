<template>
  <article class="bg-white border border-slate-200 rounded-lg shadow-sm">
    <header class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div>
        <p class="text-sm font-semibold text-slate-900">Active devices</p>
        <p class="text-xs text-slate-500">
          Ordered by most recent activity. Click a row to see the mock controls.
        </p>
      </div>
      <button
        type="button"
        class="text-xs font-semibold text-blue-600 hover:text-blue-800"
        @click="$emit('view-all')"
      >
        View all
      </button>
    </header>
    <div class="divide-y divide-slate-100">
      <button
        v-for="device in devices"
        :key="device.id"
        type="button"
        class="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
      >
        <span class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-semibold text-slate-600">
          {{ device.short }}
        </span>
        <div class="flex-1">
          <p class="text-sm font-semibold text-slate-900">
            {{ device.name }}
          </p>
          <p class="text-xs text-slate-500">
            {{ device.location }} · Firmware {{ device.version }}
          </p>
        </div>
        <span
          class="text-xs font-semibold px-2 py-1 rounded-full"
          :class="statusClass(device.status)"
        >
          {{ device.status }}
        </span>
        <div class="text-right">
          <p class="text-xs text-slate-500">Last ping</p>
          <p class="text-sm font-medium text-slate-900">
            {{ device.lastPing }}
          </p>
        </div>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
interface ActiveDevice {
  id: number | string;
  short: string;
  name: string;
  location: string;
  version: string;
  status: string;
  lastPing: string;
}

defineProps<{
  devices: ActiveDevice[];
}>();

defineEmits<{
  (event: "view-all"): void;
}>();

function statusClass(status: string) {
  if (status === "Online") {
    return "bg-emerald-50 text-emerald-600";
  }
  if (status === "Offline") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-600";
}
</script>

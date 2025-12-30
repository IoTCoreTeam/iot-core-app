<template>
  <article class="bg-white border border-slate-200 rounded h-full">
    <header
      class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
    >
      <p class="text-sm font-semibold text-slate-900">Alerts</p>
      <button class="text-xs font-semibold text-blue-600 hover:text-blue-800">
        View all
      </button>
    </header>
    <div class="divide-y divide-slate-100">
      <div v-for="alert in alerts" :key="alert.id" class="px-5 py-3">
        <p class="text-sm font-semibold text-slate-900">
          {{ alert.title }}
        </p>
        <p class="text-xs text-slate-500">{{ alert.message }}</p>
        <p class="text-[11px] font-medium text-amber-600 mt-1">
          {{ alert.timestamp }}
        </p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface AlertItem {
  id: number | string;
  title: string;
  message: string;
  timestamp: string;
}

defineProps<{
  alerts: AlertItem[];
}>();
</script>

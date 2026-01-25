<template>
  <section class="bg-white border border-slate-200 rounded">
    <header
      class="p-4 border-b border-slate-100 flex items-center justify-between"
    >
      <div>
        <p class="text-sm font-semibold text-slate-900">Automation batches</p>
      </div>
      <button
        type="button"
        class="text-xs font-semibold text-blue-600 hover:text-blue-800"
        @click="$emit('create-workflow')"
      >
        View all
      </button>
    </header>
    <div class="divide-y divide-slate-100">
      <div
        v-for="automation in automations"
        :key="automation.id"
        class="px-6 py-4 flex items-center gap-4"
      >
        <div class="flex-1">
          <p class="text-sm font-semibold text-slate-900">
            {{ automation.name }}
          </p>
          <p class="text-xs text-slate-500">
            Targets {{ automation.devices }} Nodes Aú Triggered by
            {{ automation.trigger }}
          </p>
        </div>
        <span
          class="text-xs font-medium px-3 py-1 rounded-full"
          :class="
            automation.status === 'Completed'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          "
        >
          {{ automation.status }}
        </span>
        <p class="text-xs text-slate-500 w-28 text-right">
          {{ automation.updated }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface AutomationBatch {
  id: number | string;
  name: string;
  devices: number;
  trigger: string;
  status: string;
  updated: string;
}

defineProps<{
  automations: AutomationBatch[];
}>();

defineEmits<{
  (event: "create-workflow"): void;
}>();
</script>

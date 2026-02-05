<template>
  <section class="px-4">
    <div class="flex items-center justify-between py-3">
      <div>
        <h3 class="text-xs font-semibold text-gray-700">Map Config</h3>
        <p class="text-xs text-gray-500">Temporary placeholder.</p>
      </div>
      <button
        type="button"
        class="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-2 py-1"
        @click="emit('back')"
      >
        Back
      </button>
    </div>

    <div class="bg-white border border-slate-200 rounded-lg p-6 text-xs text-slate-500">
      Map config page (empty).
    </div>
  </section>
</template>

<script setup lang="ts">
type MapRow = {
  id: number;
  name?: string | null;
  area_id?: number | null;
  description?: string | null;
};

defineProps<{
  map: MapRow | null;
}>();

const emit = defineEmits<{
  (e: "back"): void;
}>();
</script>

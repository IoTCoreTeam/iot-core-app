<template>
  <aside
    class="bg-white text-slate-900 flex flex-col sticky top-0 min-h-screen w-52 border-r border-slate-100"
  >

    <!-- Navigation -->
    <nav class="flex-1 py-2 mt-2 overflow-y-auto space-y-1">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="w-full px-3 py-2 flex items-center gap-2 transition text-left text-xs"
        :class="
          section.id === activeTab
            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-400'
            : 'text-slate-800 hover:bg-slate-50'
        "
        @click="handleSectionClick(section.id)"
      >
        <!-- Icon -->
        <div
          class="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
          :class="
            section.id === activeTab
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-500'
          "
        >
          <component
            v-if="section.icon"
            :is="section.icon"
            class="h-4 w-4"
            aria-hidden="true"
          />
        </div>

        <!-- Label -->
        <span class="font-medium truncate">
          {{ section.label }}
        </span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import type { Section } from "@/types/devices-control";

withDefaults(
  defineProps<{
    sections: Section[];
    activeTab: string;
  }>(),
  {
    sections: () => [],
  },
);

const emit = defineEmits<{
  (e: "update:activeTab", value: string): void;
}>();

function handleSectionClick(id: string) {
  emit("update:activeTab", id);
}
</script>

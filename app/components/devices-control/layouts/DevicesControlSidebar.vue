<template>
  <aside
    class="bg-white text-slate-900 flex flex-col sticky top-0 min-h-screen border-r border-slate-100 transition-all duration-200"
    :class="isSidebarCollapsed ? 'w-20' : 'w-64'"
  >
    <div class="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
      <div v-if="!isSidebarCollapsed">
        <p class="text-[0.55rem] uppercase tracking-[0.4em] text-slate-400">
          Devices
        </p>
        <p class="text-sm font-semibold text-slate-900">
          Management Center
        </p>
      </div>
      <button
        type="button"
        class="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 ml-2 cursor-pointer transition"
        @click="handleToggle"
        :title="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span v-if="isSidebarCollapsed"><BootstrapIcon name="caret-right" /></span>
        <span v-else><BootstrapIcon name="caret-left" /></span>
      </button>
    </div>


    <nav class="flex-1 py-4 overflow-y-auto space-y-2">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        class="w-full px-4 py-3 flex items-center gap-3 transition"
        :class="[
          section.id === activeTab
            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-400'
            : 'text-slate-600 hover:bg-slate-50',
          isSidebarCollapsed ? 'justify-center' : 'text-left'
        ]"
        @click="handleSectionClick(section.id)"
        :title="section.label"
      >
        <div
          class="h-9 w-9 rounded-full flex items-center justify-center"
          :class="
            section.id === activeTab
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-500'
          "
        >
          <component
            v-if="section.icon"
            :is="section.icon"
            class="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div v-if="!isSidebarCollapsed">
          <p class="text-sm font-semibold">{{ section.label }}</p>
          <p class="text-xs text-slate-500">
            {{ section.description }}
          </p>
        </div>
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
    isSidebarCollapsed: boolean;
  }>(),
  {
    sections: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:activeTab", value: string): void;
  (e: "toggle-sidebar"): void;
}>();

function handleSectionClick(id: string) {
  emit("update:activeTab", id);
}

function handleToggle() {
  emit("toggle-sidebar");
}
</script>

<template>
  <div class="min-h-screen flex bg-slate-50">
    <DataCenterSidebar :sections="sections" v-model:activeTab="activeTab" />

    <section class="flex-1 flex flex-col">
      <main class="flex-1 bg-slate-50 overflow-y-auto">
        <component
          v-if="activeSectionComponent"
          :is="activeSectionComponent"
        />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from "vue";
import {
  CircleStackIcon,
  CpuChipIcon,
  ServerStackIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from "@heroicons/vue/24/outline";

import DataCenterSidebar from "@/components/data-center/layouts/DataCenterSidebar.vue";
import DataOverviewSection from "@/components/data-center/sections/DataOverviewSection.vue";
import DeviceDataSection from "@/components/data-center/sections/DeviceDataSection.vue";
import SensorDataSection from "@/components/data-center/sections/SensorDataSection.vue";
import SystemLogsSection from "@/components/data-center/sections/SystemLogsSection.vue";
import ReportsSection from "@/components/data-center/sections/ReportsSection.vue";
import type { DataCenterSection } from "@/types/data-center";

const sections: DataCenterSection[] = [
  {
    id: "data-overview",
    label: "Overview",
    icon: CircleStackIcon,
  },
  {
    id: "device-data",
    label: "Device Data",
    icon: ServerStackIcon,
  },
  {
    id: "sensor-data",
    label: "Sensor Data",
    icon: TableCellsIcon,
  },
  {
    id: "system-logs",
    label: "System Logs",
    icon: CpuChipIcon,
  },
  {
    id: "reports",
    label: "Reports",
    icon: Squares2X2Icon,
  },
];

const activeTab = ref(sections[0]?.id ?? "data-overview");

const sectionComponentMap: Record<string, Component> = {
  "data-overview": DataOverviewSection,
  "device-data": DeviceDataSection,
  "sensor-data": SensorDataSection,
  "system-logs": SystemLogsSection,
  reports: ReportsSection,
};

const activeSectionComponent = computed<Component | undefined>(
  () => sectionComponentMap[activeTab.value],
);
</script>

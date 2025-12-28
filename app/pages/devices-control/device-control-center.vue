<template>
  <div class="min-h-screen flex bg-slate-50">
    <DevicesControlSidebar
      :sections="sections"
      v-model:activeTab="activeTab"
      :is-sidebar-collapsed="isSidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
    />

    <section class="flex-1 flex flex-col">
      <main class="flex-1 bg-slate-50 overflow-y-auto">
        <component
          v-if="activeSectionComponent"
          :is="activeSectionComponent"
          :section="activeSection"
        />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component } from "vue";
import {
  ChartBarIcon,
  CpuChipIcon,
  MapIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
} from "@heroicons/vue/24/outline";

import DevicesControlSidebar from "@/components/devices-control/layouts/DevicesControlSidebar.vue";
import DashboardSection from "@/components/devices-control/sections/DashboardSection.vue";
import DeviceRegistration from "@/components/devices-control/sections/DeviceRegistration.vue";
import DevicesControlSection from "@/components/devices-control/sections/DevicesControlSection.vue";
import MapSection from "@/components/devices-control/sections/MapSection.vue";
import ScenarioSection from "@/components/devices-control/sections/ScenarioSection.vue";
import type { Section } from "@/types/devices-control";

const ACTIVE_SECTION_STORAGE_KEY = "device-registration-active-section";

const sections: Section[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "High-level intake snapshot",
    icon: ChartBarIcon,
    headline: "Track the overall registration throughput.",
    body: "Visualize how many devices entered, progressed, or stalled during the onboarding pipeline. Add charts, tables, or status widgets to this canvas without touching the sidebar layout.",
    cards: [
      {
        kicker: "Status",
        title: "Current registration health",
        description:
          "Display aggregated success rate, SLAs, and trendlines as soon as metrics are ready.",
      },
      {
        kicker: "Action",
        title: "Prioritize blocked batches",
        description:
          "Highlight the batches that exceed their processing window so your team can intervene early.",
      },
    ],
  },
  {
    id: "device-registration",
    label: "Device Registration",
    description: "Approval pipeline at a glance",
    icon: CpuChipIcon,
    headline: "Monitor the device approval backlog.",
    body: "Use the tabs to quickly pivot between pending, approved, or the full list of devices.",
    cards: [
      {
        kicker: "Idea",
        title: "Pre-provision firmware",
        description: "Trigger the firmware flashing queue from here when batches arrive.",
      },
      {
        kicker: "Idea",
        title: "Create exception ticket",
        description: "Open a compliance or quality ticket for any failed hardware while staying on this page.",
      },
    ],
  },
  {
    id: "devices-control",
    label: "Devices Control",
    description: "Operational command",
    icon: RectangleGroupIcon,
    headline: "Control device behavior from one console.",
    body: "Use this space for active monitoring widgets, quick actions, and summaries of control signals pushed to devices.",
    cards: [
      {
        kicker: "Status",
        title: "Live control plane",
        description: "Outline the command center widgets you need for approvals, remote actions, or throttling.",
      },
      {
        kicker: "Workflow",
        title: "Automation readiness",
        description: "Summarize the current automation queues or actions awaiting operator input.",
      },
    ],
  },
  {
    id: "map",
    label: "Map",
    description: "Deployment geography",
    icon: MapIcon,
    headline: "Track devices across physical locations.",
    body: "Associate every registered device with its warehouse, customer region, or manufacturing batch to spot gaps instantly.",
    cards: [
      {
        kicker: "Coverage",
        title: "Regional inventory",
        description: "Highlight which regions are saturated or lacking devices to rebalance capacity.",
      },
      {
        kicker: "Escalation",
        title: "Location risks",
        description: "Call out locations that exceed SLA or environmental thresholds for faster field response.",
      },
    ],
  },
  {
    id: "scenario",
    label: "Scenario",
    description: "Playbooks & automation",
    icon: Squares2X2Icon,
    headline: "Model operational scenarios.",
    body: "Capture the workflows and automation you need for provisioning, remote recovery, and compliance.",
    cards: [
      {
        kicker: "Playbook",
        title: "Provisioning blueprint",
        description: "Define the steps and owners for onboarding new hardware batches safely.",
      },
      {
        kicker: "Automation",
        title: "Recovery actions",
        description: "Document scripts and flows to self-heal devices when alerts trigger.",
      },
    ],
  },
];

const sectionComponentMap: Record<string, Component> = {
  dashboard: DashboardSection,
  "device-registration": DeviceRegistration,
  "devices-control": DevicesControlSection,
  map: MapSection,
  scenario: ScenarioSection,
};
const defaultSection =
  sections.find((section) => section.id === "device-registration") ?? sections[0];

if (!defaultSection) {
  throw new Error("No sections configured for device-registration view.");
}

const activeTab = ref(defaultSection.id);
const isSidebarCollapsed = ref(true);
const activeSection = computed<Section>(
  () => sections.find((section) => section.id === activeTab.value) ?? defaultSection
);
const activeSectionComponent = computed<Component | undefined>(
  () => sectionComponentMap[activeTab.value] ?? sectionComponentMap[defaultSection.id]
);

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

watch(activeTab, (value) => {
  if (!import.meta.client) return;
  window.localStorage.setItem(ACTIVE_SECTION_STORAGE_KEY, value);
});

onMounted(() => {
  if (!import.meta.client) return;
  const storedSection = window.localStorage.getItem(ACTIVE_SECTION_STORAGE_KEY);
  if (storedSection && sections.some((section) => section.id === storedSection)) {
    activeTab.value = storedSection;
  }
});
</script>

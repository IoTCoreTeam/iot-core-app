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
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import {
  CpuChipIcon,
  MapIcon,
  Squares2X2Icon,
  DocumentTextIcon,
} from "@heroicons/vue/24/outline";

import DevicesControlSidebar from "@/components/devices-control/layouts/DevicesControlSidebar.vue";
import DeviceRegistration from "@/components/devices-control/sections/DeviceRegistration.vue";
import MapSection from "@/components/devices-control/sections/MapSection.vue";
import ScenarioSection from "@/components/devices-control/sections/ScenarioSection.vue";
import DevicesLogSection from "@/components/devices-control/sections/DevicesLogSection.vue";
import type { Section } from "@/types/devices-control";

const controlModuleBase = (apiConfig.controlModule || "").replace(/\/$/, "");
const authStore = useAuthStore();

const ACTIVE_SECTION_STORAGE_KEY = "device-registration-active-section";

const sections: Section[] = [
  {
    id: "device-registration",
    label: "Devices Registration",
    description: "Approval pipeline at a glance",
    icon: CpuChipIcon,
    headline: "Monitor the devices approval backlog.",
    body: "Use the tabs to quickly pivot between Gateways, Nodes, or Controller/Sensor hardware.",
    cards: [
      {
        kicker: "Idea",
        title: "Pre-provision firmware",
        description:
          "Trigger the firmware flashing queue from here when batches arrive.",
      },
      {
        kicker: "Idea",
        title: "Create exception ticket",
        description:
          "Open a compliance or quality ticket for any failed hardware while staying on this page.",
      },
    ],
  },
  {
    id: "map",
    label: "Map Configuration",
    description: "Deployment geography",
    icon: MapIcon,
    headline: "Track Nodes across physical locations.",
    body: "Associate every registered Node with its warehouse, customer region, or manufacturing batch to spot gaps instantly.",
    cards: [
      {
        kicker: "Coverage",
        title: "Regional inventory",
        description:
          "Highlight which regions are saturated or lacking Nodes to rebalance capacity.",
      },
      {
        kicker: "Escalation",
        title: "Location risks",
        description:
          "Call out locations that exceed SLA or environmental thresholds for faster field response.",
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
        description:
          "Define the steps and owners for onboarding new hardware batches safely.",
      },
      {
        kicker: "Automation",
        title: "Recovery actions",
        description:
          "Document scripts and flows to self-heal Nodes when alerts trigger.",
      },
    ],
  },
  {
    id: "devices-log",
    label: "Devices Log",
    description: "Forensics & traceability",
    icon: DocumentTextIcon,
    headline: "Review historical device activities.",
    body: "Filter by device, event type, or severity to export the exact log view you need.",
    cards: [
      {
        kicker: "Audit",
        title: "Regulatory ready",
        description:
          "Capture critical overrides and alerts for compliance teams instantly.",
      },
      {
        kicker: "Ops",
        title: "Daily digest",
        description:
          "Use this log to share top issues with field teams each shift.",
      },
    ],
  },
];

const sectionComponentMap: Record<string, Component> = {
  "device-registration": DeviceRegistration,
  map: MapSection,
  scenario: ScenarioSection,
  "devices-log": DevicesLogSection,
};
const defaultSection =
  sections.find((section) => section.id === "device-registration") ??
  sections[0];

if (!defaultSection) {
  throw new Error("No sections configured for device-registration view.");
}

const activeTab = ref(defaultSection.id);
const isSidebarCollapsed = ref(true);
const activeSection = computed<Section>(
  () =>
    sections.find((section) => section.id === activeTab.value) ?? defaultSection
);
const activeSectionComponent = computed<Component | undefined>(
  () =>
    sectionComponentMap[activeTab.value] ??
    sectionComponentMap[defaultSection.id]
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
  if (
    storedSection &&
    sections.some((section) => section.id === storedSection)
  ) {
    activeTab.value = storedSection;
  }

  void validateControlModuleJwt();
});

async function validateControlModuleJwt(): Promise<void> {
  if (!import.meta.client || !controlModuleBase) {
    return;
  }

  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    return;
  }

  try {
    await fetch(
      `${controlModuleBase}/devices-control/devices-registration/test-jwt`,
      {
        method: "GET",
        headers: {
          Authorization: authorization,
          Accept: "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unable to validate control module JWT:", error);
  }
}
</script>

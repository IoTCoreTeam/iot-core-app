<template>
  <div class="min-h-screen flex bg-slate-50">
    <aside
      class="bg-white text-slate-900 flex flex-col sticky top-0 min-h-screen border-r border-slate-100 shadow-sm transition-all duration-200"
      :class="isSidebarCollapsed ? 'w-20' : 'w-64'"
    >
      <div class="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
        <div v-if="!isSidebarCollapsed">
          <p class="text-[0.55rem] uppercase tracking-[0.4em] text-slate-400">
            Devices
          </p>
          <p class="text-sm font-semibold text-slate-900">
            Registation Center
          </p>
        </div>
        <button
          type="button"
          class="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 ml-2 cursor-pointer transition"
          @click="toggleSidebar"
          :title="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <span v-if="isSidebarCollapsed">›</span>
          <span v-else>‹</span>
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
          @click="activeTab = section.id"
          :title="section.label"
        >
          <div
            class="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold"
            :class="
              section.id === activeTab
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-500'
            "
          >
            {{ section.badge }}
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

    <section class="flex-1 flex flex-col">
      <main class="flex-1 p-4 bg-slate-50 overflow-y-auto">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h2 class="text-2xl font-bold text-gray-900">
            {{ activeSection.headline }}
          </h2>
          <p class="mt-3 text-sm text-gray-600 max-w-3xl">
            {{ activeSection.body }}
          </p>
          <div class="mt-8 grid gap-6 lg:grid-cols-2">
            <article
              v-for="card in activeSection.cards"
              :key="card.title"
              class="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_15px_35px_-30px_rgba(15,23,42,0.7)]"
            >
              <p class="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                {{ card.kicker }}
              </p>
              <h3 class="mt-2 text-lg font-bold text-gray-900">
                {{ card.title }}
              </h3>
              <p class="mt-2 text-sm text-gray-600">
                {{ card.description }}
              </p>
            </article>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

const sections = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "High-level intake snapshot",
    badge: "DB",
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
    id: "shortcuts",
    label: "Shortcuts",
    description: "Quick access for ops",
    badge: "SC",
    headline: "Launch repeated workflows quickly.",
    body: "Collect links to scripts, manual checklists, or automation triggers. This keeps day-to-day operators from drilling through multiple screens.",
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
    id: "overview",
    label: "Overview",
    description: "Device-level context",
    badge: "OV",
    headline: "Plan the registration schema.",
    body: "Outline the exact attributes and relationships you need for every registered device. Document owners, hardware metadata, firmware, and audit logs.",
    cards: [
      {
        kicker: "Schema",
        title: "Device identity fields",
        description: "Serial numbers, ownership data, and lifecycle state definitions live here.",
      },
      {
        kicker: "Schema",
        title: "Compliance evidence",
        description: "Track certificates, testing batches, and manufacturing dates to satisfy audit requirements.",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    description: "Timeline + insights",
    badge: "EV",
    headline: "Model the lifecycle events per device.",
    body: "Map hooks from provisioning, QC, shipping, and activation into one timeline. Later you can plug telemetry directly into this area.",
    cards: [
      {
        kicker: "Timeline",
        title: "Provisioning milestones",
        description: "Represent each provisioning stage for quick troubleshooting.",
      },
      {
        kicker: "Automation",
        title: "Trigger follow-up actions",
        description: "When an event fires, you can queue emails, tickets, or scripts straight from this workspace.",
      },
    ],
  },
];

const activeTab = ref(sections[0].id);
const isSidebarCollapsed = ref(false);
const helloMessage = ref("");
const authStore = useAuthStore();
const activeSection = computed(
  () => sections.find((section) => section.id === activeTab.value) ?? sections[0]
);

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

onMounted(async () => {
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    console.warn("Missing authorization token, skip hello message fetch.");
    return;
  }

  try {
    const response = await fetch(
      `${apiConfig.controlModule}/devices-control/devices-registration/test-jwt`,
      {
        headers: {
          Authorization: authorization,
        },
      }
    );

    if (!response.ok) {
      console.error("Unable to load hello message", await response.text());
      return;
    }

    const payload = await response.json();
    helloMessage.value = typeof payload.message === "string" ? payload.message : "";
  } catch (error) {
    console.error("Unable to load hello message", error);
  }
});
</script>

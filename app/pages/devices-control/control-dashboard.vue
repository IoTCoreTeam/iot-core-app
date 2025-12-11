<template>
  <div class="py-4 bg-slate-50 min-h-screen">
    <div class="max-w-8xl mx-auto space-y-8">
      <section>
        <div class="flex flex-col gap-3 mb-6">
          <p class="text-sm uppercase tracking-wide text-slate-500">
            Devices Control
          </p>
          <h1 class="text-2xl font-semibold text-slate-900">
            Control dashboard
          </h1>
          <p class="text-sm text-slate-500">
            Quick overview of device health, connectivity and recent remote
            actions. All values below are mocked to showcase the layout.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <article
            v-for="item in overview"
            :key="item.label"
            class="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm"
          >
            <div class="flex items-center justify-between mb-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {{ item.label }}
              </p>
              <span
                class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                :class="item.trend > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'"
              >
                {{ item.trend > 0 ? "+" : "" }}{{ item.trend }}%
              </span>
            </div>
            <p class="text-3xl font-semibold text-slate-900">{{ item.value }}</p>
            <p class="text-xs text-slate-500 mt-2">{{ item.caption }}</p>
          </article>
        </div>
      </section>

      <section class="grid lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2">
          <DevicesControlActiveDevicesPanel :devices="devices" />
        </div>
        <div class="space-y-6">
          <DevicesControlAlertsPanel :alerts="alerts" />

          <article class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-5 py-4 border-b border-slate-100">
              <p class="text-sm font-semibold text-slate-900">Quick actions</p>
            </header>
            <div class="px-5 py-4 flex flex-col gap-3">
              <button
                v-for="action in quickActions"
                :key="action"
                type="button"
                class="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-sm font-medium text-slate-700 transition"
              >
                {{ action }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <DevicesControlAutomationBatches :automations="automations" />
    </div>
  </div>
</template>

<script setup lang="ts">
const overview = [
  {
    label: "Online",
    value: "128",
    trend: 4.1,
    caption: "Devices with stable heartbeat",
  },
  {
    label: "Maintenance",
    value: "12",
    trend: -1.2,
    caption: "Awaiting manual intervention",
  },
  {
    label: "Alerts",
    value: "6",
    trend: 0.8,
    caption: "Critical notifications open",
  },
  {
    label: "Workflows",
    value: "18",
    trend: 7.4,
    caption: "Automation flows scheduled",
  },
];

const devices = [
  {
    id: 1,
    short: "GW",
    name: "Gateway North-41",
    location: "Plant 3 · Hanoi",
    version: "3.4.9",
    status: "Online",
    lastPing: "12s ago",
  },
  {
    id: 2,
    short: "ST",
    name: "Storage Sensor 12",
    location: "Warehouse · Da Nang",
    version: "2.2.1",
    status: "Limited",
    lastPing: "35s ago",
  },
  {
    id: 3,
    short: "EN",
    name: "Energy Meter 07",
    location: "Building B · HCMC",
    version: "4.0.0",
    status: "Offline",
    lastPing: "5m ago",
  },
  {
    id: 4,
    short: "AQ",
    name: "Air Quality Kit",
    location: "HQ · HCMC",
    version: "5.1.2",
    status: "Online",
    lastPing: "50s ago",
  },
];

const quickActions = [
  "Reboot the highlighted device",
  "Push firmware 5.1 beta",
  "Pause automation rules",
  "Open remote support session",
];

const alerts = [
  {
    id: 1,
    title: "Offline device",
    message: "Energy Meter 07 lost connection for more than 5 minutes.",
    timestamp: "2 minutes ago",
  },
  {
    id: 2,
    title: "Battery threshold",
    message: "Sensor Storage 12 is at 17% battery.",
    timestamp: "18 minutes ago",
  },
  {
    id: 3,
    title: "New firmware available",
    message: "Gateway North-41 can upgrade to 3.4.10.",
    timestamp: "Today, 08:21",
  },
];

const automations = [
  {
    id: 1,
    name: "Night cooling boost",
    devices: 24,
    trigger: "Energy price drop",
    status: "Completed",
    updated: "10 minutes ago",
  },
  {
    id: 2,
    name: "Firmware push Beta",
    devices: 12,
    trigger: "Manual approval",
    status: "Running",
    updated: "Just now",
  },
  {
    id: 3,
    name: "Air quality warm-up",
    devices: 8,
    trigger: "PM2.5 > 40",
    status: "Completed",
    updated: "Yesterday",
  },
];

</script>

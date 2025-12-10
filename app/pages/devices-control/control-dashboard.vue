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

      <section class="grid lg:grid-cols-3 gap-6">
        <article class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <header class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <p class="text-sm font-semibold text-slate-900">Active devices</p>
              <p class="text-xs text-slate-500">
                Ordered by most recent activity. Click a row to see the mock controls.
              </p>
            </div>
            <button
              type="button"
              class="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View all
            </button>
          </header>
          <div class="divide-y divide-slate-100">
            <button
              v-for="device in devices"
              :key="device.id"
              type="button"
              class="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <span class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-semibold text-slate-600">
                {{ device.short }}
              </span>
              <div class="flex-1">
                <p class="text-sm font-semibold text-slate-900">
                  {{ device.name }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ device.location }} · Firmware {{ device.version }}
                </p>
              </div>
              <span
                class="text-xs font-semibold px-2 py-1 rounded-full"
                :class="statusClass(device.status)"
              >
                {{ device.status }}
              </span>
              <div class="text-right">
                <p class="text-xs text-slate-500">Last ping</p>
                <p class="text-sm font-medium text-slate-900">
                  {{ device.lastPing }}
                </p>
              </div>
            </button>
          </div>
        </article>

        <aside class="space-y-6">
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

          <article class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-5 py-4 border-b border-slate-100">
              <p class="text-sm font-semibold text-slate-900">Alerts</p>
            </header>
            <div class="divide-y divide-slate-100">
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="px-5 py-3"
              >
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
        </aside>
      </section>

      <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <header class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">Automation batches</p>
            <p class="text-xs text-slate-500">
              Placeholder list of automations recently executed.
            </p>
          </div>
          <button
            type="button"
            class="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            New workflow
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
                Targets {{ automation.devices }} devices · Triggered by
                {{ automation.trigger }}
              </p>
            </div>
            <span
              class="text-xs font-medium px-3 py-1 rounded-full"
              :class="automation.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'"
            >
              {{ automation.status }}
            </span>
            <p class="text-xs text-slate-500 w-28 text-right">
              {{ automation.updated }}
            </p>
          </div>
        </div>
      </section>
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

function statusClass(status: string) {
  if (status === "Online") {
    return "bg-emerald-50 text-emerald-600";
  }
  if (status === "Offline") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-600";
}
</script>

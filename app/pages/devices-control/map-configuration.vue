<template>
  <div class="py-4 bg-slate-50 min-h-screen">
    <div class="max-w-8xl mx-auto space-y-8">
      <header class="flex flex-col gap-2">
        <p class="text-sm uppercase tracking-wide text-slate-500">
          Devices Control
        </p>
        <h1 class="text-2xl font-semibold text-slate-900">
          Map configuration
        </h1>
        <p class="text-sm text-slate-500 max-w-3xl">
          Configure how gateways, sensors and zones appear on the live map.
          The controls below are mocked but demonstrate how the map tooling
          could look inside the application.
        </p>
      </header>

      <section class="grid lg:grid-cols-3 gap-6">
        <article class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">Preview</p>
              <p class="text-xs text-slate-500">
                Mock map area showing currently selected layers.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Center
              </button>
              <button
                type="button"
                class="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Reset
              </button>
            </div>
          </div>
          <div class="bg-slate-900 px-6 py-10 min-h-[320px] text-white">
            <div class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400 mb-6">
              <span>Hanoi campus</span>
              <span>Mock map</span>
            </div>
            <div class="grid grid-cols-3 gap-6 text-center">
              <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
                <p class="text-4xl font-semibold">24</p>
                <p class="text-xs uppercase tracking-wide text-slate-300 mt-2">
                  Gateways
                </p>
              </div>
              <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
                <p class="text-4xl font-semibold">142</p>
                <p class="text-xs uppercase tracking-wide text-slate-300 mt-2">
                  Sensors
                </p>
              </div>
              <div class="bg-white/10 rounded-2xl p-6 border border-white/20">
                <p class="text-4xl font-semibold">8</p>
                <p class="text-xs uppercase tracking-wide text-slate-300 mt-2">
                  Zones
                </p>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 mt-8">
              This area would normally host the map component (Mapbox, Leaflet
              or Google Maps). Colors and badges update based on the toggles on
              the right-hand panel.
            </p>
          </div>
        </article>

        <aside class="space-y-6">
          <article class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-5 py-4 border-b border-slate-100">
              <p class="text-sm font-semibold text-slate-900">
                Layer visibility
              </p>
            </header>
            <div class="divide-y divide-slate-100">
              <label
                v-for="layer in layers"
                :key="layer.id"
                class="flex items-center justify-between px-5 py-3 text-sm"
              >
                <div>
                  <p class="font-semibold text-slate-900">{{ layer.name }}</p>
                  <p class="text-xs text-slate-500">{{ layer.description }}</p>
                </div>
                <input type="checkbox" class="w-4 h-4 accent-blue-600" checked />
              </label>
            </div>
          </article>

          <article class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-5 py-4 border-b border-slate-100">
              <p class="text-sm font-semibold text-slate-900">Color palette</p>
            </header>
            <div class="px-5 py-4 space-y-3">
              <div
                v-for="variant in palettes"
                :key="variant.id"
                class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500"
              >
                <div class="flex gap-1 flex-1">
                  <span
                    v-for="color in variant.colors"
                    :key="color"
                    class="h-8 w-8 rounded-lg"
                    :style="{ backgroundColor: color }"
                  />
                </div>
                <span class="text-xs font-semibold text-slate-600">
                  {{ variant.name }}
                </span>
              </div>
            </div>
          </article>

          <article class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-5 py-4 border-b border-slate-100">
              <p class="text-sm font-semibold text-slate-900">Location presets</p>
            </header>
            <div class="px-5 py-4 space-y-3">
              <button
                v-for="preset in presets"
                :key="preset.id"
                type="button"
                class="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-sm font-medium text-slate-700 transition"
              >
                {{ preset.name }}
                <span class="block text-xs text-slate-500">
                  {{ preset.devices }} devices · {{ preset.notes }}
                </span>
              </button>
            </div>
          </article>
        </aside>
      </section>

      <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <header class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-900">Sync settings</p>
            <p class="text-xs text-slate-500">
              Describe how and when changes impact production devices.
            </p>
          </div>
          <button
            type="button"
            class="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Publish
          </button>
        </header>
        <div class="px-6 py-4 grid md:grid-cols-3 gap-4">
          <dl class="space-y-1">
            <dt class="text-xs text-slate-500 uppercase tracking-wide">
              Last published
            </dt>
            <dd class="text-sm font-semibold text-slate-900">
              Today · 09:12
            </dd>
          </dl>
          <dl class="space-y-1">
            <dt class="text-xs text-slate-500 uppercase tracking-wide">
              Pending edits
            </dt>
            <dd class="text-sm font-semibold text-slate-900">
              3 layers · 1 preset
            </dd>
          </dl>
          <dl class="space-y-1">
            <dt class="text-xs text-slate-500 uppercase tracking-wide">
              Rollback
            </dt>
            <dd class="text-sm font-semibold text-slate-900">
              Enabled · 24h
            </dd>
          </dl>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const layers = [
  {
    id: "gateways",
    name: "Gateways",
    description: "Show core concentrators and heartbeat status.",
  },
  {
    id: "sensors",
    name: "Sensors",
    description: "Individual devices grouped by type and health.",
  },
  {
    id: "zones",
    name: "Zones",
    description: "Operational boundaries with color-coded fill.",
  },
];

const palettes = [
  {
    id: 1,
    name: "Default",
    colors: ["#2563EB", "#22D3EE", "#0EA5E9"],
  },
  {
    id: 2,
    name: "Warm",
    colors: ["#EA580C", "#F97316", "#FACC15"],
  },
  {
    id: 3,
    name: "Neutral",
    colors: ["#334155", "#94A3B8", "#E2E8F0"],
  },
];

const presets = [
  {
    id: 1,
    name: "Vietnam - Hanoi Campus",
    devices: 212,
    notes: "Primary facility with restricted access zones.",
  },
  {
    id: 2,
    name: "Vietnam - Da Nang Port",
    devices: 88,
    notes: "LoRa sensors deployed on shipping containers.",
  },
  {
    id: 3,
    name: "Singapore Regional",
    devices: 44,
    notes: "Secondary backup network.",
  },
];
</script>

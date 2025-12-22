<template>
  <div class="w-full min-h-[80vh] bg-gray-50 p-4">
    <div class="mx-auto flex max-w-8xl flex-col gap-4">
      <!-- <header class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div class="space-y-1">
          <h1 class="text-lg font-semibold text-gray-900">Sensor overview</h1>
          <p class="text-sm text-gray-600">Concise view of soil moisture, light, rain, air humidity, and temperature.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <div class="font-semibold text-gray-800">Last update</div>
            <div>{{ lastUpdatedLabel }}</div>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            @click="simulateUpdate"
          >
            <BootstrapIcon name="arrow-clockwise" class="h-4 w-4" />
            Refresh demo
          </button>
        </div>
      </header> -->
      <section class="grid grid-cols-1 gap-2 lg:grid-cols-3 xl:grid-cols-5 items-start">
        <SingleMetricChart
          class="lg:col-span-2 xl:col-span-4"
          :metrics="metrics"
          :metric-series="metricSeries"
        />
        <div class="flex flex-col gap-4 h-full lg:col-span-1 xl:col-span-1">
          <DevicesControlAlertsPanel :alerts="alerts" />
        </div>
      </section>
      <section class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashboardSensorCard v-for="metric in metricCardItems" :key="metric.key" v-bind="metric.props" />
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
        <div>
          <DevicesControlActiveDevicesPanel :devices="activeDevices" />
        </div>
        <div>
          <DevicesControlAutomationBatches :automations="automationBatches" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DashboardSensorCard from "@/components/DashboardSensorCard.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import type { DashboardMetric, SeriesCollection, SeriesPoint, TimeframeKey } from "@/types/dashboard";

interface ActiveDeviceItem {
  id: number;
  short: string;
  name: string;
  location: string;
  version: string;
  status: "Online" | "Offline" | "Limited";
  lastPing: string;
}

interface AlertPanelItem {
  id: number;
  title: string;
  message: string;
  timestamp: string;
}

interface AutomationBatchItem {
  id: number;
  name: string;
  devices: number;
  trigger: string;
  status: "Completed" | "Running";
  updated: string;
}

const timeframeConfigs: Record<TimeframeKey, { count: number; stepMs: number; format: Intl.DateTimeFormatOptions }> = {
  second: { count: 30, stepMs: 10 * 1000, format: { hour: "2-digit", minute: "2-digit", second: "2-digit" } },
  minute: { count: 30, stepMs: 60 * 1000, format: { hour: "2-digit", minute: "2-digit" } },
  hour: { count: 24, stepMs: 60 * 60 * 1000, format: { hour: "2-digit" } },
  day: { count: 30, stepMs: 24 * 60 * 60 * 1000, format: { month: "short", day: "2-digit" } },
};

const buildTimeframeLabels = (): Record<TimeframeKey, string[]> => {
  const now = Date.now();
  return (Object.entries(timeframeConfigs) as [TimeframeKey, (typeof timeframeConfigs)[TimeframeKey]][]).reduce(
    (labels, [key, config]) => {
      const formatter = new Intl.DateTimeFormat("vi-VN", config.format);
      labels[key] = Array.from({ length: config.count }, (_, index) => {
        const offset = config.count - 1 - index;
        return formatter.format(new Date(now - offset * config.stepMs));
      });
      return labels;
    },
    {} as Record<TimeframeKey, string[]>
  );
};

const timeframeLabels = buildTimeframeLabels();

const toSeriesPoints = (labels: string[], values: number[]): SeriesPoint[] =>
  labels.map((label, index) => ({
    label,
    value: values[index] ?? values[values.length - 1] ?? 0,
  }));

const generateLinearSeries = (start: number, step: number, count: number) =>
  Array.from({ length: count }, (_, idx) => Number((start + step * idx).toFixed(2)));

type SeriesSeed = Record<TimeframeKey, { start: number; step: number }>;

const createSeriesCollection = (seed: SeriesSeed): SeriesCollection => ({
  second: toSeriesPoints(
    timeframeLabels.second,
    generateLinearSeries(seed.second.start, seed.second.step, timeframeLabels.second.length)
  ),
  minute: toSeriesPoints(
    timeframeLabels.minute,
    generateLinearSeries(seed.minute.start, seed.minute.step, timeframeLabels.minute.length)
  ),
  hour: toSeriesPoints(
    timeframeLabels.hour,
    generateLinearSeries(seed.hour.start, seed.hour.step, timeframeLabels.hour.length)
  ),
  day: toSeriesPoints(
    timeframeLabels.day,
    generateLinearSeries(seed.day.start, seed.day.step, timeframeLabels.day.length)
  ),
});

const metrics = ref<DashboardMetric[]>([
  {
    key: "soilMoisture",
    title: "Soil moisture",
    subtitle: "Soil moisture",
    value: 48,
    unit: "%",
    icon: "droplet-half",
    change: 1.8,
    status: "good",
    statusText: "Stable",
    description: "Keep between 40-60% for healthy roots.",
    min: 0,
    max: 100,
    trend: [44, 45, 46, 47, 48, 49, 48],
    rules: { warnLow: 35, warnHigh: 70, dangerLow: 25, dangerHigh: 80 },
  },
  {
    key: "light",
    title: "Light",
    subtitle: "Light intensity",
    value: 820,
    unit: "lux",
    icon: "sun",
    change: -1.2,
    status: "good",
    statusText: "Optimal",
    description: "Light intensity at the main sensor.",
    min: 0,
    max: 1200,
    trend: [760, 780, 800, 820, 840, 830, 820],
    rules: { warnLow: 450, warnHigh: 1050, dangerLow: 300, dangerHigh: 1150 },
  },
  {
    key: "rain",
    title: "Rain",
    subtitle: "Rain gauge",
    value: 0.6,
    unit: "mm",
    icon: "cloud-rain",
    change: -5.4,
    status: "good",
    statusText: "Light",
    description: "Rain volume in the last hour.",
    min: 0,
    max: 20,
    trend: [0.2, 0.3, 0.5, 0.9, 0.6, 0.7, 0.6],
    rules: { warnHigh: 10, dangerHigh: 15 },
  },
  {
    key: "airHumidity",
    title: "Air humidity",
    subtitle: "Air humidity",
    value: 63,
    unit: "%",
    icon: "droplet",
    change: 2.1,
    status: "good",
    statusText: "Comfortable",
    description: "Ideal range 55-70% for most plants.",
    min: 0,
    max: 100,
    trend: [58, 60, 61, 62, 63, 64, 63],
    rules: { warnLow: 40, warnHigh: 80, dangerLow: 30, dangerHigh: 90 },
  },
  {
    key: "temperature",
    title: "Temperature",
    subtitle: "Temperature",
    value: 28.4,
    unit: "°C",
    icon: "thermometer-half",
    change: 0.7,
    status: "good",
    statusText: "Cool",
    description: "Ambient temperature in the greenhouse.",
    min: 0,
    max: 45,
    trend: [26.5, 27.1, 27.8, 28.2, 28.5, 28.0, 28.4],
    rules: { warnLow: 15, warnHigh: 32, dangerLow: 10, dangerHigh: 36 },
  },
]);

const metricSeries = ref<Record<string, SeriesCollection>>({
  soilMoisture: createSeriesCollection({
    second: { start: 48, step: 0.02 },
    minute: { start: 47, step: 0.04 },
    hour: { start: 44, step: 0.18 },
    day: { start: 41, step: 0.25 },
  }),
  light: createSeriesCollection({
    second: { start: 835, step: -1.5 },
    minute: { start: 860, step: -1.2 },
    hour: { start: 900, step: -3.2 },
    day: { start: 950, step: -4.0 },
  }),
  rain: createSeriesCollection({
    second: { start: 0.4, step: -0.02 },
    minute: { start: 0.2, step: 0.015 },
    hour: { start: 0.3, step: 0.02 },
    day: { start: 0.5, step: -0.01 },
  }),
  airHumidity: createSeriesCollection({
    second: { start: 62.6, step: 0.05 },
    minute: { start: 59.5, step: 0.12 },
    hour: { start: 55, step: 0.3 },
    day: { start: 52, step: 0.35 },
  }),
  temperature: createSeriesCollection({
    second: { start: 28, step: 0.03 },
    minute: { start: 26.8, step: 0.05 },
    hour: { start: 24, step: 0.18 },
    day: { start: 22, step: 0.22 },
  }),
});

const lastUpdated = ref<Date | null>(null);

const lastUpdatedLabel = computed(() =>
  lastUpdated.value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(lastUpdated.value)
    : "Updating..."
);

const metricCardItems = computed(() =>
  metrics.value.map(({ key, ...rest }) => ({
    key,
    props: rest as Omit<DashboardMetric, "key">,
  }))
);

const activeDevices = ref<ActiveDeviceItem[]>([
  { id: 1, short: "GW", name: "Gateway North-41", location: "Plant 3 ? Hanoi", version: "3.4.9", status: "Online", lastPing: "12s ago" },
  { id: 2, short: "ST", name: "Storage Sensor 12", location: "Warehouse ? Da Nang", version: "2.2.1", status: "Limited", lastPing: "35s ago" },
  { id: 3, short: "EN", name: "Energy Meter 07", location: "Building B ? HCMC", version: "4.0.0", status: "Offline", lastPing: "5m ago" },
  { id: 4, short: "AQ", name: "Air Quality Kit", location: "HQ ? HCMC", version: "5.1.2", status: "Online", lastPing: "50s ago" },
]);

const alerts = ref<AlertPanelItem[]>([
  { id: 1, title: "Offline device", message: "Energy Meter 07 lost connection for more than 5 minutes.", timestamp: "2 minutes ago" },
  { id: 2, title: "Battery threshold", message: "Storage Sensor 12 is at 17% battery.", timestamp: "18 minutes ago" },
  { id: 3, title: "New firmware available", message: "Gateway North-41 can upgrade to 3.4.10.", timestamp: "Today, 08:21" },
]);

const automationBatches = ref<AutomationBatchItem[]>([
  { id: 1, name: "Night irrigation", devices: 28, trigger: "Soil moisture < 40%", status: "Completed", updated: "10 minutes ago" },
  { id: 2, name: "Morning ventilation", devices: 14, trigger: "Temperature > 30?C", status: "Running", updated: "Just now" },
  { id: 3, name: "Weekly firmware roll", devices: 42, trigger: "Manual approval", status: "Completed", updated: "Yesterday" },
]);

onMounted(() => {
  lastUpdated.value = new Date();
});
</script>

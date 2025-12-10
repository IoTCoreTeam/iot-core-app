<template>
  <div class="w-full min-h-[80vh] bg-gray-50">
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
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase text-gray-600">Parameter trend</p>
              <h2 class="text-base font-semibold text-gray-900">Single metric chart</h2>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-[11px] text-gray-600">Select metric</label>
              <select
                v-model="selectedMetricKey"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800"
              >
                <option v-for="metric in metrics" :key="metric.key" :value="metric.key">
                  {{ metric.title }}
                </option>
              </select>
            </div>
          </div>

          <div class="mt-3">
            <div class="flex items-end justify-between text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <span class="inline-block h-2 w-2 rounded-full bg-blue-600" />
                Latest readings
              </div>
              <div class="flex items-center gap-3">
                <span>{{ selectedSeriesMinLabel }}</span>
                <span>{{ selectedSeriesMaxLabel }}</span>
              </div>
            </div>

            <div class="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
              <ClientOnly>
                <ApexChart
                  type="line"
                  height="260"
                  :options="chartOptions"
                  :series="chartSeries"
                />
              </ClientOnly>
            </div>
          </div>
        </div>
      </section>
      <section class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DashboardSensorCard v-for="metric in metrics" :key="metric.key" v-bind="metric" />
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase text-gray-600">Active devices</p>
              <h2 class="text-base font-semibold text-gray-900">Ordered by latest activity</h2>
              <p class="text-xs text-gray-500">Click a row to view mock controls.</p>
            </div>
            <button type="button" class="text-xs font-semibold text-blue-700 hover:underline">
              View all
            </button>
          </div>
          <div class="mt-3 divide-y divide-gray-100">
            <div
              v-for="device in activeDevices"
              :key="device.id"
              class="flex items-center justify-between gap-3 py-3"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                  {{ device.initials }}
                </div>
                <div>
                  <div class="text-sm font-semibold text-gray-900">{{ device.name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ device.location }} · {{ device.firmware }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <span
                  :class="[
                    'rounded-full px-2 py-1 text-[11px] font-semibold',
                    device.status === 'online'
                      ? 'bg-green-50 text-green-700'
                      : device.status === 'limited'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700',
                  ]"
                >
                  {{ device.statusLabel }}
                </span>
                <span class="text-gray-500">Last ping {{ device.lastPing }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900">Alerts</h3>
              <span class="text-xs text-gray-500">Live</span>
            </div>
            <div class="mt-3 space-y-3">
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="rounded-md border border-gray-100 p-3"
              >
                <div class="text-sm font-semibold text-gray-900">{{ alert.title }}</div>
                <p class="text-xs text-gray-600">{{ alert.detail }}</p>
                <div class="mt-1 text-[11px] text-gray-500">{{ alert.time }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900">Automation batches</h3>
              <span class="text-xs text-gray-500">Scheduled</span>
            </div>
            <div class="mt-3 space-y-3">
              <div
                v-for="batch in automationBatches"
                :key="batch.id"
                class="flex items-center justify-between rounded-md border border-gray-100 p-3"
              >
                <div>
                  <div class="text-sm font-semibold text-gray-900">{{ batch.name }}</div>
                  <p class="text-xs text-gray-600">{{ batch.description }}</p>
                </div>
                <span class="text-[11px] text-gray-500">{{ batch.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import DashboardSensorCard from "@/components/DashboardSensorCard.vue";

type Status = "good" | "warning" | "critical" | "info";

interface StatusRule {
  warnLow?: number;
  warnHigh?: number;
  dangerLow?: number;
  dangerHigh?: number;
}

interface DashboardMetric {
  key: string;
  title: string;
  subtitle: string;
  value: number;
  unit: string;
  icon: string;
  change: number | null;
  status: Status;
  statusText: string;
  description: string;
  min: number;
  max: number;
  trend: number[];
  rules?: StatusRule;
}

interface SeriesPoint {
  label: string;
  value: number;
}

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

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

const metricSeries = ref<Record<string, SeriesPoint[]>>({
  soilMoisture: [
    { label: "10:00", value: 46 },
    { label: "12:00", value: 47 },
    { label: "14:00", value: 48 },
    { label: "16:00", value: 49 },
    { label: "18:00", value: 48.5 },
  ],
  light: [
    { label: "10:00", value: 760 },
    { label: "12:00", value: 820 },
    { label: "14:00", value: 840 },
    { label: "16:00", value: 810 },
    { label: "18:00", value: 780 },
  ],
  rain: [
    { label: "10:00", value: 0.4 },
    { label: "12:00", value: 0.6 },
    { label: "14:00", value: 1.2 },
    { label: "16:00", value: 0.8 },
    { label: "18:00", value: 0.6 },
  ],
  airHumidity: [
    { label: "10:00", value: 60 },
    { label: "12:00", value: 61 },
    { label: "14:00", value: 62.5 },
    { label: "16:00", value: 63 },
    { label: "18:00", value: 62 },
  ],
  temperature: [
    { label: "10:00", value: 26.8 },
    { label: "12:00", value: 27.4 },
    { label: "14:00", value: 28.1 },
    { label: "16:00", value: 28.5 },
    { label: "18:00", value: 28.0 },
  ],
});

const selectedMetricKey = ref<string>(metrics.value[0]?.key ?? "");
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

const selectedMetric = computed(() =>
  metrics.value.find((metric) => metric.key === selectedMetricKey.value)
);
const selectedSeries = computed(() => metricSeries.value[selectedMetricKey.value] ?? []);

function formatValue(value: number) {
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
}

const seriesExtent = computed(() => {
  if (!selectedSeries.value.length) return { min: 0, max: 1 };
  const values = selectedSeries.value.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
});

const chartSeries = computed(() => [
  {
    name: selectedMetric.value?.title ?? "Metric",
    data: selectedSeries.value.map((point) => point.value),
  },
]);

const chartOptions = computed(() => {
  const categories = selectedSeries.value.map((point) => point.label);
  return {
    chart: {
      id: "parameter-trend",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    markers: { size: 4 },
    colors: ["#2563eb"],
    xaxis: {
      categories,
      labels: { style: { fontSize: "11px", colors: "#6b7280" } },
      axisBorder: { color: "#e5e7eb" },
      axisTicks: { color: "#e5e7eb" },
    },
    yaxis: {
      min: seriesExtent.value.min,
      max: seriesExtent.value.max,
      labels: { style: { fontSize: "11px", colors: "#6b7280" } },
    },
    grid: {
      strokeDashArray: 3,
      borderColor: "#e5e7eb",
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${formatValue(val)}${selectedMetric.value?.unit ? ` ${selectedMetric.value.unit}` : ""}`,
      },
    },
  };
});

const selectedSeriesMinLabel = computed(() => {
  if (!selectedSeries.value.length) return "Min --";
  const min = Math.min(...selectedSeries.value.map((p) => p.value));
  const unit = selectedMetric.value?.unit ?? "";
  return `Min ${formatValue(min)}${unit ? ` ${unit}` : ""}`;
});

const selectedSeriesMaxLabel = computed(() => {
  if (!selectedSeries.value.length) return "Max --";
  const max = Math.max(...selectedSeries.value.map((p) => p.value));
  const unit = selectedMetric.value?.unit ?? "";
  return `Max ${formatValue(max)}${unit ? ` ${unit}` : ""}`;
});

const activeDevices = ref([
  { id: 1, initials: "GW", name: "Gateway North-41", location: "Plant 3 · Hanoi", firmware: "Firmware 3.4.9", status: "online", statusLabel: "Online", lastPing: "12s ago" },
  { id: 2, initials: "ST", name: "Storage Sensor 12", location: "Warehouse · Da Nang", firmware: "Firmware 2.2.1", status: "limited", statusLabel: "Limited", lastPing: "35s ago" },
  { id: 3, initials: "EN", name: "Energy Meter 07", location: "Building B · HCMC", firmware: "Firmware 4.0.0", status: "offline", statusLabel: "Offline", lastPing: "5m ago" },
  { id: 4, initials: "AQ", name: "Air Quality Kit", location: "HQ · HCMC", firmware: "Firmware 5.1.2", status: "online", statusLabel: "Online", lastPing: "50s ago" },
]);

const alerts = ref([
  { id: 1, title: "Offline device", detail: "Energy Meter 07 lost connection for more than 5 minutes.", time: "2 minutes ago" },
  { id: 2, title: "Battery threshold", detail: "Storage Sensor 12 is at 17% battery.", time: "18 minutes ago" },
  { id: 3, title: "New firmware available", detail: "Gateway North-41 can upgrade to 3.4.10.", time: "Today, 08:21" },
]);

const automationBatches = ref([
  { id: 1, name: "Night irrigation", description: "Start pumps at 22:00 when soil moisture < 40%.", time: "Starts 22:00" },
  { id: 2, name: "Morning ventilation", description: "Open vents if temp > 30°C at 07:00.", time: "Tomorrow 07:00" },
  { id: 3, name: "Weekly firmware roll", description: "Push v5.1.2 to sensors across Zone 1.", time: "Friday 21:00" },
]);

function evaluateStatus(metric: DashboardMetric, nextValue: number) {
  if (!metric.rules) {
    return { status: metric.status, label: metric.statusText };
  }

  const { warnLow, warnHigh, dangerLow, dangerHigh } = metric.rules;

  if (
    (dangerLow !== undefined && nextValue < dangerLow) ||
    (dangerHigh !== undefined && nextValue > dangerHigh)
  ) {
    return { status: "critical" as const, label: "Critical" };
  }

  if (
    (warnLow !== undefined && nextValue < warnLow) ||
    (warnHigh !== undefined && nextValue > warnHigh)
  ) {
    return { status: "warning" as const, label: "Attention" };
  }

  return { status: "good" as const, label: "Stable" };
}

function simulateUpdate() {
  const updatedSeries: Record<string, SeriesPoint[]> = { ...metricSeries.value };
  const now = new Date();
  const timeLabel = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  metrics.value = metrics.value.map((metric) => {
    const current = metric.value;
    const range = metric.max - metric.min;
    const variance = (Math.random() - 0.5) * (range * 0.1);
    const nextValueRaw = current + variance;
    const clamped = Math.min(metric.max, Math.max(metric.min, nextValueRaw));
    const nextValue = Number(clamped.toFixed(1));

    const diffPercent =
      current === 0
        ? 0
        : ((nextValue - current) / Math.max(Math.abs(current), 1)) * 100;
    const boundedDiff = Math.max(-150, Math.min(150, diffPercent));

    const previousTrend = metric.trend?.length ? metric.trend : [current];
    const updatedTrend = [...previousTrend.slice(-6), nextValue];
    const { status, label } = evaluateStatus(metric, nextValue);

    const existingSeries = metricSeries.value[metric.key] ?? [];
    const nextSeries = [...existingSeries.slice(-4), { label: timeLabel, value: nextValue }];
    updatedSeries[metric.key] = nextSeries;

    return {
      ...metric,
      value: nextValue,
      change: Number(boundedDiff.toFixed(1)),
      trend: updatedTrend,
      status,
      statusText: label,
    };
  });

  metricSeries.value = updatedSeries;
  lastUpdated.value = new Date();
}

onMounted(() => {
  lastUpdated.value = new Date();
});
</script>

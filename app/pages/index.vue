<template>
  <div class="w-full min-h-[80vh] bg-gray-50 p-4">
    <div class="mx-auto flex max-w-8xl flex-col gap-2">
      <section
        class="grid grid-cols-1 gap-2 lg:grid-cols-3 xl:grid-cols-5 items-start"
      >
        <div class="flex flex-col gap-4 h-full lg:col-span-1 xl:col-span-1">
          <DevicesControlLatestSensorDataPanel />
        </div>
        <SingleMetricChart
          class="lg:col-span-2 xl:col-span-4"
          :metrics="metrics"
          :series="chartSeries"
          :selected-metric-key="selectedMetricKey"
          :selected-timeframe="selectedTimeframe"
          @update:selected-metric-key="handleMetricChange"
          @update:selected-timeframe="handleTimeframeChange"
        />
      </section>
      <section
        class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <template v-if="isSensorCardLoading">
          <div
            v-for="index in sensorCardSkeletons"
            :key="index"
            class="animate-pulse overflow-hidden rounded border border-gray-200 bg-white p-4"
          >
            <div class="h-3 w-2/5 rounded bg-gray-200"></div>
            <div class="mt-3 text-[10px] uppercase tracking-wide text-gray-400">
              Current level
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <div class="h-8 w-3/5 rounded bg-gray-200"></div>
              <div class="h-4 w-1/5 rounded bg-gray-200"></div>
            </div>
            <div class="mt-4 h-16 w-full rounded bg-gray-100"></div>
          </div>
        </template>
        <template v-else>
          <DashboardSensorCard
            v-for="metric in metricCardItems"
            :key="metric.key"
            v-bind="metric.props"
          />
        </template>
      </section>

      <section class="grid grid-cols-1 gap-2 lg:grid-cols-5 items-start">
        <div class="lg:col-span-1 h-full">
          <!-- ActiveDevicesPanel now handles its own data fetching via SSE -->
          <DevicesControlActiveDevicesPanel />
        </div>
        <div class="lg:col-span-2 h-full">
          <DevicesControlTypeDistributionPanel
            :series="typeDistributionSeries"
            :categories="typeDistributionCategories"
          />
        </div>
        <div class="lg:col-span-2 h-full">
          <DevicesControlAutomationBatches :automations="automationBatches" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import DashboardSensorCard from "@/components/DashboardSensorCard.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";

const authStore = useAuthStore();
import type {
  DashboardMetric,
  SeriesPoint,
  TimeframeKey,
} from "@/types/dashboard";

interface AutomationBatchItem {
  id: number;
  name: string;
  devices: number;
  trigger: string;
  status: "Completed" | "Running";
  updated: string;
}

const sensorTypeMap: Record<string, string> = {
  soilMoisture: "soil_moisture",
  light: "light",
  rain: "rain",
  airHumidity: "humidity",
  temperature: "temperature",
};

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
    : "Updating...",
);

const typeDistributionCategories = ref<string[]>([]);
const typeDistributionSeries = ref<{ name: string; data: number[] }[]>([]);

const automationBatches = ref<AutomationBatchItem[]>([]);

const sensorCardSkeletons = Array.from({ length: 5 }, (_, index) => index);

const isSensorCardLoading = ref(true);

const metricCardItems = computed(() =>
  metrics.value.map(({ key, ...rest }) => ({
    key,
    props: {
      ...rest,
      sensorType: sensorTypeMap[key] ?? key,
    },
  })),
);

const selectedMetricKey = ref<string>(metrics.value[0]?.key || "");
const selectedTimeframe = ref<TimeframeKey>("second");
// const chartSeries = ref<SeriesPoint[]>([]); // handled in child or removed
const chartSeries = ref<SeriesPoint[]>([]);

function handleMetricChange(key: string) {
  selectedMetricKey.value = key;
  // fetchChartData(); // Removed
}

function handleTimeframeChange(timeframe: TimeframeKey) {
  selectedTimeframe.value = timeframe;
  // fetchChartData(); // Removed
}

onMounted(() => {
  lastUpdated.value = new Date();
  setTimeout(() => {
    isSensorCardLoading.value = false;
  }, 600);

  if (authStore.accessToken) {
    fetchTypeDistribution();
  }
});

async function fetchTypeDistribution() {
  if (!import.meta.client) return;

  try {
    const authorization = authStore.authorizationHeader;
    if (!authorization) return;

    const response = await fetch(
      `${apiConfig.auth}/metrics/system-logs-count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
      },
    );

    const data = await response.json().catch(() => ({}));

    if (response.ok && data) {
      if (Array.isArray(data.categories)) {
        typeDistributionCategories.value = data.categories;
      }
      if (Array.isArray(data.series)) {
        typeDistributionSeries.value = data.series;
      }
    }
  } catch (error) {
    console.error("Failed to fetch system logs distribution:", error);
  }
}
</script>

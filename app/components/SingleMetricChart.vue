<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase text-gray-600">Parameter trend</p>
        <h2 class="text-base font-semibold text-gray-900">Single metric chart</h2>
      </div>
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div class="flex items-center gap-2 text-[11px] text-gray-600">
          <label class="text-[11px] text-gray-600">Select metric</label>
          <select
            v-model="selectedMetricKey"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-800"
          >
            <option v-for="metric in props.metrics" :key="metric.key" :value="metric.key">
              {{ metric.title }}
            </option>
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
          <span>Filter by</span>
          <div class="inline-flex rounded-md border border-gray-300 bg-white p-1">
            <button
              v-for="option in timeframeOptions"
              :key="option.value"
              type="button"
              class="rounded px-2.5 py-1 text-xs font-semibold tracking-wide transition"
              :class="option.value === selectedTimeframe ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'"
              :aria-pressed="option.value === selectedTimeframe"
              @click="selectedTimeframe = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="chartIsFetching || chartError" class="mt-2 text-[11px]">
      <div v-if="chartIsFetching" class="inline-flex items-center gap-1 font-semibold text-blue-600">
        <span class="inline-block h-2 w-2 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        Fetching latest data from sensor API...
      </div>
      <p v-else class="font-semibold text-red-500">
        {{ chartError }}
      </p>
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
          <template #fallback>
            <div class="flex min-h-[260px] items-center justify-center gap-2 text-sm text-gray-500">
              <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
              Loading chart...
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from "vue";
import type { ApexOptions } from "apexcharts";
import type { DashboardMetric, SeriesPoint, TimeframeKey } from "@/types/dashboard";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

const props = defineProps<{
  metrics: DashboardMetric[];
}>();

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

interface SensorHistoryPoint {
  timestamp?: string;
  value?: number;
  temperature?: number;
  humidity?: number;
  readings?: number;
  payload?: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface SensorHistoryResponse {
  status?: string;
  data?: SensorHistoryPoint[];
}

const timeframeWindowConfig: Record<
  TimeframeKey,
  { windowMs: number; stepMs: number; labelFormat: Intl.DateTimeFormatOptions }
> = {
  second: {
    windowMs: 30 * 10 * 1000,
    stepMs: 10 * 1000,
    labelFormat: { minute: "2-digit", second: "2-digit" },
  },
  minute: {
    windowMs: 30 * 60 * 1000,
    stepMs: 60 * 1000,
    labelFormat: { hour: "2-digit", minute: "2-digit" },
  },
  hour: {
    windowMs: 24 * 60 * 60 * 1000,
    stepMs: 60 * 60 * 1000,
    labelFormat: { day: "2-digit", hour: "2-digit" },
  },
  day: {
    windowMs: 30 * 24 * 60 * 60 * 1000,
    stepMs: 24 * 60 * 60 * 1000,
    labelFormat: { month: "short", day: "2-digit" },
  },
};

const metricValueFieldMap: Record<string, string> = {
  airHumidity: "humidity",
  temperature: "temperature",
};

const SENSOR_HISTORY_ENDPOINT = `${apiConfig.sensorData}/sensor-data/history`;
const authStore = useAuthStore();
const isClient = import.meta.client;
const selectedMetricKey = ref<string>("");
const timeframeOptions: { label: string; value: TimeframeKey }[] = [
  { label: "second", value: "second" },
  { label: "minute", value: "minute" },
  { label: "hour", value: "hour" },
  { label: "day", value: "day" },
];
const selectedTimeframe = ref<TimeframeKey>("hour");
const latestSeries = ref<SeriesPoint[] | null>(null);
const chartIsFetching = ref(false);
const chartError = ref<string | null>(null);
const abortController = ref<AbortController | null>(null);

watch(
  () => props.metrics,
  (metrics) => {
    if (!metrics?.length) {
      selectedMetricKey.value = "";
      return;
    }

    if (!selectedMetricKey.value || !metrics.some((metric) => metric.key === selectedMetricKey.value)) {
      selectedMetricKey.value = metrics[0].key;
    }
  },
  { immediate: true }
);

const selectedMetric = computed(() =>
  props.metrics.find((metric) => metric.key === selectedMetricKey.value)
);
const selectedSeries = computed(() => latestSeries.value ?? []);

if (isClient) {
  watch(
    [selectedMetricKey, selectedTimeframe],
    ([metricKey, timeframe]) => {
      latestSeries.value = null;
      chartError.value = null;

      if (!metricKey) {
        chartIsFetching.value = false;
        abortController.value?.abort();
        abortController.value = null;
        return;
      }

      fetchMetricHistory(metricKey, timeframe);
    },
    { immediate: true }
  );
}

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

const chartOptions = computed<ApexOptions>(() => {
  const categories = selectedSeries.value.map((point) => point.label);
  return {
    chart: {
      id: `parameter-trend-${selectedTimeframe.value}`,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const, width: 2.5 },
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
        formatter: (val: number) =>
          `${formatValue(val)}${selectedMetric.value?.unit ? ` ${selectedMetric.value.unit}` : ""}`,
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

async function fetchMetricHistory(metricKey: string, timeframe: TimeframeKey) {
  abortController.value?.abort();

  const controller = new AbortController();
  abortController.value = controller;
  chartIsFetching.value = true;

  const params = buildHistoryParams(metricKey, timeframe);
  const headers: HeadersInit = { Accept: "application/json" };
  const authorizationHeader = authStore.authorizationHeader;
  if (authorizationHeader) {
    headers.Authorization = authorizationHeader;
  }

  try {
    const response = await fetch(`${SENSOR_HISTORY_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch chart data (${response.status}).`);
    }

    const payload = (await response.json()) as SensorHistoryResponse;
    const history = Array.isArray(payload?.data) ? payload.data : [];
    const formatter = new Intl.DateTimeFormat("vi-VN", timeframeWindowConfig[timeframe].labelFormat);

    latestSeries.value = history.map((entry) => {
      const date = entry.timestamp ? new Date(entry.timestamp) : new Date();
      const label = Number.isNaN(date.getTime()) ? formatter.format(new Date()) : formatter.format(date);
      return {
        label,
        value: resolvePointValue(entry, metricKey),
      };
    });

    chartError.value = null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    console.error("Failed to fetch sensor history:", error);
    chartError.value = error instanceof Error ? error.message : "Failed to fetch chart data.";
    latestSeries.value = [];
  } finally {
    if (abortController.value === controller) {
      abortController.value = null;
      chartIsFetching.value = false;
    }
  }
}

function buildHistoryParams(metricKey: string, timeframe: TimeframeKey) {
  const config = timeframeWindowConfig[timeframe];
  const now = Date.now();
  const start = new Date(now - config.windowMs);
  const intervalMinutes = timeframe === "second" ? 10 : 1;

  const params = new URLSearchParams({
    start: start.toISOString(),
    end: new Date(now).toISOString(),
    interval: String(intervalMinutes),
    timeframe,
  });

  if (metricKey) {
    params.set("metric", metricKey);
  }

  return params;
}

function resolvePointValue(point: SensorHistoryPoint, metricKey: string) {
  const preferredFields = [
    metricValueFieldMap[metricKey],
    metricKey,
    "value",
    "temperature",
    "humidity",
    "readings",
  ].filter((field): field is string => Boolean(field));

  for (const field of preferredFields) {
    const rawValue = (point as Record<string, unknown>)[field];
    const coerced =
      typeof rawValue === "number" ? rawValue : typeof rawValue === "string" ? Number(rawValue) : null;
    if (typeof coerced === "number" && Number.isFinite(coerced)) {
      return coerced;
    }
  }

  if (point.payload && typeof point.payload === "object") {
    const rawPayloadValue = (point.payload as Record<string, unknown>)[metricKey];
    const payloadValue =
      typeof rawPayloadValue === "number"
        ? rawPayloadValue
        : typeof rawPayloadValue === "string"
        ? Number(rawPayloadValue)
        : null;
    if (typeof payloadValue === "number" && Number.isFinite(payloadValue)) {
      return payloadValue;
    }
  }

  return 0;
}

onBeforeUnmount(() => {
  abortController.value?.abort();
});
</script>

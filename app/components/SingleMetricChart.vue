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
            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800"
          >
            <option v-for="metric in props.metrics" :key="metric.key" :value="metric.key">
              {{ metric.title }}
            </option>
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
          <span>Filter by</span>
          <div class="inline-flex rounded-md border border-gray-300 bg-white p-1 shadow-sm">
            <button
              v-for="option in timeframeOptions"
              :key="option.value"
              type="button"
              class="rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition"
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
import { computed, defineAsyncComponent, ref, watch } from "vue";
import type { ApexOptions } from "apexcharts";
import type { DashboardMetric, SeriesCollection, TimeframeKey } from "@/types/dashboard";

const props = defineProps<{
  metrics: DashboardMetric[];
  metricSeries: Record<string, SeriesCollection>;
}>();

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

const selectedMetricKey = ref<string>("");
const timeframeOptions: { label: string; value: TimeframeKey }[] = [
  { label: "SECOND", value: "second" },
  { label: "MINUTE", value: "minute" },
  { label: "HOUR", value: "hour" },
  { label: "DAY", value: "day" },
];
const selectedTimeframe = ref<TimeframeKey>("hour");

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

watch(
  () => props.metricSeries[selectedMetricKey.value],
  (series) => {
    if (!series) {
      return;
    }
    if (!series[selectedTimeframe.value]?.length) {
      const fallback = timeframeOptions.find((option) => series[option.value]?.length);
      if (fallback) {
        selectedTimeframe.value = fallback.value;
      }
    }
  },
  { immediate: true }
);

const selectedMetric = computed(() =>
  props.metrics.find((metric) => metric.key === selectedMetricKey.value)
);
const selectedSeries = computed(() => {
  const series = props.metricSeries[selectedMetricKey.value];
  return series ? series[selectedTimeframe.value] ?? [] : [];
});

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
</script>

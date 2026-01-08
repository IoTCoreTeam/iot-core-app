<template>
  <div class="bg-white border border-slate-200 rounded h-full p-4">
    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
        <div class="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
          <span>Mode</span>
          <div class="inline-flex rounded-md border border-gray-300 bg-white p-1">
            <button
              v-for="option in modeOptions"
              :key="option.value"
              type="button"
              class="rounded px-2.5 py-1 text-xs tracking-wide transition w-16"
              :class="
                mode === option.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
              @click="mode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div class="flex items-center gap-2 text-[11px] text-gray-600">
          <label class="text-[11px] text-gray-600">Select metric</label>
          <select
            :value="selectedMetricKey"
            @change="
              updateMetricKey(($event.target as HTMLSelectElement).value)
            "
            class="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-800"
          >
            <option
              v-for="metric in props.metrics"
              :key="metric.key"
              :value="metric.key"
            >
              {{ metric.title }}
            </option>
          </select>
        </div>
        <div
          class="flex flex-wrap items-center gap-2 text-[11px] text-gray-600"
        >
          <span>Filter by</span>
          <div
            class="inline-flex rounded-md border border-gray-300 bg-white p-1"
          >
            <button
              v-for="option in timeframeOptions"
              :key="option.value"
              type="button"
              class="rounded px-2.5 py-1 text-xs tracking-wide transition"
              :class="
                option.value === selectedTimeframe
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              "
              :aria-pressed="option.value === selectedTimeframe"
              @click="updateTimeframe(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <button
            type="button"
            class="ml-2 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            @click="toggleLimitVisibility"
          >
            {{ limitToggleLabel }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="displayLoading || displayError" class="mt-2 text-[11px]">
      <div
        v-if="displayLoading"
        class="inline-flex items-center gap-1 font-semibold text-blue-600"
      >
        <span
          class="inline-block h-2 w-2 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
        />
        Fetching latest data...
      </div>
      <p v-else class="font-semibold text-red-500">
        {{ displayError }}
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

      <div
        class="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white"
      >
        <ClientOnly>
          <ApexChart
            type="line"
            height="260"
            :options="chartOptions"
            :series="chartSeries"
          />
          <template #fallback>
            <div
              class="flex min-h-[300px] items-center justify-center gap-2 text-sm text-gray-500"
            >
              <span
                class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500"
              />
              Loading chart...
            </div>
          </template>
        </ClientOnly>
      </div>
      <div
        class="mt-2 flex flex-row flex-wrap items-center justify-start gap-2 text-xs text-gray-500"
      >
        <div class="flex items-center gap-2">
          <label class="text-[11px] text-gray-600">Per page</label>
          <select
            class="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700"
            :value="pageSize"
            @change="handlePageSizeChange"
          >
            <option
              v-for="option in pageSizeOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
        <button
          type="button"
          class="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
          :disabled="!canNextPage"
          @click="goToNextPage"
        >
          ← Prev
        </button>
        <span
          class="px-3 py-1 text-xs text-gray-600"
        >
          {{ currentPageLabel }}
        </span>
        <button
          type="button"
          class="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
          :disabled="!canPrevPage"
          @click="goToPreviousPage"
        >
          → Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import type { ApexOptions } from "apexcharts";
import type {
  DashboardMetric,
  SeriesPoint,
  TimeframeKey,
} from "@/types/dashboard";
import { useMetricQuery } from "@/composables/SingleMetricChart/useMetricQuery";

const props = withDefaults(
  defineProps<{
    metrics: DashboardMetric[];
    series?: SeriesPoint[];
    isLoading?: boolean;
    error?: string | null;
    selectedMetricKey: string;
    selectedTimeframe: TimeframeKey;
    sensorIds?: string[]; // Updated prop
    sensorType?: string; // Updated prop
    deviceId?: string; // Legacy
    deviceType?: string; // Legacy
  }>(),
  { selectedTimeframe: "second" as TimeframeKey }
);

const emit = defineEmits<{
  (e: "update:selectedMetricKey", value: string): void;
  (e: "update:selectedTimeframe", value: TimeframeKey): void;
}>();

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

const showLimit = ref(true);
const limitToggleLabel = computed(() =>
  showLimit.value ? "Hide limit" : "Show limit"
);

const timeframeOptions: { label: string; value: TimeframeKey }[] = [
  { label: "second", value: "second" },
  { label: "minute", value: "minute" },
  { label: "hour", value: "hour" },
  { label: "day", value: "day" },
];

const modeOptions = [
  { label: "realtime", value: "realtime" },
  { label: "query", value: "query" },
] as const;
const mode = ref<"realtime" | "query">("query");

const metricQuery = useMetricQuery(props);
const {
  fetchedSeries,
  isFetching,
  fetchError,
  metricLimit,
  hasMore,
  pageSize,
  currentPage,
  goToPreviousPage,
  goToNextPage,
  setPageSize,
} = metricQuery;

const selectedMetric = computed(() =>
  props.metrics.find((metric) => metric.key === props.selectedMetricKey)
);

function updateMetricKey(value: string) {
  emit("update:selectedMetricKey", value);
}

function updateTimeframe(value: TimeframeKey) {
  emit("update:selectedTimeframe", value);
}

function formatValue(value: number) {
  return value.toFixed(3);
}

const displayLoading = computed(() => {
  const isGroupedView =
    props.selectedTimeframe === "minute" ||
    props.selectedTimeframe === "hour" ||
    props.selectedTimeframe === "day";
  return props.isLoading || (isGroupedView && isFetching.value);
});
const displayError = computed(() => props.error || fetchError.value);

const displaySeries = computed(() => {
  if (fetchedSeries.value.length > 0) return fetchedSeries.value;
  // Fallback
  return [
    {
      name: selectedMetric.value?.title ?? "Metric",
      data: (props.series || []).map((p) => ({ x: p.label, y: p.value })),
    },
  ];
});

const allValues = computed(() => {
  const values = displaySeries.value.flatMap((s) =>
    s.data.map((p: any) => p.y)
  );
  if (metricLimit.value !== null && showLimit.value) {
    values.push(metricLimit.value);
  }
  return values;
});

const seriesExtent = computed(() => {
  if (!allValues.value.length) return { min: 0, max: 1 };
  const values = allValues.value;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
});

const chartSeries = computed(() => displaySeries.value);

const chartOptions = computed<ApexOptions>(() => {
  const categories = displaySeries.value[0]?.data.map((p: any) => p.x) ?? [];

  return {
    chart: {
      id: `parameter-trend-${props.selectedTimeframe}`,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    },
    dataLabels: {
      enabled: false,
      formatter: (val: number) => val.toFixed(3),
      style: {
        fontSize: "10px",
        colors: ["#374151"],
      },
      background: {
        enabled: true,
        foreColor: "#fff",
        borderRadius: 2,
        padding: 4,
        opacity: 0.9,
        borderWidth: 1,
        borderColor: "#e5e7eb",
      },
    },
    stroke: { curve: "smooth" as const, width: 2.5 },
    markers: { size: 4 },
    xaxis: {
      categories,
      labels: { style: { fontSize: "11px", colors: "#6b7280" } },
      axisBorder: { color: "#e5e7eb" },
      axisTicks: { color: "#e5e7eb" },
      reversed: true,
    },
    yaxis: {
      min: seriesExtent.value.min,
      max: seriesExtent.value.max,
      labels: {
        style: { fontSize: "11px", colors: "#6b7280" },
        formatter: (val: number) => val.toFixed(3),
      },
    },
    annotations: {
      yaxis:
        showLimit.value && metricLimit.value !== null
          ? [
              {
                y: metricLimit.value,
                borderColor: "#f97316",
                strokeDashArray: 4,
                label: {
                  borderColor: "#f97316",
                  style: { color: "#fff", background: "#f97316" },
                  text: limitAnnotationLabel.value,
                },
              },
            ]
          : [],
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
  if (!allValues.value.length) return "Min --";
  const min = Math.min(...allValues.value);
  const unit = selectedMetric.value?.unit ?? "";
  return `Min ${formatValue(min)}${unit ? ` ${unit}` : ""}`;
});

const selectedSeriesMaxLabel = computed(() => {
  if (!allValues.value.length) return "Max --";
  const max = Math.max(...allValues.value);
  const unit = selectedMetric.value?.unit ?? "";
  return `Max ${formatValue(max)}${unit ? ` ${unit}` : ""}`;
});

const limitAnnotationLabel = computed(() => {
  if (metricLimit.value === null) return "";
  const unit = selectedMetric.value?.unit ?? "";
  return `Limit ${formatValue(metricLimit.value)}${unit ? ` ${unit}` : ""}`;
});

function toggleLimitVisibility() {
  showLimit.value = !showLimit.value;
}

const pageSizeOptions = [10, 20, 50];

const canPrevPage = computed(() => currentPage.value > 1);
const canNextPage = computed(() => hasMore.value);
const currentPageLabel = computed(() =>
  currentPage.value === 1 ? "Latest" : String(currentPage.value)
);

function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const rawValue = Number(target.value ?? pageSizeOptions[0]);
  const value: number = Number.isNaN(rawValue)
    ? (pageSizeOptions[0] ?? 0)
    : rawValue;
  setPageSize(value);
}
</script>

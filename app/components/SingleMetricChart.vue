<template>
  <div class="bg-white border border-slate-200 rounded h-full p-4">
    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <div></div>
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
              class="flex min-h-[260px] items-center justify-center gap-2 text-sm text-gray-500"
            >
              <span
                class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500"
              />
              Loading chart...
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch, onMounted } from "vue";
import type { ApexOptions } from "apexcharts";
import type {
  DashboardMetric,
  SeriesPoint,
  TimeframeKey,
} from "@/types/dashboard";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

const props = defineProps<{
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
}>();

const emit = defineEmits<{
  (e: "update:selectedMetricKey", value: string): void;
  (e: "update:selectedTimeframe", value: TimeframeKey): void;
}>();

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));
const authStore = useAuthStore();

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

const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");

const sensorTypeMapping: Record<string, string> = {
  soilMoisture: "soil_moisture",
  airHumidity: "humidity",
};
function resolveSensorTypeForApi() {
  const sensorKey = props.sensorType || props.selectedMetricKey;
  if (!sensorKey) {
    return undefined;
  }
  return sensorTypeMapping[sensorKey] || sensorKey;
}

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

// Local state for fetched data
// Now handling multiple series: { name: string, data: {x,y}[] }
const fetchedSeries = ref<{ name: string; data: { x: string; y: number }[] }[]>(
  []
);
const isFetching = ref(false);
const fetchError = ref<string | null>(null);
const metricLimit = ref<number | null>(null);

const displayLoading = computed(() => props.isLoading || isFetching.value);
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

// Calculate extent from all data points
const allValues = computed(() => {
  const values = displaySeries.value.flatMap((s) => s.data.map((p: any) => p.y));
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
  // Use categories from the first series or let Apex handle x/y.
  // We will use 'category' type with labels from the first series if available,
  // or use the 'data' directly which has x/y. Apex supports { x, y } in data.
  // But we need to define categories if we want to ensure alignment on category axis.
  // However, with multiple sensors, times might not align perfectly if data is sparse?
  // Backend groups by time buckets, so if buckets are consistent they should align.

  // Let's use the categories approach to keep styling consistent with previous.
  // Assuming first series represents the timeline.
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
    // colors: ["#2563eb"],
    xaxis: {
      categories,
      labels: { style: { fontSize: "11px", colors: "#6b7280" } },
      axisBorder: { color: "#e5e7eb" },
      axisTicks: { color: "#e5e7eb" },
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

async function fetchData() {
  // Use sensorIds if available, else fallback to deviceId (converted to array)
  const ids = props.sensorIds || (props.deviceId ? [props.deviceId] : []);

  // If ids is empty, we query for ALL sensors of the given type (wildcard query)
  // so we do NOT return early anymore.

  isFetching.value = true;
  fetchError.value = null;

  try {
    const timeFieldMap: Record<string, string> = {
      second: "sec",
      minute: "minute",
      hour: "hour",
      day: "day",
    };
    const time_field = timeFieldMap[props.selectedTimeframe] || "hour";

    const mappedType = resolveSensorTypeForApi();

    const params = new URLSearchParams();
    params.append("time_field", time_field);
    if (mappedType) {
      params.append("sensor_type", mappedType);
    }
    if (ids.length > 0) {
      ids.forEach((id) => params.append("sensor_id", id));
    }

    const res = await fetch(
      `http://localhost:8017/v1/sensors/query?${params.toString()}`
    );

    if (!res.ok) throw new Error("API Error");

    const data = await res.json();

    // Sort data from oldest to newest
    data.sort((a: any, b: any) => {
      const getTimestamp = (item: any) =>
        item[time_field] ||
        item._id.time ||
        item._id.timestamp ||
        item.timestamp;
      return (
        new Date(getTimestamp(a)).getTime() -
        new Date(getTimestamp(b)).getTime()
      );
    });

    // Group result by sensorId to create multiple series
    const groups: Record<string, any[]> = {};

    data.forEach((item: any) => {
      const sId = item._id.sensorId;
      const time =
        item[time_field] ||
        item._id.time ||
        item._id.timestamp ||
        item.timestamp;
      const val = item.value;
      const name = item._id.sensorName || sId;

      if (!groups[name]) groups[name] = [];

      let label = time;
      try {
        const d = new Date(time);
        if (!isNaN(d.getTime())) {
          if (props.selectedTimeframe === "second")
            label = d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
          else if (props.selectedTimeframe === "minute")
            label = d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          else if (props.selectedTimeframe === "hour")
            label = d.toLocaleTimeString([], {
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          else
            label = d.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            });
        }
      } catch (e) {}

      groups[name].push({ x: label, y: val });
    });

    fetchedSeries.value = Object.keys(groups).map((name) => ({
      name,
      data: groups[name] ?? [],
    }));
  } catch (err: any) {
    console.error(err);
    fetchError.value = err.message || "Failed to fetch data";
    fetchedSeries.value = [];
  } finally {
    isFetching.value = false;
  }
}

async function fetchMetricLimit() {
  const sensorType = resolveSensorTypeForApi();
  if (!sensorType) {
    metricLimit.value = null;
    return;
  }

  if (!CONTROL_MODULE_BASE || !authStore.authorizationHeader) {
    metricLimit.value = null;
    return;
  }

  const headers: Record<string, string> = {};
  if (authStore.authorizationHeader) {
        headers.Authorization = authStore.authorizationHeader;
  }

  try {
    const res = await fetch(
      `${CONTROL_MODULE_BASE}/node-sensors/metric-limit/${encodeURIComponent(
        sensorType
      )}`,
      { headers }
    );

    if (!res.ok) {
      throw new Error("Metric limit API error");
    }

    const payload = await res.json();

    if (!payload.success) {
      throw new Error(payload.message || "Metric limit not available");
    }

    const limitValue = Number(payload.data);
    metricLimit.value = Number.isNaN(limitValue) ? null : limitValue;
  } catch (err: any) {
    console.error(err);
    metricLimit.value = null;
  }
}

watch(
  [
    () => props.selectedMetricKey,
    () => props.selectedTimeframe,
    () => props.sensorIds,
    () => props.sensorType,
    () => props.deviceId,
  ],
  () => {
    fetchData();
  },
  { immediate: true }
);

watch(
  [
    () => props.sensorType,
    () => props.selectedMetricKey,
    () => authStore.authorizationHeader,
  ],
  () => {
    fetchMetricLimit();
  },
  { immediate: true }
);

onMounted(() => {
  fetchData();
});
</script>

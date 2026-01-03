<template>
  <div class="relative overflow-hidden rounded border border-gray-200 bg-white p-4">
    <div class="flex items-center gap-3">
      <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700">
        <BootstrapIcon :name="icon" class="h-3.5 w-3.5" />
      </div>
      <div>
        <p class="text-[10px] uppercase tracking-wide text-gray-500">
          {{ subtitle }}
        </p>
        <h3 class="text-sm font-semibold text-gray-800 leading-tight">
          {{ title }}
        </h3>
      </div>
    </div>

    <div class="mt-3">
      <div class="text-[10px] uppercase tracking-wide text-gray-500">
        Current level
      </div>
      <div class="mt-1 flex items-baseline gap-2">
        <span class="text-2xl font-bold text-gray-900">{{ latestValue }}</span>
        <span v-if="unit" class="text-sm text-gray-500">{{ unit }}</span>
      </div>
    </div>

    <div v-if="chartPoints" class="mt-3">
      <svg viewBox="0 0 100 60" class="h-16 w-full">
        <rect x="0" y="0" width="100" height="60" fill="transparent" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" stroke-width="1" />
        <line x1="8" y1="5" x2="8" y2="50" stroke="#e5e7eb" stroke-width="1" />
        <polygon :points="chartAreaPoints" fill="#dbeafe" opacity="0.8" />
        <polyline
          :points="chartPoints"
          stroke="#2563eb"
          stroke-width="2.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { BootstrapIconName } from "@/types/bootstrap-icon";

type Status = "good" | "warning" | "critical" | "info";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    value: number | string;
    unit?: string;
    icon: BootstrapIconName;
    change?: number | null;
    status?: Status;
    statusText?: string;
    description?: string;
    min?: number;
    max?: number;
    trend?: number[];
    sensorType?: string;
  }>(),
  {
    subtitle: "Live monitor",
    unit: "",
    change: null,
    status: "info",
    statusText: "Monitoring",
    description: "Live reading from the field sensor.",
    min: undefined,
    max: undefined,
    trend: () => [],
    sensorType: undefined,
  }
);

const progress = computed(() => {
  if (props.min === undefined || props.max === undefined) return null;
  if (typeof props.value !== "number") return null;

  const range = props.max - props.min;
  const safeRange = range === 0 ? 1 : range;
  const clamped = Math.min(props.max, Math.max(props.min, props.value));
  const percent = ((clamped - props.min) / safeRange) * 100;

  return Math.min(100, Math.max(0, percent));
});

const displayValue = computed(() =>
  typeof props.value === "number"
    ? Number(props.value.toFixed(1)).toString()
    : props.value
);

interface ChartPoint {
  x: number;
  y: number;
}

const fetchedTrend = ref<number[]>([]);

const chartTrend = computed(() => {
  if (fetchedTrend.value.length >= 2) return fetchedTrend.value;
  return props.trend ?? [];
});

const latestValue = computed(() => {
  const series = chartTrend.value;
  const lastValue = series[series.length - 1];
  if (typeof lastValue === "number" && !Number.isNaN(lastValue)) {
    return Number(lastValue.toFixed(1)).toString();
  }
  return displayValue.value;
});

const chartCoordinates = computed<ChartPoint[]>(() => {
  if (!chartTrend.value || chartTrend.value.length < 2) return [];

  const max = Math.max(...chartTrend.value);
  const min = Math.min(...chartTrend.value);
  const range = max === min ? 1 : max - min;
  const paddedMin = min - range * 0.1;
  const paddedRange = range === 0 ? 1 : range * 1.2;
  const xOffset = 8;
  const usableWidth = 92;
  const yScale = 40;
  return chartTrend.value.map((value, index) => {
    const x = (index / (chartTrend.value.length - 1)) * usableWidth + xOffset;
    const normalizedY = 50 - ((value - paddedMin) / paddedRange) * yScale;
    const y = Math.min(50, Math.max(0, normalizedY));
    return { x, y };
  });
});

const chartPoints = computed(() =>
  chartCoordinates.value.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")
);

const chartAreaPoints = computed(() => {
  const coordinates = chartCoordinates.value;
  if (!coordinates.length) return "";
  const [firstPoint] = coordinates;
  const lastPoint = coordinates[coordinates.length - 1];
  if (!firstPoint || !lastPoint) return "";
  return `${chartPoints.value} ${lastPoint.x.toFixed(2)},50 ${firstPoint.x.toFixed(2)},50`;
});

const TIME_FIELD = "hour";

const getTimestamp = (item: any) =>
  item[TIME_FIELD] ||
  item._id?.time ||
  item._id?.timestamp ||
  item.timestamp;

const toTimestamp = (value: unknown) => {
  const time = new Date(value as string | number).getTime();
  return Number.isNaN(time) ? 0 : time;
};

async function fetchSensorTrend() {
  const sensorType = props.sensorType;
  if (!sensorType) {
    fetchedTrend.value = [];
    return;
  }

  try {
    const params = new URLSearchParams({
      time_field: TIME_FIELD,
      sensor_type: sensorType,
    });

    const response = await fetch(
      `http://localhost:8017/v1/sensors/query?${params.toString()}`
    );

    if (!response.ok) throw new Error("Failed to reach sensor endpoint");

    const data = await response.json();

    const sorted = (data ?? []).slice().sort((a: any, b: any) => {
      return (
        toTimestamp(getTimestamp(a)) - toTimestamp(getTimestamp(b))
      );
    });

    fetchedTrend.value = sorted
      .map((item: any) => Number(item.value ?? item._id?.value ?? 0))
      .filter((value) => !Number.isNaN(value));
  } catch (error) {
    console.error(error);
    fetchedTrend.value = [];
  }
}

watch(
  () => props.sensorType,
  () => {
    fetchSensorTrend();
  },
  { immediate: true }
);
</script>

<template>
  <div class="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
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

    <div class="mt-3 flex items-baseline gap-2">
      <span class="text-2xl font-bold text-gray-900">
        {{ displayValue }}
      </span>
      <span class="text-sm text-gray-500">{{ unit }}</span>
      <span
        v-if="change !== null"
        :class="[
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
          change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
        ]"
      >
        <BootstrapIcon
          :name="change >= 0 ? 'arrow-up-right' : 'arrow-down-right'"
          class="h-3 w-3"
        />
        {{ Math.abs(change).toFixed(1) }}%
      </span>
    </div>

    <div v-if="progress !== null" class="mt-3 space-y-1">
      <div class="flex justify-between text-[10px] text-gray-500">
        <span>Current level</span>
        <span>{{ progress.toFixed(0) }}%</span>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          class="h-full rounded-full bg-blue-600"
          :style="{ width: progressWidth }"
        />
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
import { computed } from "vue";

type Status = "good" | "warning" | "critical" | "info";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    value: number | string;
    unit?: string;
    icon: string;
    change?: number | null;
    status?: Status;
    statusText?: string;
    description?: string;
    min?: number;
    max?: number;
    trend?: number[];
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

const progressWidth = computed(() =>
  progress.value !== null ? `${progress.value.toFixed(0)}%` : "0%"
);

const displayValue = computed(() =>
  typeof props.value === "number"
    ? Number(props.value.toFixed(1)).toString()
    : props.value
);

interface ChartPoint {
  x: number;
  y: number;
}

const chartCoordinates = computed<ChartPoint[]>(() => {
  if (!props.trend || props.trend.length < 2) return [];

  const max = Math.max(...props.trend);
  const min = Math.min(...props.trend);
  const range = max === min ? 1 : max - min;
  const paddedMin = min - range * 0.1;
  const paddedRange = range === 0 ? 1 : range * 1.2;
  const xOffset = 8;
  const usableWidth = 92;
  const yScale = 40;

  return props.trend.map((value, index) => {
    const x = (index / (props.trend.length - 1)) * usableWidth + xOffset;
    const normalizedY = 50 - ((value - paddedMin) / paddedRange) * yScale;
    const y = Math.min(50, Math.max(0, normalizedY));
    return { x, y };
  });
});

const chartPoints = computed(() =>
  chartCoordinates.value.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")
);

// const chartAreaPoints = computed(() => {
//   if (!chartCoordinates.value.length) return "";
//   const firstX = chartCoordinates.value[0].x.toFixed(2);
//   const lastX = chartCoordinates.value[chartCoordinates.value.length - 1].x.toFixed(2);
//   return `${chartPoints.value} ${lastX},50 ${firstX},50`;
// });
</script>

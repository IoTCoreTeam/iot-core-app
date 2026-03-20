<template>
  <article class="min-h-[360px] bg-white border border-slate-200 rounded p-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-semibold text-slate-900">Logs Monitoring</p>
      </div>
    </div>

    <div class="mt-4 h-[270px]">
      <ClientOnly>
        <ApexChart
          type="bar"
          height="100%"
          width="100%"
          :options="logsChartOptions"
          :series="normalizedLogsSeries"
        />
      </ClientOnly>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ApexOptions } from "apexcharts";
import { computed, defineAsyncComponent, toRefs } from "vue";

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

const CHART_COLORS = {
  primaryStrong: "#1d4ed8",
  cyan: "#06b6d4",
  teal: "#14b8a6",
} as const;

const LOG_SERIES_ORDER = ["Error", "Warning", "Info"] as const;

const LOG_SERIES_COLORS = [
  CHART_COLORS.primaryStrong,
  CHART_COLORS.cyan,
  CHART_COLORS.teal,
] as const;

const props = defineProps<{
  categories: string[];
  series: { name: string; data: number[] }[];
}>();

const { categories, series } = toRefs(props);

const normalizedLogsSeries = computed(() => {
  const byName = new Map(
    series.value.map((item) => [String(item.name).toLowerCase(), item]),
  );

  return LOG_SERIES_ORDER.map((seriesName) => {
    const normalized = byName.get(seriesName.toLowerCase());
    return normalized ?? { name: seriesName, data: [] };
  });
});

const logsChartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: "bar" as const,
    stacked: true,
    toolbar: { show: false },
    fontFamily: "inherit",
    foreColor: "#64748b",
  },
  colors: [...LOG_SERIES_COLORS],
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: "52%",
      borderRadius: 4,
      borderRadiusApplication: "end" as const,
    },
  },
  xaxis: {
    categories: categories.value,
    labels: {
      style: {
        colors: "#94a3b8",
        fontSize: "11px",
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: "#64748b",
        fontSize: "11px",
      },
    },
  },
  grid: {
    borderColor: "#e2e8f0",
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: false,
      },
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ["#ffffff"],
      fontSize: "10px",
      fontWeight: 700,
    },
    formatter: (val: number) => (val ? String(val) : ""),
    dropShadow: {
      enabled: false,
    },
  },
  legend: {
    position: "top" as const,
    horizontalAlign: "right" as const,
    fontSize: "12px",
    markers: {
      size: 8,
    },
    labels: {
      colors: "#475569",
    },
  },
  stroke: {
    show: true,
    width: 1,
    colors: ["#ffffff"],
  },
  fill: {
    opacity: 1,
  },
  states: {
    hover: {
      filter: {
        type: "darken" as const,
        value: 0.92,
      },
    },
    active: {
      filter: {
        type: "none" as const,
      },
    },
  },
  tooltip: {
    theme: "light" as const,
  },
}));
</script>

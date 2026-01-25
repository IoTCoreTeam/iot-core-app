<template>
  <article
    class="bg-white border border-slate-200 rounded h-full flex flex-col"
  >
    <header
      class="flex items-center justify-between p-4 border-b border-slate-100"
    >
      <div>
        <p class="text-sm font-semibold text-slate-900">
          Log Level Distribution
        </p>
      </div>
      <NuxtLink
        to="/system-logs"
        class="text-xs font-semibold text-blue-600 hover:text-blue-800"
      >
        View All
      </NuxtLink>
    </header>
    <div class="flex-1 p-4 min-h-[300px]">
      <ClientOnly>
        <ApexChart
          height="100%"
          width="100%"
          type="bar"
          :options="chartOptions"
          :series="series"
        />
      </ClientOnly>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

const props = defineProps<{
  series: { name: string; data: number[] }[];
  categories: string[];
}>();

const chartOptions = computed(() => ({
  chart: {
    type: "bar" as const,
    stacked: true,
    toolbar: {
      show: false,
    },
    fontFamily: "inherit",
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "20%",
      borderRadius: 2,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: ["transparent"],
  },
  xaxis: {
    categories: props.categories,
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      style: {
        colors: "#64748b",
        fontSize: "11px",
      },
    },
  },
  yaxis: {
    show: true,
    labels: {
      style: {
        colors: "#64748b",
        fontSize: "11px",
      },
    },
  },
  grid: {
    borderColor: "#f1f5f9",
    strokeDashArray: 4,
    yaxis: {
      lines: {
        show: true,
      },
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 10,
    },
  },
  legend: {
    position: "bottom" as const,
    offsetY: 0,
    itemMargin: {
      horizontal: 10,
      vertical: 0,
    },
  },
  colors: ["#3b82f6", "#8b5cf6", "#10b981", "#ef4444"], // Blue, Violet, Emerald, Red
  tooltip: {
    y: {
      formatter: function (val: number) {
        return val.toString();
      },
    },
  },
}));
</script>

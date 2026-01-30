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
    <div class="flex-1 p-4 pt-0 min-h-[300px]">
      <div class="relative h-full">
        <ClientOnly v-if="!props.isLoading">
          <ApexChart
            height="100%"
            width="100%"
            type="bar"
            :options="chartOptions"
            :series="series"
          />
        </ClientOnly>
        <div
          v-if="props.isLoading"
          class="absolute inset-0 flex items-center justify-center"
        >
          <LoadingState message="Loading log distribution..." />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import LoadingState from "@/components/common/LoadingState.vue";

const ApexChart = defineAsyncComponent(() => import("vue3-apexcharts"));

const props = withDefaults(
  defineProps<{
    series: { name: string; data: number[] }[];
    categories: string[];
    isLoading?: boolean;
  }>(),
  {
    isLoading: false,
  },
);

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
      horizontal: true,
      barHeight: "60%",
      borderRadius: 3,
      dataLabels: {
        position: "center",
      },
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ["#ffffff"],
      fontSize: "11px",
      fontWeight: 600,
    },
    formatter: (val: number) => (val ? val.toString() : ""),
  },
  stroke: {
    show: true,
    width: 1,
    colors: ["#ffffff"],
  },
  xaxis: {
    categories: props.categories,
    labels: {
      style: {
        colors: "#64748b",
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
      lines: { show: false },
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
  legend: {
    position: "top" as const,
    offsetY: 4,
    offsetX: 0,
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

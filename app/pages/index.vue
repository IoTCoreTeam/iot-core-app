<template>
  <div class="w-full min-h-[80vh] bg-gray-50 p-4">
    <div class="mx-auto flex max-w-8xl flex-col gap-4">
      <section class="grid grid-cols-1 gap-4 items-start">
        <DevicesControlMetricDataWidgetBox />
      </section>

      <section
        class="grid grid-cols-1 gap-4 xl:grid-cols-5 items-start min-h-[40vh]"
      >
        <SingleMetricChart
          class="xl:col-span-4"
          :series="chartSeries"
          :selected-metric-key="selectedMetricKey"
          :selected-timeframe="selectedTimeframe"
          @update:selected-metric-key="handleMetricChange"
          @update:selected-timeframe="handleTimeframeChange"
        />
        <div class="xl:col-span-1 h-full">
          <!-- ActiveDevicesPanel now handles its own data fetching via SSE -->
          <DevicesControlActiveDevicesPanel />
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start min-h-[40vh]">
        <div class="lg:col-span-1 h-full">
          <DevicesControlAutomationBatches :automations="automationBatches" />
        </div>
        <div class="lg:col-span-1 h-full">
          <DevicesControlTypeDistributionPanel
            :series="typeDistributionSeries"
            :categories="typeDistributionCategories"
            :is-loading="isTypeDistributionLoading"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import { METRICS } from "~~/config/metric";
import DevicesControlMetricDataWidgetBox from "@/components/devices-control/MetricDataWidgetBox.vue";

const authStore = useAuthStore();
import type {
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
const isTypeDistributionLoading = ref(true);

const automationBatches = ref<AutomationBatchItem[]>([]);

const selectedMetricKey = ref<string>(METRICS[0]?.key || "");
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

  if (authStore.accessToken) {
    fetchTypeDistribution();
  }
});

async function fetchTypeDistribution() {
  if (!import.meta.client) return;

  isTypeDistributionLoading.value = true;

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
  finally {
    isTypeDistributionLoading.value = false;
  }
}
</script>

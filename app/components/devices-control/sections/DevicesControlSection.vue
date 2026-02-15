<template>
  <div class="flex flex-col gap-4 p-4">
    <SingleMetricChart
      class="w-full"
      :selected-metric-key="selectedMetricKey"
      :selected-timeframe="selectedTimeframe"
      @update:selected-metric-key="handleMetricChange"
    />
    <ControlWidgetBox />
    <DevicesControlContentSection :section="section" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ControlWidgetBox from "@/components/devices-control/ControlWidgetBox.vue";
import DevicesControlContentSection from "@/components/devices-control/layouts/DevicesControlContentSection.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import { METRICS } from "~~/config/metric";
import type { TimeframeKey } from "@/types/dashboard";
import type { Section } from "@/types/devices-control";

defineProps<{
  section: Section;
}>();

const selectedMetricKey = ref<string>(METRICS[0]?.key ?? "");
const selectedTimeframe = ref<TimeframeKey>("second");

function handleMetricChange(value: string) {
  selectedMetricKey.value = value;
}
</script>

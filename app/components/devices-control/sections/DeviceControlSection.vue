<template>
  <div class="flex flex-col gap-4 p-4 h-full">
    <SingleMetricChart
      class="w-full"
      :selected-metric-key="selectedMetricKey"
      :selected-timeframe="selectedTimeframe"
      @update:selected-metric-key="handleMetricChange"
    />
    <ControlWidgetBox
      :items="controlUrlItems"
      :is-loading="isLoadingControlUrls"
      :error="controlUrlLoadError"
      :on-execute="handleExecuteControlUrl"
    />
    <DevicesControlContentSection :section="section" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import ControlWidgetBox from "@/components/devices-control/ControlWidgetBox.vue";
import DevicesControlContentSection from "@/components/devices-control/layouts/DevicesControlContentSection.vue";
import SingleMetricChart from "@/components/SingleMetricChart.vue";
import { METRICS } from "~~/config/metric";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";
import { useControlUrlActions } from "@/composables/DeviceControl/useControlUrlActions";
import type { TimeframeKey } from "@/types/dashboard";
import type { Section } from "@/types/devices-control";

defineProps<{
  section: Section;
}>();

const selectedMetricKey = ref<string>(METRICS[0]?.key ?? "");
const selectedTimeframe = ref<TimeframeKey>("second");

type ControlUrlItem = {
  id: string;
  name?: string | null;
  url?: string | null;
  input_type?: string | null;
  node?: {
    id?: string | null;
    name?: string | null;
    external_id?: string | null;
    mac_address?: string | null;
    ip_address?: string | null;
    type?: string | null;
    gateway?: {
      id?: string | null;
      name?: string | null;
      external_id?: string | null;
      mac_address?: string | null;
      ip_address?: string | null;
    } | null;
  } | null;
};

const authStore = useAuthStore();
const { executeControlUrl } = useControlUrlActions();
const controlUrlItems = ref<ControlUrlItem[]>([]);
const isLoadingControlUrls = ref(false);
const controlUrlLoadError = ref<string | null>(null);

function handleMetricChange(value: string) {
  selectedMetricKey.value = value;
}

async function fetchControlUrls() {
  if (!apiConfig.controlModule) return;
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    controlUrlLoadError.value = "Missing authorization.";
    return;
  }

  isLoadingControlUrls.value = true;
  controlUrlLoadError.value = null;
  try {
    const endpoint = `${apiConfig.controlModule.replace(/\/$/, "")}/control-urls?include=gateway&per_page=100`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to load control urls.");
    }
    const rows = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    controlUrlItems.value = rows as ControlUrlItem[];
  } catch (error: any) {
    controlUrlLoadError.value = error?.message ?? "Failed to load control urls.";
    controlUrlItems.value = [];
    message.error(controlUrlLoadError.value);
  } finally {
    isLoadingControlUrls.value = false;
  }
}

async function handleExecuteControlUrl(widget: {
  id: string;
  raw: ControlUrlItem;
}, nextState: boolean) {
  if (!apiConfig.controlModule) return;
  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    throw new Error("Missing authorization.");
  }

  const url = widget.raw.url ?? "";
  if (!url) {
    throw new Error("Missing control URL.");
  }

  const state = nextState ? "on" : "off";
  await executeControlUrl(authorization, widget.id, {
    url,
    state,
  });

}

onMounted(() => {
  if (!import.meta.client) return;
  fetchControlUrls();
});
</script>

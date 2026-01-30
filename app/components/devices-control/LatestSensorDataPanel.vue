<template>
  <article class="bg-white border border-slate-200 rounded h-full flex flex-col">
    <header
      class="p-4 border-b border-slate-100 flex items-center justify-between"
    >
      <p class="text-sm font-semibold text-slate-900">Latest Sensor Data</p>
    </header>
    <div class="flex-1">
      <DataBoxCard
        :is-loading="isLoading"
        :has-data="latestSensors.length > 0"
        :columns="6"
        :elevated="false"
        :padded="false"
        class="h-full border-0 rounded-none shadow-none"
      >
        <template #head>
          <tr
            class="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 uppercase"
          >
            <th class="px-3 py-2 text-left font-semibold">Metric</th>
            <th class="px-3 py-2 text-left font-semibold">Sensor</th>
            <th class="px-3 py-2 text-left font-semibold">Node</th>
            <th class="px-3 py-2 text-left font-semibold">Gateway</th>
            <th class="px-3 py-2 text-right font-semibold">Value</th>
            <th class="px-3 py-2 text-right font-semibold">Last Seen</th>
          </tr>
        </template>

        <template #default>
          <tr
            v-for="sensor in latestSensors"
            :key="sensor.id"
            class="hover:bg-slate-50 text-xs"
          >
            <td class="px-3 py-3">
              <div class="font-semibold text-slate-800">
                {{ sensor.metric }}
              </div>
            </td>
            <td class="px-3 py-3">
              <div class="text-xs font-semibold text-slate-800">
                {{ sensor.sensorId }}
              </div>
            </td>
            <td class="px-3 py-3">
              <div class="text-xs text-slate-800">
                {{ sensor.nodeId }}
              </div>
            </td>
            <td class="px-3 py-3">
              <div class="text-xs text-slate-800">
                {{ sensor.gatewayId }}
              </div>
            </td>
            <td class="px-3 py-3 text-right">
              <span class="text-[16px] font-mono font-bold text-blue-800">
                {{ sensor.value }}
              </span>
              <span class="ml-1 text-[10px] font-medium text-slate-400">
                {{ sensor.unit }}
              </span>
            </td>
            <td
              class="px-3 py-3 text-right text-[10px] font-medium text-slate-400"
            >
              {{ sensor.timestamp }}
            </td>
          </tr>
        </template>

        <template #empty>
          <span class="text-slate-400 italic text-xs"
            >No sensor data available</span
          >
        </template>
      </DataBoxCard>
    </div>
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import { apiConfig } from "~~/config/api";

interface SensorDataItem {
  id: string;
  metric: string;
  value: string | number;
  unit: string;
  sensorId: string;
  nodeId: string;
  gatewayId: string;
  timestamp: string;
}

const latestSensors = ref<SensorDataItem[]>([]);
const isLoading = ref(false);

const METRICS: { key: string; label: string }[] = [
  { key: "temperature", label: "Temperature" },
  { key: "humidity", label: "Humidity" },
  { key: "soil", label: "Soil Moisture" },
  { key: "rain", label: "Rain" },
  { key: "light", label: "Light Intensity" },
];

const BASE_URL = (apiConfig.server || "").replace(/\/$/, "");

const toNumber = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === "object") {
    return toNumber(v.$numberDecimal ?? v.$numberDouble ?? v.$numberLong ?? v.value);
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatTimestamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const fetchLatestByMetric = async (metricKey: string) => {
  const params = new URLSearchParams();
  params.set("sensor_type", metricKey);
  params.set("limit", "1");
  params.set("page", "1");

  const res = await fetch(`${BASE_URL}/v1/sensors/query?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0];
};

const loadLatestSensors = async () => {
  if (!BASE_URL) return;
  isLoading.value = true;
  try {
    const results = await Promise.all(
      METRICS.map(async (metric) => {
        const row = await fetchLatestByMetric(metric.key);
        if (!row) return null;

        const value = toNumber(row.value ?? row._id?.value);
        const unit = row.unit ?? row._id?.unit ?? "";
        const time = row.timestamp ?? row._id?.timestamp ?? "";
        const sensorId = row.sensor_id ?? row._id?.sensor_id ?? "-";
        const nodeId = row.node_id ?? row._id?.node_id ?? "-";
        const gatewayId = row.gateway_id ?? row._id?.gateway_id ?? "-";

        return {
          id: `${metric.key}-${row._id ?? row.sensor_id ?? row.node_id ?? "latest"}`,
          metric: metric.label,
          value: value ?? row.value ?? "-",
          unit,
          sensorId,
          nodeId,
          gatewayId,
          timestamp: formatTimestamp(time),
        } as SensorDataItem;
      })
    );

    latestSensors.value = results.filter(
      (item): item is SensorDataItem => Boolean(item)
    );
  } catch (error) {
    console.error("Failed to load latest sensor data:", error);
    latestSensors.value = [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadLatestSensors();
});
</script>

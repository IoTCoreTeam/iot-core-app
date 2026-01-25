<template>
  <article class="bg-white border border-slate-200 rounded h-full">
    <header
      class="p-4 border-b border-slate-100 flex items-center justify-between"
    >
      <p class="text-sm font-semibold text-slate-900">Latest Sensor Data</p>
    </header>
    <div
      class="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar"
    >
      <div
        v-for="sensor in latestSensors"
        :key="sensor.id"
        class="px-4 py-2 hover:bg-slate-50 transition-colors"
      >
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs font-bold text-slate-800">
            {{ sensor.name }}
          </p>
          <div class="flex items-center gap-1">
            <span class="text-lg font-mono font-bold text-blue-800">{{
              sensor.value
            }}</span>
            <span class="text-xs font-medium text-slate-400">{{
              sensor.unit
            }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500">{{ sensor.deviceId }}</p>
          <p class="text-[10px] font-medium text-slate-400">
            {{ sensor.timestamp }}
          </p>
        </div>
      </div>
      <div
        v-if="!latestSensors || latestSensors.length === 0"
        class="p-12 text-center"
      >
        <p class="text-slate-400 italic text-sm">No sensor data available</p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface SensorDataItem {
  id: number;
  name: string;
  value: string | number;
  unit: string;
  deviceId: string;
  timestamp: string;
}

const latestSensors = ref<SensorDataItem[]>([
  {
    id: 1,
    name: "DHT22 - Temp",
    value: 28.4,
    unit: "°C",
    deviceId: "GH-NODE-01",
    timestamp: "2 mins ago",
  },
  {
    id: 2,
    name: "DHT22 - Humidity",
    value: 63,
    unit: "%",
    deviceId: "GH-NODE-01",
    timestamp: "2 mins ago",
  },
  {
    id: 3,
    name: "Soil Moisture",
    value: 48,
    unit: "%",
    deviceId: "GH-NODE-04",
    timestamp: "5 mins ago",
  },
  {
    id: 4,
    name: "Rain",
    value: 0.6,
    unit: "mm",
    deviceId: "GH-NODE-02",
    timestamp: "1 min ago",
  },
  {
    id: 5,
    name: "Light Intensity",
    value: 820,
    unit: "lux",
    deviceId: "GH-NODE-02",
    timestamp: "1 min ago",
  },
]);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>

<template>
  <div class="w-full bg-white border border-gray-200 rounded flex flex-col">
    <!-- Header -->
    <div
      v-if="showPanelHeader"
      class="p-4 border-b border-slate-100 flex items-center justify-between"
    >
      <p class="text-sm font-semibold text-slate-900">Map Side Panel</p>
    </div>
    <div class="px-3 border-b border-gray-100">
      <a-tabs v-model:activeKey="sidePanelTab">
        <a-tab-pane key="areas" tab="Managed Areas" />
        <a-tab-pane key="devices" tab="Active Devices" />
      </a-tabs>
    </div>

    <div class="flex-1">
      <div v-show="sidePanelTab === 'areas'">
        <DataBoxCard
          class="w-full border-0 shadow-none"
          :is-loading="isAreasLoading"
          :columns="2"
          :has-data="pagedAreas.length > 0"
          :elevated="false"
          :padded="false"
          :pagination="{
            page: areasPage,
            perPage: areasPerPage,
            lastPage: areasLastPage,
            total: areasTotal,
          }"
          @prev-page="areasPage = Math.max(1, areasPage - 1)"
          @next-page="areasPage = Math.min(areasLastPage, areasPage + 1)"
          @change-per-page="(value) => { areasPerPage = value; areasPage = 1; }"
        >
          <template #head>
            <tr class="bg-slate-50 border-b border-gray-200 text-xs text-gray-600">
              <th class="px-2 py-2 font-normal text-start">Name</th>
              <th class="px-2 py-2 font-normal text-center">Actions</th>
            </tr>
          </template>

          <template #default>
            <tr
              v-for="area in pagedAreas"
              :key="area.id"
              class="hover:bg-gray-50 transition-colors text-xs border-b border-gray-100"
            >
              <td class="px-2 py-2 text-gray-700 text-start">
                {{ area.name || `Area ${area.id}` }}
              </td>
              <td class="px-2 py-2 text-center">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                    @click="focusArea(area)"
                    title="Focus"
                    aria-label="Focus area"
                  >
                    <BootstrapIcon name="geo-alt" class="w-3 h-3" />
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <template #empty> No managed areas yet. </template>

          <template #footer>
            <span>Showing {{ areasTotal }} entries.</span>
          </template>
        </DataBoxCard>
      </div>

      <div v-show="sidePanelTab === 'devices'">
        <div
          v-if="showActiveHeader"
          class="p-4 border-b border-slate-100 flex items-center justify-between"
        >
          <p class="text-sm font-semibold text-slate-900">Active Devices</p>
          <NuxtLink
            to="/devices-control/device-control-center"
            class="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All
          </NuxtLink>
        </div>

        <DataBoxCard
          class="w-full border-0 shadow-none"
          :is-loading="isActiveDevicesLoading"
          :columns="3"
          :has-data="pagedActiveNodes.length > 0"
          :elevated="false"
          :padded="false"
          :pagination="{
            page: devicesPage,
            perPage: devicesPerPage,
            lastPage: devicesLastPage,
            total: devicesTotal,
          }"
          @prev-page="devicesPage = Math.max(1, devicesPage - 1)"
          @next-page="devicesPage = Math.min(devicesLastPage, devicesPage + 1)"
          @change-per-page="(value) => { devicesPerPage = value; devicesPage = 1; }"
        >
          <template #head>
            <tr class="bg-slate-50 border-b border-gray-200 text-xs text-gray-600">
              <th class="px-2 py-2 font-normal text-start">Node ID</th>
              <th class="px-2 py-2 font-normal text-start">Gateway ID</th>
              <th class="px-2 py-2 font-normal text-center">Actions</th>
            </tr>
          </template>

          <template #default>
            <tr
              v-for="row in pagedActiveNodes"
              :key="row.key"
              class="hover:bg-gray-50 transition-colors text-xs border-b border-gray-100"
            >
              <td class="px-2 py-2 text-gray-700">
                {{ row.id }}
              </td>
              <td class="px-2 py-2 text-gray-700">
                {{ row.row.gatewayId ?? "-" }}
              </td>
              <td class="px-2 py-2 text-center">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="w-8 h-8 inline-flex items-center justify-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                    title="Zoom to node"
                    :disabled="!hasNodeLocation(row.row)"
                    @click="zoomToNode(row.row)"
                  >
                    <BootstrapIcon name="geo-alt" class="w-3 h-3" />
                    <span class="sr-only">Zoom to node</span>
                  </button>
                  <button
                    type="button"
                    class="w-8 h-8 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                    title="View details"
                    @click="openActiveDeviceDetail(row)"
                  >
                    <BootstrapIcon name="info-circle" class="w-3 h-3" />
                    <span class="sr-only">Details</span>
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <template #empty> No active devices yet. </template>

          <template #footer>
            <span>Showing {{ devicesTotal }} entries.</span>
          </template>
        </DataBoxCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import type { DeviceRow } from "@/types/devices-control";

type ActiveDeviceRow = {
  key: string;
  kind: "gateway" | "node";
  row: DeviceRow;
  id: string;
};

const props = withDefaults(
  defineProps<{
    isAreasLoading: boolean;
    managedAreas: any[];
    refreshAreas: () => void;
    focusArea: (area: any) => void;
    isActiveDevicesLoading: boolean;
    activeDeviceRows: ActiveDeviceRow[];
    showActiveHeader?: boolean;
    showPanelHeader?: boolean;
    hasNodeLocation: (row: DeviceRow) => boolean;
    zoomToNode: (row: DeviceRow) => void;
    openActiveDeviceDetail: (payload: { kind: "gateway" | "node"; row: DeviceRow }) => void;
  }>(),
  {
    showActiveHeader: true,
    showPanelHeader: true,
  },
);

const sidePanelTab = ref<"areas" | "devices">("areas");

const activeNodeRows = computed(() =>
  props.activeDeviceRows.filter((row) => row.kind === "node"),
);

const areasPage = ref(1);
const areasPerPage = ref(5);
const devicesPage = ref(1);
const devicesPerPage = ref(5);

const areasTotal = computed(() => props.managedAreas.length);
const devicesTotal = computed(() => activeNodeRows.value.length);

const areasLastPage = computed(() =>
  Math.max(1, Math.ceil(areasTotal.value / Math.max(1, areasPerPage.value))),
);
const devicesLastPage = computed(() =>
  Math.max(1, Math.ceil(devicesTotal.value / Math.max(1, devicesPerPage.value))),
);

const pagedAreas = computed(() => {
  const start = (areasPage.value - 1) * areasPerPage.value;
  return props.managedAreas.slice(start, start + areasPerPage.value);
});

const pagedActiveNodes = computed(() => {
  const start = (devicesPage.value - 1) * devicesPerPage.value;
  return activeNodeRows.value.slice(start, start + devicesPerPage.value);
});

watch([areasTotal, areasLastPage], () => {
  if (areasPage.value > areasLastPage.value) {
    areasPage.value = areasLastPage.value;
  }
});

watch([devicesTotal, devicesLastPage], () => {
  if (devicesPage.value > devicesLastPage.value) {
    devicesPage.value = devicesLastPage.value;
  }
});
</script>

<template>
  <section class="min-h-screen">
    <div class="mx-auto w-full pt-4">
      <div class="flex flex-col lg:flex-row lg:items-start gap-4">
        <div class="w-full lg:w-3/4 overflow-hidden border border-gray-200">
          <ClientOnly>
            <div class="relative h-[90vh] max-h-[90vh] w-full">
              <div
                v-if="isLoadingMap"
                class="absolute inset-0 z-0 animate-pulse bg-gray-100"
              ></div>
              <div ref="mapEl" class="h-[90vh] max-h-[90vh] w-full z-0"></div>
            </div>
          </ClientOnly>
        </div>

        <div class="w-full lg:w-1/4 shrink-0 lg:self-start">
          <DataBoxCard
            :is-loading="false"
            :has-data="true"
            :columns="1"
            :padded="false"
            class="mb-3"
          >
            <template #default>
              <tr>
                <td class="px-2 py-2">
                  <div class="flex flex-wrap items-center justify-start gap-2">
                    <input
                      v-model="latInput"
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      placeholder="Latitude"
                      class="h-8 w-28 rounded border border-gray-300 bg-white px-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    />
                    <input
                      v-model="lngInput"
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      placeholder="Longitude"
                      class="h-8 w-28 rounded border border-gray-300 bg-white px-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    />
                    <button
                      type="button"
                      class="inline-flex items-center rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                      @click="zoomToInput"
                    >
                      Zoom to Input
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                      @click="resetMapView"
                    >
                      Reset
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </DataBoxCard>

          <DataBoxCard
            :is-loading="false"
            :has-data="true"
            :columns="1"
            :padded="false"
            class="mb-3"
          >
            <template #default>
              <tr>
                <td class="px-2 py-2">
                  <div class="flex flex-col gap-2">
                    <select
                      v-model="selectedNodeA"
                      class="h-8 w-full rounded border border-gray-300 bg-white px-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      :disabled="activeNodeOptions.length === 0"
                    >
                      <option disabled value="">
                        Select node A
                      </option>
                      <option
                        v-for="option in activeNodeOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <select
                      v-model="selectedNodeB"
                      class="h-8 w-full rounded border border-gray-300 bg-white px-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      :disabled="activeNodeOptions.length === 0"
                    >
                      <option disabled value="">
                        Select node B
                      </option>
                      <option
                        v-for="option in activeNodeOptions"
                        :key="`${option.value}-b`"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                        :disabled="!selectedNodeA && !selectedNodeB"
                        @click="resetSelectedNodes"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                        :disabled="!selectedNodeA || !selectedNodeB"
                        @click="findNearestPath"
                      >
                        Find Nearest Path
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </DataBoxCard>

          <MapSidePanel
            :is-areas-loading="isAreasLoading"
            :managed-areas="managedAreas"
            :refresh-areas="refreshAreas"
            :focus-area="focusArea"
            :is-active-devices-loading="isActiveDevicesLoading"
            :active-device-rows="activeDeviceRows"
            :show-active-header="false"
            :show-panel-header="false"
            :has-node-location="hasNodeLocation"
            :zoom-to-node="zoomToNode"
            :open-active-device-detail="openActiveDeviceDetail"
          />
        </div>
      </div>
    </div>
  </section>
  <GatewayDetailModal
    v-if="isGatewayDetailOpen"
    :gateway="selectedGateway"
    :nodes="connectedGatewayNodes"
    @close="closeGatewayDetail"
  />
  <BaseNodeDetailModal
    v-if="isNodeDetailOpen"
    :model-value="isNodeDetailOpen"
    :node="selectedNodeDetail"
    @update:modelValue="isNodeDetailOpen = $event"
    @close="closeNodeDetail"
  />
</template>

<script setup lang="ts">
import type { DeviceRow, Section } from "@/types/devices-control";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { computed, onMounted, onBeforeUnmount, ref, nextTick, watch, shallowRef } from "vue";
import { message } from "ant-design-vue";
import DataBoxCard from "@/components/common/DataBoxCard.vue";
import MapSidePanel from "@/components/devices-control/sections/MapSidePanel.vue";
import GatewayDetailModal from "@/components/Modals/Devices/GatewayDetailModal.vue";
import BaseNodeDetailModal from "@/components/Modals/Devices/BaseNodeDetailModal.vue";
import { useMapTool, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/composables/Map/MapTool";
import { useMapSectionActiveDevices } from "@/composables/MapSection/useMapSectionActiveDevices";
import { useMapSectionManagedAreas } from "@/composables/MapSection/useMapSectionManagedAreas";
import { useMapSectionUi } from "@/composables/MapSection/useMapSectionUi";
import type { FeatureGroup, Map as LeafletMap, Marker, Polyline } from "leaflet";

defineProps<{ section: Section }>();

const mapEl = ref<HTMLDivElement | null>(null);
const isLoadingMap = ref(true);
const mapRef = shallowRef<LeafletMap | null>(null);
const drawnItemsRef = shallowRef<FeatureGroup | null>(null);
const leafletRef = shallowRef<typeof import("leaflet") | null>(null);
const nodeMarkerLayerRef = shallowRef<FeatureGroup | null>(null);
const nodeMarkers = new Map<string, Marker>();
const connectionLineLayerRef = shallowRef<FeatureGroup | null>(null);
const connectionLines = new Map<string, Polyline>();
const { nodeRows, activeDeviceRows, isActiveDevicesLoading } = useMapSectionActiveDevices();

const {
  isGatewayDetailOpen,
  selectedGateway,
  isNodeDetailOpen,
  selectedNodeDetail,
  connectedGatewayNodes,
  openActiveDeviceDetail,
  closeGatewayDetail,
  closeNodeDetail,
} = useMapSectionUi({ nodeRows });

const {
  isAreasLoading,
  managedAreas,
  loadManagedAreas,
  refreshAreas,
  focusArea,
  registerDrawHandlers,
} = useMapSectionManagedAreas({
  mapRef,
  drawnItemsRef,
  leafletRef,
});

const {
  latInput,
  lngInput,
  zoomToInput,
  resetMapView,
} = useMapTool({
  mapRef,
  leafletRef,
});

const selectedNodeA = ref("");
const selectedNodeB = ref("");

const activeNodeOptions = computed(() =>
  activeDeviceRows.value
    .filter((row) => row.kind === "node")
    .map((row) => ({
      value: row.id,
      label: row.row.name
        ? `${row.row.name} (${row.row.gatewayId ?? "-"})`
        : `${row.id} (${row.row.gatewayId ?? "-"})`,
    })),
);

function findNearestPath() {
  if (!selectedNodeA.value || !selectedNodeB.value) {
    message.warning("Please select two nodes.");
    return;
  }
  if (selectedNodeA.value === selectedNodeB.value) {
    message.warning("Please select two different nodes.");
    return;
  }
  message.info("Routing logic will be added later.");
}

function resetSelectedNodes() {
  selectedNodeA.value = "";
  selectedNodeB.value = "";
}

const ensureLeafletDraw = async (L: typeof import("leaflet")) => {
  if ((L as any).Draw?.Event) return;
  if (typeof window !== "undefined") {
    (window as any).L = L;
  }
  await import("leaflet-draw");
};

function resolveNodeLatLng(row: DeviceRow): { lat: number; lng: number } | null {
  const lat = typeof row.lat === "number" ? row.lat : null;
  const lng = typeof row.lng === "number" ? row.lng : null;
  if (lat === null || lng === null) {
    return null;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat, lng };
}

function ensureNodeMarkerLayer(L: typeof import("leaflet")) {
  if (!nodeMarkerLayerRef.value && mapRef.value) {
    nodeMarkerLayerRef.value = new L.FeatureGroup();
    mapRef.value.addLayer(nodeMarkerLayerRef.value);
  }
  return nodeMarkerLayerRef.value;
}

function ensureConnectionLineLayer(L: typeof import("leaflet")) {
  if (!connectionLineLayerRef.value && mapRef.value) {
    connectionLineLayerRef.value = new L.FeatureGroup();
    mapRef.value.addLayer(connectionLineLayerRef.value);
  }
  return connectionLineLayerRef.value;
}

function buildConnectionKey(a: string, b: string) {
  return a < b ? `${a}--${b}` : `${b}--${a}`;
}

function hasNodeLocation(row: DeviceRow) {
  return Boolean(resolveNodeLatLng(row));
}

function zoomToNode(row: DeviceRow) {
  const coords = resolveNodeLatLng(row);
  if (!coords || !mapRef.value) {
    message.warning("Node location is unavailable.");
    return;
  }
  mapRef.value.setView([coords.lat, coords.lng], 18, { animate: true });
}

function buildNodeMarkerPopup(row: DeviceRow) {
  const label = row.name ?? row.id ?? "Node";
  const status = row.status ?? "unknown";
  const lat = typeof row.lat === "number" ? row.lat.toFixed(6) : "N/A";
  const lng = typeof row.lng === "number" ? row.lng.toFixed(6) : "N/A";
  return `<div class="text-xs"><strong>${label}</strong><br/>${row.id} • ${status}<br/>${lat}, ${lng}</div>`;
}

function syncNodeMarkers() {
  const mapInstance = mapRef.value;
  const L = leafletRef.value;
  if (!mapInstance || !L) return;

  const layer = ensureNodeMarkerLayer(L);
  if (!layer) return;

  const nextIds = new Set<string>();

  nodeRows.value.forEach((row) => {
    const coords = resolveNodeLatLng(row);
    if (!coords) return;
    nextIds.add(row.id);

    const existing = nodeMarkers.get(row.id);
    if (existing) {
      existing.setLatLng([coords.lat, coords.lng]);
      existing.setPopupContent(buildNodeMarkerPopup(row));
      return;
    }

    const marker = L.marker([coords.lat, coords.lng], {
      title: row.name ?? row.id,
    });
    marker.bindPopup(buildNodeMarkerPopup(row));
    marker.addTo(layer);
    nodeMarkers.set(row.id, marker);
  });

  nodeMarkers.forEach((marker, id) => {
    if (nextIds.has(id)) return;
    layer.removeLayer(marker);
    nodeMarkers.delete(id);
  });
}

function syncConnectionLines() {
  const mapInstance = mapRef.value;
  const L = leafletRef.value;
  if (!mapInstance || !L) return;

  const layer = ensureConnectionLineLayer(L);
  if (!layer) return;

  const nodeById = new Map<string, DeviceRow>();
  nodeRows.value.forEach((row) => {
    if (row?.id) {
      nodeById.set(row.id, row);
    }
  });

  const nextKeys = new Set<string>();

  nodeRows.value.forEach((row) => {
    const sourceCoords = resolveNodeLatLng(row);
    if (!sourceCoords) return;
    const connectedNodes = Array.isArray(row.connectedNodes) ? row.connectedNodes : [];
    connectedNodes.forEach((targetId) => {
      if (!targetId || targetId === row.id) return;
      const target = nodeById.get(targetId);
      if (!target) return;
      const targetCoords = resolveNodeLatLng(target);
      if (!targetCoords) return;
      const key = buildConnectionKey(row.id, targetId);
      if (nextKeys.has(key)) return;
      nextKeys.add(key);

      const existing = connectionLines.get(key);
      if (existing) {
        existing.setLatLngs([
          [sourceCoords.lat, sourceCoords.lng],
          [targetCoords.lat, targetCoords.lng],
        ]);
        return;
      }

      const line = L.polyline(
        [
          [sourceCoords.lat, sourceCoords.lng],
          [targetCoords.lat, targetCoords.lng],
        ],
        {
          color: "#3B82F6",
          weight: 2,
          opacity: 0.6,
          dashArray: "6 6",
        },
      );
      line.addTo(layer);
      connectionLines.set(key, line);
    });
  });

  connectionLines.forEach((line, key) => {
    if (nextKeys.has(key)) return;
    layer.removeLayer(line);
    connectionLines.delete(key);
  });
}

onMounted(async () => {
  if (!import.meta.client) return;
  await nextTick();
  if (!mapEl.value) return;
  const L = await import("leaflet");
  await ensureLeafletDraw(L);
  leafletRef.value = L;

  mapRef.value = L.map(mapEl.value, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(mapRef.value);

  mapRef.value?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  // Leaflet Draw
  drawnItemsRef.value = new L.FeatureGroup();
  mapRef.value.addLayer(drawnItemsRef.value);
  const drawControl = (L as any).Control?.Draw
    ? new (L as any).Control.Draw({
        edit: {
          featureGroup: drawnItemsRef.value,
        },
        draw: {
          polygon: {
            shapeOptions: { fill: false, fillOpacity: 0 },
          },
          rectangle: {
            shapeOptions: { fill: false, fillOpacity: 0 },
          },
          circle: false,
          circlemarker: false,
          polyline: false,
          marker: false,
        },
      })
    : null;
  if (drawControl) {
    mapRef.value.addControl(drawControl);
  }

  registerDrawHandlers(L);

  await loadManagedAreas();
  syncNodeMarkers();
  syncConnectionLines();
  setTimeout(() => {
    isLoadingMap.value = false;
  }, 1000);
});

watch(
  nodeRows,
  () => {
    syncNodeMarkers();
    syncConnectionLines();
  },
  { deep: true },
);

const reloadMap = async (options?: { silent?: boolean }) => {
  const mapInstance = mapRef.value;
  const mapElement = mapEl.value;
  const L = leafletRef.value;
  if (!mapInstance || !mapElement || !L) return;
  try {
    await ensureLeafletDraw(L);
    const currentCenter = mapInstance.getCenter();
    const currentZoom = mapInstance.getZoom();
    mapInstance.remove();

    mapRef.value = L.map(mapElement, {
      center: [currentCenter.lat, currentCenter.lng],
      zoom: currentZoom,
      zoomControl: true,
    });

    L
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      })
      .addTo(mapRef.value);

    drawnItemsRef.value = new L.FeatureGroup();
    mapRef.value.addLayer(drawnItemsRef.value);
    nodeMarkerLayerRef.value = null;
    nodeMarkers.clear();
    connectionLineLayerRef.value = null;
    connectionLines.clear();
    const drawControl = (L as any).Control?.Draw
      ? new (L as any).Control.Draw({
          edit: { featureGroup: drawnItemsRef.value },
        draw: {
          polygon: {
            shapeOptions: { fill: false, fillOpacity: 0 },
          },
          rectangle: {
            shapeOptions: { fill: false, fillOpacity: 0 },
          },
          circle: false,
          circlemarker: false,
          polyline: false,
          marker: false,
        },
        })
      : null;
    if (drawControl) {
      mapRef.value.addControl(drawControl);
    }
    registerDrawHandlers(L);
    await loadManagedAreas(true);
    syncNodeMarkers();
    syncConnectionLines();
    if (!options?.silent) {
      message.success("Map reloaded.");
    }
  } catch (error) {
    const msg = (error as Error)?.message ?? "Failed to reload.";
    message.error(msg);
  }
};


onBeforeUnmount(() => {
  if (mapRef.value) {
    mapRef.value.remove();
    mapRef.value = null;
  }
  drawnItemsRef.value = null;
  if (nodeMarkerLayerRef.value) {
    nodeMarkerLayerRef.value.clearLayers();
  }
  nodeMarkerLayerRef.value = null;
  nodeMarkers.clear();
  if (connectionLineLayerRef.value) {
    connectionLineLayerRef.value.clearLayers();
  }
  connectionLineLayerRef.value = null;
  connectionLines.clear();
  leafletRef.value = null;
});

</script>

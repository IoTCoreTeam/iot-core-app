import type { FeatureGroup, Map as LeafletMap } from "leaflet";
import type { Ref } from "vue";
import { watch } from "vue";
import { useAuthStore } from "~~/stores/auth";
import { useHandleMap } from "@/composables/Map/handleMap";

type MapHandleDeps = {
  mapRef: Ref<LeafletMap | null>;
  drawnItemsRef: Ref<FeatureGroup | null>;
  leafletRef: Ref<typeof import("leaflet") | null>;
};

export const useMapSectionManagedAreas = ({
  mapRef,
  drawnItemsRef,
  leafletRef,
}: MapHandleDeps) => {
  const authStore = useAuthStore();

  const {
    isAreasLoading,
    managedAreas,
    pendingStyle,
    applyLayerStyle,
    bindContextMenu,
    loadManagedAreas,
    refreshAreas,
    focusArea,
  } = useHandleMap({
    mapRef,
    drawnItemsRef,
    leafletRef,
  });

  const registerDrawHandlers = (L: typeof import("leaflet")) => {
    if (!mapRef.value || !drawnItemsRef.value) return;
    if (!(L as any).Draw?.Event) return;
    mapRef.value.on((L as any).Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      const drawnItems = drawnItemsRef.value;
      if (!drawnItems) return;
      applyLayerStyle(layer, pendingStyle);
      drawnItems.addLayer(layer);
      bindContextMenu(layer, false);
    });
  };

  watch(
    () => authStore.authorizationHeader,
    async (token) => {
      if (!token) return;
      if (!mapRef.value || !drawnItemsRef.value) return;
      await loadManagedAreas();
    },
  );

  return {
    isAreasLoading,
    managedAreas,
    pendingStyle,
    applyLayerStyle,
    bindContextMenu,
    loadManagedAreas,
    refreshAreas,
    focusArea,
    registerDrawHandlers,
  };
};

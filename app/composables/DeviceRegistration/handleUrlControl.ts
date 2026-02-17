import type { Ref } from "vue";
import { ref } from "vue";
import { message } from "ant-design-vue";
import { apiConfig } from "~~/config/api";
import type { DeviceRow, DeviceTabKey } from "@/types/devices-control";
import { useAuthStore } from "~~/stores/auth";
import { useControlUrlActions } from "@/composables/DeviceRegistration/useControlUrlActions";

type ControlUrlFormState = {
  name: string;
  url: string;
  inputType: string;
  status: "on" | "off";
};

export type ControlUrlItem = {
  id: string;
  name: string;
  url: string;
  input_type: string;
  status: "on" | "off";
};

type HandleUrlControlOptions = {
  activeDeviceTab: Ref<DeviceTabKey>;
  nodeIdMap: Ref<Record<string, string>>;
  loadNodeIdMap: () => Promise<void> | void;
  isGatewayRegisteredForRow: (row: DeviceRow) => boolean;
  getGatewayIdFromRow: (row: DeviceRow) => string | null;
};

export function useHandleUrlControl(options: HandleUrlControlOptions) {
  const {
    activeDeviceTab,
    nodeIdMap,
    loadNodeIdMap,
    isGatewayRegisteredForRow,
    getGatewayIdFromRow,
  } = options;

  const authStore = useAuthStore();
  const { createControlUrl, updateControlUrl, deleteControlUrl } =
    useControlUrlActions();

  const activeControlUrlNodeId = ref<string | null>(null);
  const activeControlNodeUuid = ref<string | null>(null);
  const isSavingControlUrl = ref(false);
  const isLoadingControlUrls = ref(false);
  const controlUrlLoadError = ref<string | null>(null);
  const controlUrlForm = ref<ControlUrlFormState>({
    name: "",
    url: "",
    inputType: "",
    status: "off",
  });
  const controlUrlItems = ref<ControlUrlItem[]>([]);

  function isControlNode(row: DeviceRow) {
    return (row.type ?? "").toLowerCase() === "control";
  }

  async function resolveControlNodeId(row: DeviceRow) {
    const externalNodeId = row.externalId ?? row.id;
    if (!nodeIdMap.value[externalNodeId]) {
      await loadNodeIdMap();
    }
    return nodeIdMap.value[externalNodeId] ?? null;
  }

  async function fetchControlUrls(nodeUuid: string) {
    if (!apiConfig.controlModule) return;
    const authorization = authStore.authorizationHeader;
    if (!authorization) return;

    isLoadingControlUrls.value = true;
    controlUrlLoadError.value = null;
    try {
      const endpoint = `${apiConfig.controlModule.replace(/\/$/, "")}/control-urls?node_id=${encodeURIComponent(nodeUuid)}&per_page=100`;
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
      controlUrlItems.value = rows.map((row: any) => ({
        id: row.id,
        name: row.name ?? "",
        url: row.url ?? "",
        input_type: row.input_type ?? "",
        status: row.status === "on" ? "on" : "off",
      }));
    } catch (error: any) {
      controlUrlLoadError.value =
        error?.message ?? "Failed to load control urls.";
      controlUrlItems.value = [];
    } finally {
      isLoadingControlUrls.value = false;
    }
  }

  async function toggleControlUrlInline(row: DeviceRow) {
    if (activeDeviceTab.value !== "nodes" || !isControlNode(row)) return;
    if (activeControlUrlNodeId.value === row.id) {
      activeControlUrlNodeId.value = null;
      activeControlNodeUuid.value = null;
      return;
    }
    const controlNodeId = await resolveControlNodeId(row);
    if (!controlNodeId) {
      message.warning(
        `Node ${row.externalId ?? row.id} not found in Control Module.`,
      );
      return;
    }
    activeControlUrlNodeId.value = row.id;
    activeControlNodeUuid.value = controlNodeId;
    controlUrlForm.value = {
      name: "",
      url: "",
      inputType: "",
      status: "off",
    };
    await fetchControlUrls(controlNodeId);
  }

  async function handleControlUrlClick(row: DeviceRow) {
    if (row.registered === false) {
      if (!isGatewayRegisteredForRow(row)) {
        const gatewayId = getGatewayIdFromRow(row);
        message.info(
          gatewayId
            ? `Please register gateway ${gatewayId} first.`
            : "Please register the node's gateway first.",
        );
        return;
      }
      message.info("Please register this node before adding control URLs.");
      return;
    }
    await toggleControlUrlInline(row);
  }

  function showControlUrlInline(row: DeviceRow) {
    return (
      activeDeviceTab.value === "nodes" &&
      isControlNode(row) &&
      activeControlUrlNodeId.value === row.id
    );
  }

  function closeControlUrlInline() {
    activeControlUrlNodeId.value = null;
    activeControlNodeUuid.value = null;
  }

  async function submitControlUrl(row: DeviceRow) {
    if (isSavingControlUrl.value) return;
    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      message.error("Missing authorization.");
      return;
    }
    if (
      !controlUrlForm.value.name ||
      !controlUrlForm.value.url ||
      !controlUrlForm.value.inputType
    ) {
      message.warning("Please fill in name, url, and input type.");
      return;
    }

    const controlNodeId =
      activeControlNodeUuid.value ?? (await resolveControlNodeId(row));
    if (!controlNodeId) {
      message.warning(
        `Node ${row.externalId ?? row.id} not found in Control Module.`,
      );
      return;
    }

    isSavingControlUrl.value = true;
    try {
      await createControlUrl(authorization, {
        node_id: controlNodeId,
        name: controlUrlForm.value.name,
        url: controlUrlForm.value.url,
        input_type: controlUrlForm.value.inputType,
        status: controlUrlForm.value.status,
      });
      message.success("Control URL created.");
      await fetchControlUrls(controlNodeId);
      closeControlUrlInline();
    } catch (error: any) {
      message.error(error?.message ?? "Failed to create control url.");
    } finally {
      isSavingControlUrl.value = false;
    }
  }

  async function handleUpdateControlUrl(item: ControlUrlItem) {
    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      message.error("Missing authorization.");
      return;
    }
    const nodeId = activeControlNodeUuid.value;
    if (!nodeId) {
      message.warning("Missing node id.");
      return;
    }

    try {
      await updateControlUrl(authorization, item.id, {
        node_id: nodeId,
        name: item.name,
        url: item.url,
        input_type: item.input_type,
        status: item.status,
      });
      message.success("Control URL updated.");
    } catch (error: any) {
      message.error(error?.message ?? "Failed to update control url.");
    }
  }

  async function handleDeleteControlUrl(item: ControlUrlItem) {
    const authorization = authStore.authorizationHeader;
    if (!authorization) {
      message.error("Missing authorization.");
      return;
    }
    try {
      await deleteControlUrl(authorization, item.id);
      controlUrlItems.value = controlUrlItems.value.filter(
        (row) => row.id !== item.id,
      );
      message.success("Control URL deleted.");
    } catch (error: any) {
      message.error(error?.message ?? "Failed to delete control url.");
    }
  }

  return {
    controlUrlForm,
    controlUrlItems,
    controlUrlLoadError,
    isControlNode,
    isLoadingControlUrls,
    isSavingControlUrl,
    handleControlUrlClick,
    showControlUrlInline,
    closeControlUrlInline,
    submitControlUrl,
    handleUpdateControlUrl,
    handleDeleteControlUrl,
  };
}

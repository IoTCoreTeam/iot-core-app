<template>
  <BaseNodeDetailModal
    :model-value="modelValue"
    title="Node Controller Details"
    extended-title="Controller Fields"
    :node="node"
    :loading="isLoading"
    @update:modelValue="handleModelUpdate"
    @close="handleClose"
  >
    <div>
      <label class="block text-[11px] font-medium text-gray-700 mb-1">
        Firmware Version
      </label>
      <input
        v-model="form.firmwareVersion"
        type="text"
        :readonly="readOnly"
        :disabled="readOnly"
        class="w-full py-2 px-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
        placeholder="Enter firmware version"
      />
    </div>

    <div>
      <label class="block text-[11px] font-medium text-gray-700 mb-1">
        Control URL
      </label>
      <input
        v-model="form.controlUrl"
        type="text"
        :readonly="readOnly"
        :disabled="readOnly"
        class="w-full py-2 px-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
        placeholder="Enter control endpoint"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="readOnly || isSaving || isLoading"
          @click="saveController"
        >
          {{ isSaving ? "Saving..." : "Save" }}
        </button>
      </div>
    </template>
  </BaseNodeDetailModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import BaseNodeDetailModal from "./BaseNodeDetailModal.vue";
import type { NodeInfo } from "@/types/devices-control";
import { apiConfig } from "~~/config/api";
import { useAuthStore } from "~~/stores/auth";

type NodeControllerDetail = {
  firmwareVersion?: string | null;
  firmware_version?: string | null;
  controlUrl?: string | null;
  control_url?: string | null;
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    node: NodeInfo | null;
    controller: NodeControllerDetail | null;
    gatewayId?: string | null;
    readOnly?: boolean;
  }>(),
  {
    readOnly: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "update:controller", value: NodeControllerDetail): void;
}>();

const form = ref({
  firmwareVersion: "",
  controlUrl: "",
});

const isSaving = ref(false);
const isLoading = ref(false);
const authStore = useAuthStore();
const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");

watch(
  () => props.controller,
  (value) => {
    form.value = {
      firmwareVersion:
        value?.firmwareVersion ?? value?.firmware_version ?? "",
      controlUrl: value?.controlUrl ?? value?.control_url ?? "",
    };
  },
  { immediate: true },
);

watch(
  form,
  (value) => {
    emit("update:controller", {
      firmwareVersion: value.firmwareVersion,
      controlUrl: value.controlUrl,
    });
  },
  { deep: true },
);

watch(
  () => [
    props.modelValue,
    props.node?.external_id ?? null,
    props.node?.id ?? null,
  ],
  ([isOpen]) => {
    if (isOpen) {
      void loadControllerDetails();
    }
  },
  { immediate: true },
);

function handleModelUpdate(value: boolean) {
  emit("update:modelValue", value);
}

function handleClose() {
  emit("close");
}

async function loadControllerDetails() {
  if (!CONTROL_MODULE_BASE) return;
  const authorization = authStore.authorizationHeader;
  if (!authorization) return;

  const externalId =
    (typeof props.node?.external_id === "string" && props.node.external_id) ||
    (typeof props.node?.id === "string" && props.node.id) ||
    null;
  if (!externalId) return;

  if (isLoading.value) return;
  isLoading.value = true;
  try {
    form.value = {
      firmwareVersion: "",
      controlUrl: "",
    };
    const endpoint = `${CONTROL_MODULE_BASE}/nodes?type=controller&external_id=${encodeURIComponent(externalId)}`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to load controller details.");
    }

    const rows = Array.isArray(payload?.data?.data)
      ? payload.data.data
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
    const nodeRecord = rows[0] ?? null;
    const controller =
      Array.isArray(nodeRecord?.controllers) && nodeRecord.controllers.length > 0
        ? nodeRecord.controllers[0]
        : null;

    if (controller) {
      form.value = {
        firmwareVersion:
          controller?.firmware_version ?? controller?.firmwareVersion ?? "",
        controlUrl: controller?.control_url ?? controller?.controlUrl ?? "",
      };
    }
  } catch (error) {
    console.error("Failed to load controller details", error);
  } finally {
    isLoading.value = false;
  }
}

async function saveController() {
  if (props.readOnly) return;
  if (!CONTROL_MODULE_BASE) {
    message.warning("Control module endpoint is not configured.");
    return;
  }

  const authorization = authStore.authorizationHeader;
  if (!authorization) {
    message.warning("Missing authentication token.");
    return;
  }

  const externalId =
    (typeof props.node?.external_id === "string" && props.node.external_id) ||
    (typeof props.node?.id === "string" && props.node.id) ||
    null;
  if (!externalId) {
    message.warning("Please register the node first.");
    return;
  }

  isSaving.value = true;
  try {
    const lookupEndpoint = `${CONTROL_MODULE_BASE}/nodes?external_id=${encodeURIComponent(externalId)}`;
    const lookupResponse = await fetch(lookupEndpoint, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    const lookupPayload = await lookupResponse.json().catch(() => null);
    if (!lookupResponse.ok) {
      throw new Error(
        lookupPayload?.message ?? "Failed to resolve node ID.",
      );
    }

    const rows = Array.isArray(lookupPayload?.data)
      ? lookupPayload.data
      : Array.isArray(lookupPayload?.data?.data)
        ? lookupPayload.data.data
        : Array.isArray(lookupPayload)
          ? lookupPayload
          : [];
    const nodeRecord =
      rows.find((row: any) => String(row?.external_id ?? "") === externalId) ??
      rows[0] ??
      null;
    const nodeUuid = nodeRecord?.id ?? null;

    if (!nodeUuid) {
      message.warning("Please register the node first.");
      return;
    }

    const payload = {
      node_id: nodeUuid,
      firmware_version: form.value.firmwareVersion || null,
      control_url: form.value.controlUrl || null,
    };

    const endpoint = `${CONTROL_MODULE_BASE}/nodes-controller/register`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        responsePayload?.message ?? "Failed to save controller details.",
      );
    }

    message.success(
      responsePayload?.message ?? "Controller details saved.",
    );
  } catch (error: any) {
    console.error("Failed to save controller details", error);
    message.error(error?.message ?? "Unable to save controller details.");
  } finally {
    isSaving.value = false;
  }
}
</script>

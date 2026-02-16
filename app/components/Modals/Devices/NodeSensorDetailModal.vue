<template>
  <BaseNodeDetailModal
    :model-value="modelValue"
    title="Node Sensor Details"
    extended-title="Sensor Fields"
    :node="node"
    :loading="isLoading"
    @update:modelValue="handleModelUpdate"
    @close="handleClose"
  >
    <div>
      <label class="block text-[11px] font-medium text-gray-700 mb-1">
        Sensor Type
      </label>
      <input
        v-model="form.sensorType"
        type="text"
        :readonly="readOnly"
        :disabled="readOnly"
        class="w-full py-2 px-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
        placeholder="Enter sensor type"
      />
    </div>

    <div>
      <label class="block text-[11px] font-medium text-gray-700 mb-1">
        Limit Value
      </label>
      <input
        v-model="form.limitValue"
        type="number"
        step="0.0001"
        :readonly="readOnly"
        :disabled="readOnly"
        class="w-full py-2 px-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
        placeholder="Enter limit value"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="readOnly || isSaving || isLoading"
          @click="saveSensor"
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

type NodeSensorDetail = {
  sensorType?: string | null;
  sensor_type?: string | null;
  limitValue?: string | number | null;
  limit_value?: string | number | null;
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    node: NodeInfo | null;
    sensor: NodeSensorDetail | null;
    readOnly?: boolean;
  }>(),
  {
    readOnly: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "update:sensor", value: NodeSensorDetail): void;
}>();

const form = ref<{
  sensorType: string;
  limitValue: string | number;
}>({
  sensorType: "",
  limitValue: "",
});

const isSaving = ref(false);
const isLoading = ref(false);
const authStore = useAuthStore();
const CONTROL_MODULE_BASE = (apiConfig.controlModule || "").replace(/\/$/, "");

watch(
  () => props.sensor,
  (value) => {
    form.value = {
      sensorType: value?.sensorType ?? value?.sensor_type ?? "",
      limitValue: value?.limitValue ?? value?.limit_value ?? "",
    };
  },
  { immediate: true },
);

watch(
  form,
  (value) => {
    emit("update:sensor", {
      sensorType: value.sensorType,
      limitValue: value.limitValue,
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
      void loadSensorDetails();
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

async function loadSensorDetails() {
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
      sensorType: "",
      limitValue: "",
    };
    const endpoint = `${CONTROL_MODULE_BASE}/nodes?type=sensor&external_id=${encodeURIComponent(externalId)}`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message ?? "Failed to load sensor details.");
    }

    const rows = Array.isArray(payload?.data?.data)
      ? payload.data.data
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
    const nodeRecord = rows[0] ?? null;
    const sensor =
      Array.isArray(nodeRecord?.sensors) && nodeRecord.sensors.length > 0
        ? nodeRecord.sensors[0]
        : null;

    if (sensor) {
      form.value = {
        sensorType: sensor?.sensor_type ?? sensor?.sensorType ?? "",
        limitValue: sensor?.limit_value ?? sensor?.limitValue ?? "",
      };
    }
  } catch (error) {
    console.error("Failed to load sensor details", error);
  } finally {
    isLoading.value = false;
  }
}

async function saveSensor() {
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

    const limitValue =
      form.value.limitValue === "" || form.value.limitValue === null
        ? null
        : Number(form.value.limitValue);
    const payload = {
      node_id: nodeUuid,
      sensor_type: form.value.sensorType || null,
      limit_value: Number.isNaN(limitValue) ? null : limitValue,
    };

    const endpoint = `${CONTROL_MODULE_BASE}/nodes-sensor/register`;
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
        responsePayload?.message ?? "Failed to save sensor details.",
      );
    }

    message.success(
      responsePayload?.message ?? "Sensor details saved.",
    );
  } catch (error: any) {
    console.error("Failed to save sensor details", error);
    message.error(error?.message ?? "Unable to save sensor details.");
  } finally {
    isSaving.value = false;
  }
}
</script>

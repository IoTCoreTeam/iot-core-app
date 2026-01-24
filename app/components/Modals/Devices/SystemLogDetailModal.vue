<template>
  <BaseModal
    :model-value="modelValue"
    title="System Log Details"
    max-width="max-w-3xl"
    panel-class="p-6"
    @request-close="closeModal"
    @after-leave="handleAfterLeave"
  >
    <div class="space-y-6 text-xs">
      <div v-if="isLoading" class="py-6 flex justify-center">
        <LoadingState message="Loading log details..." />
      </div>

      <div v-else-if="!log" class="py-6 text-center text-gray-500">
        No log entry selected.
      </div>

      <template v-else>
        <!-- Top Info Row -->
        <div
          class="flex items-center justify-between border-b border-gray-100 pb-4"
        >
          <div class="flex items-center gap-4">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded border font-bold uppercase tracking-wider"
              :class="levelBadgeClass"
            >
              {{ log.level || "info" }}
            </span>
            <span class="text-gray-400 font-mono"> #{{ log.id }} </span>
          </div>

          <div class="text-right">
            <p class="uppercase tracking-wide text-gray-400">Timestamp</p>
            <p class="font-medium text-gray-700">
              {{ formatTimestamp(log.createdAt) }}
            </p>
          </div>
        </div>

        <!-- Details Grid -->
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50/50 p-4 rounded border border-gray-100"
        >
          <div>
            <p class="uppercase tracking-wide text-gray-400 mb-1">
              Source / Action
            </p>
            <p class="font-semibold text-gray-900 truncate" :title="log.source">
              {{ log.source || "Unknown" }}
            </p>
          </div>

          <div>
            <p class="uppercase tracking-wide text-gray-400 mb-1">Actor</p>
            <p class="font-semibold text-gray-900 truncate" :title="log.actor">
              {{ log.actor || "System" }}
            </p>
          </div>

          <div>
            <p class="uppercase tracking-wide text-gray-400 mb-1">Device</p>
            <p
              class="font-semibold text-gray-900 truncate"
              :title="log.deviceId"
            >
              {{ log.deviceId || "N/A" }}
            </p>
          </div>

          <div>
            <p class="uppercase tracking-wide text-gray-400 mb-1">IP Address</p>
            <p class="font-semibold text-gray-900">
              {{ log.ipAddress || "N/A" }}
            </p>
          </div>
        </div>

        <!-- Message -->
        <div class="space-y-2">
          <p class="uppercase tracking-wide text-gray-400">Log Message</p>
          <div
            class="bg-white border border-gray-100 rounded p-4 text-gray-800 leading-relaxed whitespace-pre-wrap"
          >
            {{ log.message || "No message provided." }}
          </div>
        </div>

        <!-- Tags -->
        <div v-if="log.tags?.length" class="flex flex-wrap gap-1.5 pt-2">
          <span
            v-for="tag in log.tags"
            :key="tag"
            class="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium uppercase tracking-wide"
          >
            {{ tag }}
          </span>
        </div>

        <!-- Metadata -->
        <div class="pt-4 border-t border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold uppercase tracking-widest text-gray-500">
              Metadata
            </h4>
            <span
              class="text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded"
            >
              {{ metadataStateSummary }}
            </span>
          </div>

          <div
            class="overflow-hidden rounded border border-gray-100 bg-gray-50"
          >
            <template v-if="metadataState.kind === 'empty'">
              <div class="p-4 text-center text-gray-400 italic">
                No metadata available.
              </div>
            </template>

            <template v-else-if="metadataState.kind === 'text'">
              <pre class="p-3 text-gray-700 whitespace-pre-wrap font-mono">{{
                metadataState.value
              }}</pre>
            </template>

            <template v-else>
              <div class="divide-y divide-gray-100">
                <div
                  v-for="entry in metadataState.entries"
                  :key="entry.key"
                  class="p-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 hover:bg-white transition-colors"
                >
                  <span
                    class="uppercase font-bold text-gray-400 sm:w-28 flex-shrink-0 pt-0.5"
                  >
                    {{ entry.key }}
                  </span>
                  <div
                    class="text-gray-800 font-mono break-all whitespace-pre-wrap flex-1"
                  >
                    {{ entry.value }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseModal from "../BaseModal.vue";
import LoadingState from "@/components/common/LoadingState.vue";

interface LogEntry {
  id: string | number;
  level: string;
  message: string;
  source?: string;
  deviceId?: string;
  createdAt?: string;
  tags?: string[];
  actor?: string;
  actorEmail?: string;
  userId?: string | number | null;
  ipAddress?: string;
  metadata?: Record<string, unknown> | string | unknown[] | null;
}

const props = defineProps<{
  modelValue: boolean;
  log: LogEntry | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

const isLoading = computed(() => props.modelValue && !props.log);

const generalInfo = computed(() => {
  const log = props.log;
  return [
    { label: "Log ID", value: log?.id ?? "--" },
    { label: "Timestamp", value: formatTimestamp(log?.createdAt) },
    { label: "Source / Action", value: log?.source || "Unknown" },
    { label: "Device", value: log?.deviceId || "N/A" },
  ];
});

const actorInfo = computed(() => {
  const log = props.log;
  return [
    { label: "Actor", value: log?.actor || "System" },
    { label: "Actor Email", value: log?.actorEmail || "N/A" },
    {
      label: "User ID",
      value:
        typeof log?.userId === "number" || typeof log?.userId === "string"
          ? String(log?.userId)
          : "N/A",
    },
    { label: "IP Address", value: log?.ipAddress || "N/A" },
  ];
});

const metadataState = computed(() => {
  const meta = props.log?.metadata;
  if (meta === null || meta === undefined) {
    return { kind: "empty" } as const;
  }

  if (typeof meta === "string") {
    return { kind: "text", value: meta } as const;
  }

  if (Array.isArray(meta)) {
    return {
      kind: "list",
      entries: meta.map((value, index) => ({
        key: `Item ${index + 1}`,
        value: formatValue(value),
      })),
    } as const;
  }

  if (typeof meta === "object") {
    return {
      kind: "list",
      entries: Object.entries(meta).map(([key, value]) => ({
        key,
        value: formatValue(value),
      })),
    } as const;
  }

  return { kind: "text", value: formatValue(meta) } as const;
});

const levelBadgeClass = computed(() => {
  const level = String(props.log?.level ?? "info").toLowerCase();
  if (["critical", "fatal"].includes(level)) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (level === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (["warning", "warn"].includes(level)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (level === "debug") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
});

const metadataStateSummary = computed(() => {
  if (metadataState.value.kind === "empty") return "0 entries";
  if (metadataState.value.kind === "text") return "Plain text";
  return `${metadataState.value.entries.length} entries`;
});

function closeModal() {
  emit("update:modelValue", false);
}

function handleAfterLeave() {
  emit("close");
}

function formatTimestamp(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
</script>

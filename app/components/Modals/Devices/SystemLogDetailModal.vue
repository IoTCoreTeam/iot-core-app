<template>
  <BaseModal
    :model-value="modelValue"
    title="System Log Details"
    max-width="max-w-3xl"
    panel-class="p-6 shadow-xl"
    @request-close="closeModal"
    @after-leave="handleAfterLeave"
  >
    <div class="space-y-6 text-xs">
      <div v-if="!log" class="py-6 text-center text-gray-500">
        No log entry selected.
      </div>
      <template v-else>
        <div class="grid gap-4 lg:grid-cols-2">
          <section class="border border-gray-200 bg-gray-50/70 p-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-800">General</h4>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide"
                :class="levelBadgeClass"
              >
                {{ (log.level || "info").toUpperCase() }}
              </span>
            </div>
            <div class="mt-4 divide-y divide-gray-100">
              <div
                v-for="item in generalInfo"
                :key="item.label"
                class="flex items-center justify-between gap-3 py-2"
              >
                <p class="text-[11px] uppercase tracking-wide text-gray-500">
                  {{ item.label }}
                </p>
                <p class="text-sm font-semibold text-gray-900 text-right">
                  {{ item.value }}
                </p>
              </div>
            </div>
          </section>

          <section class="border border-gray-200 p-4">
            <h4 class="text-sm font-semibold text-gray-800">Actor &amp; Origin</h4>
            <div class="mt-4 divide-y divide-gray-100">
              <div
                v-for="item in actorInfo"
                :key="item.label"
                class="flex items-center justify-between gap-3 py-2"
              >
                <p class="text-[11px] uppercase tracking-wide text-gray-500">
                  {{ item.label }}
                </p>
                <p class="text-sm font-semibold text-gray-900 text-right">
                  {{ item.value }}
                </p>
              </div>
            </div>
            <div
              v-if="log.tags?.length"
              class="flex flex-wrap gap-1 mt-4 pt-3 border-t border-gray-200"
            >
              <span
                v-for="tag in log.tags"
                :key="tag"
                class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide"
              >
                {{ tag }}
              </span>
            </div>
          </section>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <section class="border border-gray-200 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] uppercase tracking-wide text-gray-500">
                  Source / Action
                </p>
                <h4 class="text-sm font-semibold text-gray-900 mt-1">
                  {{ log.source || "Unknown source" }}
                </h4>
              </div>
              <div class="text-right text-[11px] text-gray-500">
                {{ formatTimestamp(log.createdAt) }}
              </div>
            </div>

            <div
              class="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-gray-800 whitespace-pre-wrap"
            >
              {{ log.message || "No message provided." }}
            </div>
          </section>

          <section class="border border-gray-200 p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-gray-800">Metadata</h4>
              <span class="text-[11px] text-gray-500">
                {{ metadataStateSummary }}
              </span>
            </div>
            <template v-if="metadataState.kind === 'empty'">
              <p class="text-gray-500">No metadata provided.</p>
            </template>
            <template v-else-if="metadataState.kind === 'text'">
              <pre class="border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 whitespace-pre-wrap overflow-auto">
{{ metadataState.value }}
              </pre>
            </template>
            <template v-else>
              <div class="divide-y divide-gray-200 border border-gray-200">
                <div
                  v-for="entry in metadataState.entries"
                  :key="entry.key"
                  class="px-3 py-2 flex flex-col gap-1 md:flex-row md:items-start md:gap-3"
                >
                  <span class="text-[11px] uppercase tracking-wide text-gray-500 md:w-32">
                    {{ entry.key }}
                  </span>
                  <pre class="text-gray-800 text-sm whitespace-pre-wrap break-words flex-1">
{{ entry.value }}
                  </pre>
                </div>
              </div>
            </template>
          </section>
        </div>
      </template>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseModal from "../BaseModal.vue";

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
      value: typeof log?.userId === "number" || typeof log?.userId === "string"
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

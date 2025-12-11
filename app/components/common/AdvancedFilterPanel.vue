<template>
  <div class="p-3 flex flex-col gap-3">
    <div
      v-for="(row, rowIndex) in normalizedRows"
      :key="rowIndex"
      class="grid gap-3"
      :class="rowClass(row.length)"
    >
      <label
        v-for="field in row"
        :key="field.key"
        class="text-xs font-medium text-gray-600"
      >
        {{ field.label }}
        <component
          :is="field.type === 'select' ? 'select' : 'input'"
          :type="field.type === 'select' ? undefined : field.type"
          :value="localFilters[field.key] ?? ''"
          :placeholder="field.placeholder"
          :inputmode="field.inputmode"
          class="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          @input="handleInput(field, $event)"
          @change="handleChange(field, $event)"
        >
          <option
            v-if="field.type === 'select'"
            v-for="option in field.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </component>
      </label>
    </div>

    <div class="flex gap-2 mt-1">
      <button
        type="button"
        class="flex-1 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs disabled:opacity-60"
        :disabled="isLoading"
        @click="handleApply"
      >
        {{ applyLabel }}
      </button>
      <button
        type="button"
        class="flex-1 inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs border border-gray-300 disabled:opacity-60"
        :disabled="isLoading"
        @click="handleReset"
      >
        {{ resetLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";

export type FilterFieldType = "text" | "datetime-local" | "select";

export interface FilterFieldOption {
  label: string;
  value: string;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  inputmode?: string;
  options?: FilterFieldOption[];
}

export type FilterFieldRow = FilterFieldConfig[];

const props = defineProps<{
  modelValue: Record<string, string>;
  fields: FilterFieldRow[];
  isLoading?: boolean;
  applyLabel?: string;
  resetLabel?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: Record<string, string>): void;
  (event: "apply", value: Record<string, string>): void;
  (event: "reset"): void;
}>();

const localFilters = reactive<Record<string, string>>({
  ...props.modelValue,
});

const normalizedRows = computed(() =>
  props.fields.map((row) =>
    row.length === 2 &&
    row[0]?.type === "datetime-local" &&
    row[1]?.type === "datetime-local"
      ? row.map((field) => [field])
      : [row]
  ).flat()
);

watch(
  () => props.modelValue,
  (value) => {
    Object.keys(localFilters).forEach((key) => {
      delete localFilters[key];
    });
    Object.assign(localFilters, value);
  },
  { deep: true }
);

function emitModelUpdate() {
  emit("update:modelValue", { ...localFilters });
}

function handleInput(field: FilterFieldConfig, event: Event) {
  if (field.type === "select") return;
  const target = event.target as HTMLInputElement;
  localFilters[field.key] = target.value ?? "";
  emitModelUpdate();
}

function handleChange(field: FilterFieldConfig, event: Event) {
  if (field.type !== "select") return;
  const target = event.target as HTMLSelectElement;
  localFilters[field.key] = target.value ?? "";
  emitModelUpdate();
}

function handleApply() {
  emit("apply", { ...localFilters });
}

function handleReset() {
  emit("reset");
}

function rowClass(length: number) {
  if (length === 1) return "grid-cols-1";
  if (length === 2) return "grid-cols-2";
  if (length === 3) return "grid-cols-3";
  return "grid-cols-1";
}

const applyLabel = computed(() => props.applyLabel ?? "Apply");
const resetLabel = computed(() => props.resetLabel ?? "Reset");
const isLoading = computed(() => props.isLoading ?? false);
</script>
